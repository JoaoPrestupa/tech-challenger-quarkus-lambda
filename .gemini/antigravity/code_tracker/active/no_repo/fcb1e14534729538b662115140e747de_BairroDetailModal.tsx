�I/** @jsx jsx */
import { jsx, React } from 'jimu-core';
import { useState, useEffect } from 'react';
//@ts-ignore
import { http } from '../../../../../../http/http';
import { BairroResponseDTO } from '../../../../../../types/Imobiliario';
import BaseModal from '../../../../../../components/BaseModal';
import { DetailField, DetailSection, DetailCard } from '../../../../../../components/DetailComponents';
import { formatters } from '../../../../../../components/table/tableConfig';
import GenericTable, { TableColumn } from '../../../../../../components/table/GenericTable';
import { useBairro } from '../../hooks/useBairro';
import ExportButtons from '../../../../../../components/ExportButtons/ExportButtons';
import { useCep, CepResponseDTO } from '../../../../../../hooks/useCep';

interface SecaoValorMetroQuadradoDTO {
    secao: string;
    valorPorMetroQuadrado: string;
}

interface BairroDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    cdbairro: string;
    nmbairro?: string;
}

const BairroDetailModal: React.FC<BairroDetailModalProps> = ({ isOpen, onClose, cdbairro, nmbairro }) => {
    const [bairroDetalhado, setBairroDetalhado] = useState<BairroResponseDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quantidadeLotes, setQuantidadeLotes] = useState<number | null>(null);
    const [secoesValorMetroQuadrado, setSecoesValorMetroQuadrado] = useState<SecaoValorMetroQuadradoDTO[]>([]);
    const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

    // Estado para CEP
    const [cepField, setCepField] = useState<string>('');
    const [isLoadingCep, setIsLoadingCep] = useState(false);
    const [isUpdatingField, setIsUpdatingField] = useState(false);

    const { fetchBairroDetails, fetchQuantidadeLotes, fetchSecoesValorMetroQuadrado, calcularValorMedio, formatQuantidade, formatValorMonetario } = useBairro();
    const { buscarCepPorBairro, formatarCep } = useCep();

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(10);
    const bairroColumns: TableColumn<SecaoValorMetroQuadradoDTO>[] = [
        { key: 'secao', label: 'Seção', align: 'left' },
        { key: 'valorPorMetroQuadrado', label: 'Valor por m²', align: 'left', format: formatters.currency }
    ]

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    useEffect(() => {
        if (isOpen && cdbairro) {
            fetchBairroDetails({
                setIsloading: setIsLoading,
                setError,
                setBairroDetalhado,
                cdbairro,
                fetchQuantidadeLotes: () => fetchQuantidadeLotes({ setQuantidadeLotes, cdbairro }),
                setSecoesValorMetroQuadrado
            });
        }
    }, [isOpen, cdbairro]);

    // Buscar CEP quando o bairro detalhado for carregado e atualizar o campo
    useEffect(() => {
        if (bairroDetalhado && nmbairro) {
            buscarCepEAtualizarCampo();
        }
    }, [bairroDetalhado, nmbairro]);

    const buscarCepEAtualizarCampo = async () => {
        if (!nmbairro) return;

        setIsLoadingCep(true);
        setIsUpdatingField(true);
        try {
            const uf = 'MG';
            const cidade = 'Ipatinga';
            
            console.log(`Buscando CEP para bairro: ${nmbairro} (${uf}/${cidade})`);
            const resultado = await buscarCepPorBairro(uf, cidade, nmbairro);
            
            if (resultado) {
                console.log("CEP encontrado:", resultado);
                setCepField(formatarCep(resultado.cep));
            } else {
                console.log("Nenhum CEP encontrado para o bairro");
                setCepField('');
            }
        } catch (err) {
            console.error('Erro ao buscar CEP do bairro:', err);
            setCepField('');
        } finally {
            setIsLoadingCep(false);
            setIsUpdatingField(false);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Detalhes do Bairro${nmbairro ? ` - ${nmbairro}` : ''}`}
            isLoading={isLoading}
            error={error}
            maxWidth="1200px"
            maxHeight='90vh'
        >
            {bairroDetalhado && (
                <DetailSection title="Informações do Bairro">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '20px'
                    }}>
                        <DetailCard title="Dados Principais">
                            <DetailField
                                label="Código do Bairro"
                                value={bairroDetalhado.cdbairro}
                                isHighlight={true}
                            />
                            <DetailField
                                label="Nome do Bairro"
                                value={bairroDetalhado.nmbairro}
                                isHighlight={true}
                            />
                            <DetailField
                                label="Zona"
                                value={bairroDetalhado.cdzonabair}
                            />
                            <DetailField
                                label="Região"
                                value={bairroDetalhado.regiao}
                            />
                        </DetailCard>

                        <DetailCard title="Informações Adicionais">
                            <DetailField
                                label="Quantidade de Lotes no Bairro"
                                value={formatQuantidade(quantidadeLotes)}
                                isHighlight={true}
                            />
                            <DetailField
                                label="Valor Médio por Metro Quadrado"
                                value={formatValorMonetario(calcularValorMedio({ secoesValorMetroQuadrado }))}
                                isHighlight={true}
                            />
                            <DetailField
                                label="CEP"
                                value={
                                    isUpdatingField 
                                        ? '🔄 Carregando...' 
                                        : cepField || 'Não informado'
                                }
                                isHighlight={!!cepField && cepField !== ''}
                            />
                        </DetailCard>
                    </div>
                </DetailSection>
            )}

            {secoesValorMetroQuadrado.length > 0 && (
                <GenericTable
                    columns={bairroColumns}
                    data={secoesValorMetroQuadrado}
                    title="Seções com Valor por Metro Quadrado"
                    currentPage={currentPage}
                    totalItems={secoesValorMetroQuadrado.length}
                    totalPages={Math.ceil(secoesValorMetroQuadrado.length / pageSize)}
                    pageSize={pageSize}
                    isLoading={isLoading}
                    onPageChange={handlePageChange}
                    emptyMessage='Nenhum dado disponível'
                    showPagination={true}
                    maxHeight='400px'
                />
            )}

            <ExportButtons
                data={secoesValorMetroQuadrado}
                config={{
                    fileName: `bairro_${cdbairro}_${nmbairro?.replace(/[^\w\s]/gi, '')}`,
                    sheetName: 'Dados do Bairro',
                    title: 'DETALHES DO BAIRRO',
                    subtitle: `Bairro: ${nmbairro} (${cdbairro})`,
                    includeLogo: true,
                    orientation: 'portrait',
                    theme: 'blue',
                    referenciaId: cdbairro,
                    additionalData: bairroDetalhado ? {
                        sectionTitle: 'DADOS DO BAIRRO',
                        data: [{
                            'Código do Bairro': bairroDetalhado.cdbairro,
                            'Nome do Bairro': bairroDetalhado.nmbairro,
                            'Zona': bairroDetalhado.cdzonabair,
                            'Região': bairroDetalhado.regiao,
                            'Quantidade de Lotes': formatQuantidade(quantidadeLotes),
                            'Valor Médio por m²': formatValorMonetario(calcularValorMedio({ secoesValorMetroQuadrado })),
                            'CEP': cepField || 'Não informado'
                        }]
                    } : undefined
                }}
                xmlConfig={{
                    entityName: 'Bairro',
                    identifier: cdbairro
                }}
                formats={['XLS', 'CSV', 'PDF', 'XML']}
            />


        </BaseModal>
    );
};

export default BairroDetailModal;
�I2�file:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/gestao-imobiliaria-pesquisas/src/runtime/screens/detail/BairroDetailModal.tsx