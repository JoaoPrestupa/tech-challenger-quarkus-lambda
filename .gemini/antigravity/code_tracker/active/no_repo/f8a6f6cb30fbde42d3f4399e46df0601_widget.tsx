´°/** @jsx jsx */
import { jsx, AllWidgetProps, DataSourceManager, FeatureLayerDataSource } from 'jimu-core';
import { useState, useEffect, useRef } from 'react';
import { IMConfig } from '../config';
import { type JimuMapView, JimuMapViewComponent } from 'jimu-arcgis';
import type Point from 'esri/geometry/Point';
import Query from 'esri/rest/support/Query';
import Graphic from 'esri/Graphic';
import SimpleFillSymbol from 'esri/symbols/SimpleFillSymbol';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { useBicData } from './hooks/useBicData';
import SearchSection from './components/SearchSection';
import BicDataDisplay from './components/BicDataDisplay';
import LoadingScreen from './components/LoadingScreen';

interface BicData {
    sqls: string;
    chave: string;
    inscrmunic: string;
    nomeproprietario: string;
    lote?: string;
    quadra?: string;
    setor?: string;
    cdbairro?: string;
    edificacoes?: EdificacaoData[];

    // Dados do cadastro imobili\u00e1rio geral
    cadastro?: number;
    tipoCadastro?: number;
    situacao?: number;
    matricula?: string | null;
    dataCadastro?: string;
    observacao?: string | null;
    profundidade?: number;
    areaTerritorial?: number;
    afastamento?: number;
    pavimentos?: number;
    areaConstruida?: number;
    totalConstruida?: number;
    logradouro?: string;
    cep?: number;
    numero?: number;
    bairro?: string;
    cidade?: string;
    complemento?: string | null;
}

interface EdificacaoData {
    objectId: number;
    chave: string;
    chaveEdif: string;
    nome: string;
    geometry: __esri.Geometry | null;
    attributes: any;
    distancia: number;
    chaveLote: string;
    chaveEdificacao: string;
    nomeProprietario: string;
}

export default function Widget(props: AllWidgetProps<IMConfig>) {
    const [dataSource, setDataSource] = useState<FeatureLayerDataSource | null>(null);
    const [selectedBic, setSelectedBic] = useState<BicData | null>(null);
    const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null);
    const [enableMapClick, setEnableMapClick] = useState<boolean>(false);
    const [showMapClickInfo, setShowMapClickInfo] = useState(true);

    const mapClickHandleRef = useRef<__esri.Handle | null>(null);

    // DataSource Manager

    const {
        loadBicData,
        edificacoes,
        isLoading,
        loadingMessage,
        error
    } = useBicData();

    // useEffect para gerenciar o listener de clique no mapa
    useEffect(() => {
        const dsManager = DataSourceManager.getInstance();
        const loteDataSourceId = props.config?.loteLayerDataSource?.dataSourceId;

        if (!loteDataSourceId) return;

        // Tenta pegar se jÃ¡ existir
        const existingDs = dsManager.getDataSource(loteDataSourceId) as FeatureLayerDataSource;
        if (existingDs) {
            setDataSource(existingDs);
            console.log('DataSource jÃ¡ existente:', existingDs);
            return;
        }

        // Escuta quando a DataSource for criada
        const handleDsCreated = (ds: DataSource) => {
            if (ds.id === loteDataSourceId) {
                setDataSource(ds as FeatureLayerDataSource);
                console.log('DataSource criada:', ds);
            }
        };

        dsManager.on('dataSourceCreated', handleDsCreated);

        return () => {
            dsManager.off('dataSourceCreated', handleDsCreated);
        };
    }, [props.config]);
    // Adicione dependÃªncia para quando a configuraÃ§Ã£o mudar // DependÃªncia para quando a configuraÃ§Ã£o mudar

    useEffect(() => {
        if (!jimuMapView || !enableMapClick || !dataSource) return;

        const handleClick = async (evt: __esri.ViewClickEvent) => {
            console.log("ğŸ—ºï¸ Mapa clicado!");

            try {
                const mapPoint = jimuMapView.view.toMap({ x: evt.x, y: evt.y });

                const query = new Query();
                query.geometry = mapPoint;
                query.spatialRelationship = 'intersects';
                query.returnGeometry = true;
                query.outFields = ['inscricao'];
                query.where = '1=1';

                // Certifique-se de que o dataSource e sua camada estejam disponÃ­veis
                if (dataSource?.layer) {
                    const featureLayer = dataSource.layer as __esri.FeatureLayer;
                    const queryResult = await featureLayer.queryFeatures(query);

                    if (queryResult.features && queryResult.features.length > 0) {
                        const feature = queryResult.features[0];
                        const inscricao = feature.attributes.inscricao;

                        if (inscricao) {
                            console.log("âœ… InscriÃ§Ã£o encontrada:", inscricao);
                            // Continue com a lÃ³gica de BIC e destacar lote
                        }
                    } else {
                        console.warn('âš ï¸ Nenhum lote encontrado no ponto clicado');
                    }
                }
            } catch (error) {
                console.error('âŒ Erro ao processar clique no mapa:', error);
            }
        };

        const clickHandle = jimuMapView.view.on('click', handleClick);
        mapClickHandleRef.current = clickHandle;

        return () => {
            clickHandle.remove();
            mapClickHandleRef.current = null;
            console.log("ğŸ§¹ Listener de mapa removido");
        };
    }, [jimuMapView, enableMapClick, dataSource, loadBicData]); const handleSelectBic = async (item: any) => {
        try {
            const result = await loadBicData(item);
            if (result) {
                setSelectedBic(result);

                // Zoom no lote quando pesquisar
                if (result.inscrmunic) {
                    await zoomToLote(result.inscrmunic);
                }
            }
        } catch (err: any) {
            console.error('âŒ Erro ao carregar BIC:', err);
        }
    };
    console.log("dataSource e", dataSource);
    // FunÃ§Ã£o para destacar lote no mapa
    const highlightLoteOnMap = async (inscricao: string, geometry?: __esri.Geometry) => {
        if (!jimuMapView) return;

        try {
            jimuMapView.view.graphics.removeAll();

            let loteGeometry = geometry;

            // Se nÃ£o tem geometria, buscar da layer
            if (!loteGeometry && dataSource) {
                const query = new Query();
                query.where = `inscricao = '${inscricao}'`;
                query.outFields = ['*'];
                query.returnGeometry = true;

                const featureLayer = dataSource.layer as __esri.FeatureLayer;
                const result = await featureLayer.queryFeatures(query);

                if (result.features && result.features.length > 0) {
                    loteGeometry = result.features[0].geometry;
                }
            }

            if (loteGeometry) {
                const symbol = new SimpleFillSymbol({
                    color: [255, 255, 0, 0.3],
                    outline: {
                        color: [255, 165, 0],
                        width: 3
                    }
                });

                const graphic = new Graphic({
                    geometry: loteGeometry,
                    symbol: symbol
                });

                jimuMapView.view.graphics.add(graphic);

                await jimuMapView.view.goTo(loteGeometry, {
                    duration: 1000
                });
            }
        } catch (err) {
            console.error('Erro ao destacar lote:', err);
        }
    };

    // FunÃ§Ã£o para validar formato da inscriÃ§Ã£o
    const validarFormatoInscricao = (inscricao: string): boolean => {
        if (!inscricao) return false;

        // Formato 1: XXX-XXX-XXXX (com hÃ­fens, sem sublote)
        const formato1 = /^\d{3}-\d{3}-\d{4}$/;

        // Formato 2: XXX.XXX.XXXX.XXX (com pontos e sublote)
        const formato2 = /^\d{3}\.\d{3}\.\d{4}\.\d{3}$/;

        // Formato 3: XXX-XXX-XXXX-XXX (com hÃ­fens e sublote)
        const formato3 = /^\d{3}-\d{3}-\d{4}-\d{3}$/;

        return formato1.test(inscricao) || formato2.test(inscricao) || formato3.test(inscricao);
    };

    // FunÃ§Ã£o para converter formato de inscriÃ§Ã£o
    const converterInscricao = (inscricao: string): string => {
        // Remove pontos da inscriÃ§Ã£o
        const inscricaoLimpa = inscricao.replace(/\./g, '');

        // Se jÃ¡ estÃ¡ no formato com hÃ­fens, retorna como estÃ¡
        if (inscricao.includes('-')) {
            return inscricao;
        }

        // Converte para o formato do mapa: XXX-XXX-XXXX-XXX
        if (inscricaoLimpa.length >= 10) {
            const setor = inscricaoLimpa.substring(0, 3);
            const quadra = inscricaoLimpa.substring(3, 6);
            const lote = inscricaoLimpa.substring(6, 10);
            const sublote = inscricaoLimpa.substring(10) || '001';

            return `${setor}-${quadra}-${lote}-${sublote}`;
        }

        return inscricao;
    };

    // FunÃ§Ã£o para zoom no lote
    const zoomToLote = async (inscricao: string) => {
        console.log('ğŸ” zoomToLote iniciado para:', inscricao);

        if (!jimuMapView || !dataSource) {
            console.warn('âš ï¸ zoomToLote: jimuMapView ou dataSource nÃ£o disponÃ­vel');
            return;
        }

        try {
            const featureLayer = dataSource.layer as __esri.FeatureLayer;
            console.log('ğŸ“ FeatureLayer:', featureLayer.title || featureLayer.id);

            // Converter inscriÃ§Ã£o para o formato do mapa
            const inscricaoFormatada = converterInscricao(inscricao);
            console.log('ğŸ“ InscriÃ§Ã£o original:', inscricao);
            console.log('ğŸ“ InscriÃ§Ã£o formatada:', inscricaoFormatada);

            // Tentar mÃºltiplos formatos
            const formatos = [
                inscricao,                              // Original (115.249.0178.001)
                inscricaoFormatada,                     // Formatada (115-249-0178-001)
                inscricao.replace(/\./g, '-'),         // Trocar pontos por hÃ­fens
                inscricao.replace(/\./g, ''),          // Sem separadores
            ];

            let featureEncontrada = null;

            for (const formato of formatos) {
                console.log('ğŸ” Tentando formato:', formato);

                const query = new Query();
                query.where = `inscricao = '${formato}'`;
                query.outFields = ['*'];
                query.returnGeometry = true;

                const result = await featureLayer.queryFeatures(query);

                if (result.features && result.features.length > 0) {
                    console.log('âœ… Feature encontrada com formato:', formato);
                    featureEncontrada = result.features[0];
                    break;
                }
            }

            if (featureEncontrada) {
                const geometry = featureEncontrada.geometry;
                console.log('ğŸ“ Geometria encontrada:', geometry?.type);
                await highlightLoteOnMap(inscricao, geometry);
            } else {
                console.warn('âš ï¸ Nenhuma feature encontrada para a inscriÃ§Ã£o:', inscricao);
                console.warn('âš ï¸ Formatos tentados:', formatos);
            }
        } catch (err) {
            console.error('âŒ Erro ao fazer zoom no lote:', err);
        }
    };

    const handleNewSearch = () => {
        // Limpar grÃ¡ficos do mapa
        if (jimuMapView?.view) {
            jimuMapView.view.graphics.removeAll();
        }

        // Resetar estados
        setSelectedBic(null);
        setShowMapClickInfo(true);
    };

    const handleShowInMap = async () => {
        console.log('ğŸ—ºï¸ handleShowInMap chamado');
        console.log('selectedBic:', selectedBic);
        console.log('inscrmunic:', selectedBic?.inscrmunic);
        console.log('jimuMapView:', jimuMapView);
        console.log('dataSource:', dataSource);

        if (!selectedBic || !selectedBic.inscrmunic) {
            console.warn('âš ï¸ selectedBic ou inscrmunic nÃ£o disponÃ­vel');
            return;
        }

        if (!jimuMapView) {
            console.warn('âš ï¸ jimuMapView nÃ£o disponÃ­vel');
            return;
        }

        if (!dataSource) {
            console.warn('âš ï¸ dataSource nÃ£o configurado');
            return;
        }

        console.log('âœ… Chamando zoomToLote para:', selectedBic.inscrmunic);
        await zoomToLote(selectedBic.inscrmunic);
    };

    const mainContainerStyle: React.CSSProperties = {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    };

    const titleContainerStyle: React.CSSProperties = {
        textAlign: 'center',
        padding: '14px',
        width: '800px',
        background: 'linear-gradient(135deg, #3099D3 0%, #55CFED 100%)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '20px',
        fontWeight: 'bold',
        color: 'white',
        margin: '0'
    };

    const contentContainerStyle: React.CSSProperties = {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        overflow: 'hidden',
        minHeight: 0
    };

    return (
        <div style={mainContainerStyle}>
            {/* JimuMapViewComponent para conectar ao mapa */}
            <JimuMapViewComponent
                useMapWidgetId={props.useMapWidgetIds?.[0]}
                onActiveViewChange={(jmv) => {
                    if (jmv) {
                        setJimuMapView(jmv);
                    }
                }}
            />

            {/* Header */}
            <div style={titleContainerStyle}>
                <h1 style={titleStyle}>
                    ğŸ  BIC - Boletim de InformaÃ§Ã£o Cadastral
                </h1>
            </div>

            {/* Content */}
            <div style={contentContainerStyle}>
                {/* BotÃ£o Toggle e Banner Informativo */}
                {!selectedBic && (
                    <div css={{
                        display: 'flex',
                        gap: 'clamp(8px, 1.5vw, 12px)',
                        alignItems: 'stretch',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                        backgroundColor: '#fff',
                        padding: '16px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        {/* BotÃ£o para ativar/desativar busca no mapa */}
                        <button
                            onClick={() => {
                                if (!dataSource) {
                                    console.log('ID da DataSource:', props.config?.loteLayerDataSource?.dataSourceId);
                                    console.log('DataSource:', dataSource);
                                    alert('âš ï¸ ConfiguraÃ§Ã£o NecessÃ¡ria\n\nPara usar a busca por clique no mapa, vocÃª precisa:\n\n1. Ir em "ConfiguraÃ§Ãµes" do widget\n2. Adicionar um "Data source" na aba "Dados"\n3. Selecionar a camada de lotes\n4. Salvar as configuraÃ§Ãµes');
                                    return;
                                }
                                const newState = !enableMapClick;
                                setEnableMapClick(newState);
                            }}
                            css={{
                                padding: 'clamp(10px, 1.5vw, 12px) clamp(16px, 2.5vw, 20px)',
                                backgroundColor: !dataSource ? '#ef4444' : (enableMapClick ? '#10b981' : '#6b7280'),
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: 'clamp(12px, 1.8vw, 14px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'clamp(6px, 1vw, 8px)',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                                }
                            }}
                        >
                            <span css={{ fontSize: 'clamp(16px, 2vw, 18px)' }}>
                                {!dataSource ? 'âš ï¸' : (enableMapClick ? 'âœ“' : 'ğŸ—ºï¸')}
                            </span>
                            {!dataSource ? 'Configurar Data Source' : (enableMapClick ? 'Busca no Mapa Ativa' : 'Buscar atravÃ©s do Mapa')}
                        </button>

                        {/* Banner informativo */}
                        {!dataSource ? (
                            <div css={{
                                flex: 1,
                                backgroundColor: '#fee2e2',
                                border: '2px solid #ef4444',
                                borderRadius: '8px',
                                padding: 'clamp(10px, 1.5vw, 12px) clamp(12px, 2vw, 16px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'clamp(8px, 1.5vw, 12px)',
                                minWidth: 0
                            }}>
                                <span css={{ fontSize: 'clamp(18px, 2.5vw, 24px)', flexShrink: 0 }}>âš ï¸</span>
                                <span css={{
                                    color: '#991b1b',
                                    fontWeight: '600',
                                    fontSize: 'clamp(11px, 1.6vw, 14px)',
                                    lineHeight: '1.4'
                                }}>
                                    <strong>Data Source nÃ£o configurado!</strong> Clique no botÃ£o vermelho para instruÃ§Ãµes de configuraÃ§Ã£o.
                                </span>
                            </div>
                        ) : showMapClickInfo && (
                            <div css={{
                                flex: 1,
                                backgroundColor: '#e7f3ff',
                                border: '2px solid #3b82f6',
                                borderRadius: '8px',
                                padding: 'clamp(10px, 1.5vw, 12px) clamp(12px, 2vw, 16px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                minWidth: 0
                            }}>
                                <div css={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)', minWidth: 0, flex: 1 }}>
                                    <span css={{ fontSize: 'clamp(18px, 2.5vw, 24px)', flexShrink: 0 }}>ğŸ’¡</span>
                                    <span css={{
                                        color: '#1e40af',
                                        fontWeight: '500',
                                        fontSize: 'clamp(11px, 1.6vw, 14px)',
                                        lineHeight: '1.4'
                                    }}>
                                        {enableMapClick
                                            ? 'Clique em um lote no mapa para gerar o BIC automaticamente'
                                            : 'Ative o botÃ£o "Buscar atravÃ©s do Mapa" para selecionar lotes clicando no mapa'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowMapClickInfo(false)}
                                    css={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: 'clamp(14px, 2vw, 18px)',
                                        cursor: 'pointer',
                                        color: '#6b7280',
                                        padding: '4px 8px',
                                        flexShrink: 0,
                                        '&:hover': {
                                            color: '#1e40af'
                                        }
                                    }}
                                >
                                    âœ•
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!selectedBic ? (
                    <SearchSection onSelectBic={handleSelectBic} />
                ) : (
                    <BicDataDisplay
                        bicData={selectedBic}
                        onNewSearch={handleNewSearch}
                        onShowInMap={handleShowInMap}
                    />
                )}
            </div>

            {/* Loading Screen */}
            <LoadingScreen
                isActive={isLoading}
                message={loadingMessage}
            />
        </div>
    );
}
Ó Ó
é é»»Á
Áâ ââ
â§ §§
§Ä ÄÄ
Ä ‘
‘“ “”
”§ 
§¶ 
¶º ºÀ
ÀÄ ÄÏ
ÏĞ 
Ğ¦ 
¦¨ ¨É
ÉÊ ÊÌ
ÌÎ ÎÖ
ÖØ Øß
ßà àã
ãå 
åò 
òó óø
øù 
ù† 
†” ”¤
¤Ï ÏÏ
Ï” ””
”É ÉÉ
É° °°
°Ë! Ë!Ë!
Ë!Û! Û!á"
á" #  #¢#
¢#²# ²#´#
´#ô# ô#ø#
ø#È$ È$Ì$
Ì$% %¢%
¢%Õ% Õ%Õ%
Õ%é% é%í%
í%ÿ% ÿ%€&
€&˜& ˜&›&
›&Ó& Ó&Ó&
Ó&ì& ì&í&
í&ò& ò&ó&
ó&ø& ø&û&
û&€' €''
'‚' ‚'„'
„'Š' Š'‹'
‹'Œ' Œ''
'’' ’'“'
“'™' ™'š'
š'Ú' Ú'Ş'
Ş'±( ±(È(
È(é) é)é)
é)å* å*å*
å*œ, œ,œ,
œ,Ÿ, 
Ÿ,‘. ‘.‘.
‘.¸0 ¸0¿0
¿0Ó0 
Ó0Õ0 
Õ0ä0 
ä0’2 ’2’2
’2×2 ×2×2
×2ƒ3 ƒ3ƒ3
ƒ3­5 ­5­5
­5Ç6 Ç6Ç6
Ç6ò7 ò7ò7
ò7™: ™:™:
™:°; °;°;
°;ë; ë;ë;
ë;ş> ş>ş>
ş>ğ? ğ?ğ?
ğ?ë@ ë@ë@
ë@äA äAäA
äA±D ±D±D
±DÉE ÉEÉE
ÉE«H «H«H
«HõH õHõH
õH¹J ¹J¹J
¹JãK ãKãK
ãK–M –M–M
–M¬O ¬O¬O
¬OÚR ÚRÚR
ÚR‡S ‡S‡S
‡SùS ùSùS
ùSºU ºUºU
ºU…V …V…V
…VšX šXšX
šX÷] ÷]÷]
÷]›a ›a›a
›aÅb ÅbÅb
ÅbÆc ÆcÆc
ÆcÅd ÅdÅd
Åd£h £h¥h
¥h³h 
³hÌh 
Ìhòh òhóh
óhôh ôhøh
øhşh şh„i
„iøy 
øy½{ ½{ÀŒ 
ÀŒŞ–Ş–À« 
À«Â«Â«´° 2nfile:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/bic-rest/src/runtime/widget.tsx