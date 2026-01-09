ËM/** @jsx jsx */
import {
    type AllWidgetProps,
    jsx,
    DataSourceManager,
} from 'jimu-core'
import { useState } from 'react'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import ProprietarioSearchFlow from './screens/ProprietarioSearchFlow'

import { THEMES_HEX } from '../../../utils/themes'

//@ts-ignore
import ProprietarioImovel from '../../../../assets/proprietarioimovel.png';
//@ts-ignore
import VistaRua from '../../../../assets/vistaRua.png';
//@ts-ignore
import Vizinhaca from '../../../../assets/vizinhaca.png';
//@ts-ignore
import Rua from '../../../../assets/rua.png';
//@ts-ignore
import Predio from '../../../../assets/predio.png';
//@ts-ignore
import Loteamento from '../../../../assets/loteamento.png';
//@ts-ignore
import Grade from '../../../../assets/gradee.png';
//@ts-ignore
import Caixa from '../../../../assets/caixa.png';
//@ts-ignore
import Vila from '../../../../assets/vila.png';
import BairroSearchFlow from './screens/BairroSearchFlow'
import LogradouroSearchFlow from './screens/LogradouroSearchFlow'
import LoteamentoSearchFlow from './screens/LoteamentoSearchFlow'
import QuadraSearchFlow from './screens/QuadraSearchFlow'
import LoteSearchFlow from './screens/LoteSearchFlow'
import EdificacaoSearchFlow from './screens/EdificacaoSearchFlow'



interface SearchButton {
    id: string
    title: string
    description: string
    icon: string
    bgColor: string
    borderColor: string
    enabled: boolean
}

export default function Widget(props: AllWidgetProps<any>) {
    const [activeModal, setActiveModal] = useState<string | null>(null)
    const [jimuMapView, setJimuMapView] = useState<JimuMapView | null>(null)

    // fazer todas em um s√≥ padr√£o ??
    const searchButtons: SearchButton[] = [
        {
            id: 'tributario-proprietario',
            title: 'Pesquisar por Propriet√°rio',
            description: 'Propriet√°rio do im√≥vel',
            icon: ProprietarioImovel,
            bgColor: THEMES_HEX.blue.light,
            borderColor: THEMES_HEX.blue.primary,
            enabled: true
        },
        {
            id: 'tributario-bairro',
            title: 'Pesquisar por Bairro',
            description: 'Bairros da Cidade',
            icon: Vizinhaca,
            bgColor: THEMES_HEX.blue.light,
            borderColor: THEMES_HEX.blue.primary,
            enabled: true
        },
        {
            id: 'tributario-logradouro',
            title: 'Pesquisar por Logradouro',
            description: 'Logradouros da Cidade',
            icon: Rua,
            bgColor: THEMES_HEX.blue.light,
            borderColor: THEMES_HEX.blue.primary,
            enabled: true
        },
        {
            id: 'tributario-loteamento',
            title: 'Pesquisar por Loteamento',
            description: 'Loteamentos da Cidade',
            icon: Vila,
            bgColor: THEMES_HEX.blue.light,
            borderColor: THEMES_HEX.blue.primary,
            enabled: true
        },
        {
            id: 'tributario-quadra',
            title: 'Pesquisar por Quadra',
            description: 'Quadras da Cidade',
            icon: Grade,
            bgColor: THEMES_HEX.blue.light,
            borderColor: THEMES_HEX.blue.primary,
            enabled: true
        },
        {
            id: 'tributario-lote',
            title: 'Pesquisar por Lote',
            description: 'Lotes da Cidade',
            icon: Caixa,
            bgColor: THEMES_HEX.blue.light,
            borderColor: THEMES_HEX.blue.primary,
            enabled: true
        },
        {
            id: 'tributario-edificacao',
            title: 'Pesquisar por Edifica√ß√£o',
            description: 'Edifica√ß√µes da Cidade',
            icon: Predio,
            bgColor: THEMES_HEX.blue.light,
            borderColor: THEMES_HEX.blue.primary,
            enabled: true
        },

    ]

    const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        const colors = {
            success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
            error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
            warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' }
        }

        const notification = document.createElement('div')
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 999999;
            background: ${colors[type].bg}; color: ${colors[type].text};
            border: 2px solid ${colors[type].border}; border-radius: 8px;
            padding: 15px 20px; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-weight: bold;
        `
        notification.innerHTML = message
        document.body.appendChild(notification)
        setTimeout(() => document.body.removeChild(notification), 4000)
    }

    const handleButtonClick = (buttonId: string) => {
        switch (buttonId) {
            case 'tributario-proprietario':
            case 'tributario-bairro':
            case 'tributario-logradouro':
            case 'tributario-loteamento':
            case 'tributario-quadra':
            case 'tributario-lote':
            case 'tributario-edificacao':
                setActiveModal(buttonId)
                break
            default:
                showNotification('üöß Funcionalidade em desenvolvimento', 'warning')
                break
        }
    }

    const renderSearchButton = (button: SearchButton) => (
        <button
            key={button.id}
            onClick={() => handleButtonClick(button.id)}
            disabled={!button.enabled}
            style={{
                flex: 1,
                padding: '10px',
                backgroundColor: button.enabled ? button.bgColor : '#f3f4f6',
                border: `2px solid ${button.enabled ? button.borderColor : '#d1d5db'}`,
                borderRadius: '12px',
                cursor: button.enabled ? 'pointer' : 'not-allowed',
                opacity: button.enabled ? 1 : 0.6,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
            }}
        >
            <div style={{ fontSize: '24px' }}>
                <img src={button.icon} alt={button.title} style={{ width: '24px', height: '24px' }} />
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
                {button.title}
            </div>
            <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                {button.description}
            </div>
            {!button.enabled && (
                <div style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>
                    Configure a camada
                </div>
            )}
        </button>
    )

    const onActiveViewChange = (jmv: JimuMapView) => {
        if (jmv) {
            setJimuMapView(jmv)
        }
    }

    return (
        <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <div style={{
                textAlign: 'center',
                padding: '16px',
                background: 'linear-gradient(135deg, #3099D3 0%, #55CFED 100%)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0'
                }}>
                    M√≥dulo de Gest√£o e Controle do Cadastro Imobili√°rio
                </h1>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px'
            }}>
                {searchButtons.map(renderSearchButton)}
            </div>

            <div style={{ display: 'none' }}>
                {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
                    <JimuMapViewComponent
                        useMapWidgetId={props.useMapWidgetIds[0]}
                        onActiveViewChange={onActiveViewChange}
                    />
                )}
            </div>

            {activeModal === 'tributario-proprietario' && (
                <ProprietarioSearchFlow onClose={() => setActiveModal(null)} />
            )}
            {activeModal === 'tributario-bairro' && (
                <BairroSearchFlow onClose={() => setActiveModal(null)} />
            )}
            {activeModal === 'tributario-logradouro' && (
                <LogradouroSearchFlow onClose={() => setActiveModal(null)} />
            )}
            {activeModal === 'tributario-loteamento' && (
                <LoteamentoSearchFlow onClose={() => setActiveModal(null)} />
            )}
            {activeModal === 'tributario-quadra' && (
                <QuadraSearchFlow onClose={() => setActiveModal(null)} />
            )}
            {activeModal === 'tributario-lote' && (
                <LoteSearchFlow onClose={() => setActiveModal(null)} />
            )}
            {activeModal === 'tributario-edificacao' && (
                <EdificacaoSearchFlow onClose={() => setActiveModal(null)} />
            )}


        </div>
    )
}
® ®™™∂
∂ƒ ƒ∆
∆Õ Õ–
–Í ÍÌ
Ìä äê
ê™ ™∞
∞Õ Õ◊
◊Ò Ò˚
˚ô ôù
ù∑ ∑Ω
Ω⁄ 
⁄ﬂ 
ﬂ˘ ˘˛
˛ú úü
üπ πº
ºÃ 
Ãã ãå
åç çì
ì» 
»… …À
Àˇ ˇÉ
É´ ´∞
∞“ “◊
◊í íì
ìù, ù,£,
£,∞, ∞,∏,
∏,…, …,—,
—,É- É-ã-
ã-Ø- Ø-∑-
∑-«- «-—-
—-·- ·-Î-
Î-ˆ- ˆ-˜-
˜-˚- ˚-˝-
˝-Å. Å.á.
á.Ã. Ã.—.
—.◊. ◊.‹.
‹.´/ ´/µ/
µ/ƒ/ ƒ/∆/
∆/ /  /œ/
œ/—/ —/‘/
‘/ë0 ë0õ0
õ0≈0 ≈0œ0
œ0Û0 Û0˝0
˝0≤1 ≤1º1
º1»1 »1 1
 1œ1 œ1—1
—1”1 ”1ÿ1
ÿ1‡1 ‡1·1
·1Û1 Û1˝1
˝1ù2 ù2ß2
ß2ƒ2 ƒ2Œ2
Œ2ı2 ı2ˇ2
ˇ2Ö3 Ö3Ü3
Ü3â3 â3å3
å3è3 è3í3
í3ù3 ù3£3
£3¶3 ¶3Æ3
Æ3≥3 ≥3¥3
¥3µ3 
µ3‘3 
‘3‹3 ‹3Î3
Î3ò4 
ò4ô4 
ô4¢4 ¢4£4
£4≤4 ≤4≥4
≥4∂4 
∂4º4 
º4æ4 æ4ø4
ø4«4 «4…4
…4 4  4Õ4
Õ4Œ4 Œ4–4
–4Î4 
Î4Ï4 
Ï4ˇ4 
ˇ4Ä5 
Ä5å5 å5ç5
ç5•5 •5©5
©5Ø5 Ø5µ5
µ5À5 À5”5
”5„5 „5Î5
Î5¯5 
¯5˘5 
˘5Ö6 Ö6Ü6
Ü6ï6 ï6ó6
ó6ô6 
ô6ö6 
ö6≠6 ≠6±6
±6≥6 ≥6∂6
∂6∫6 ∫6Ω6
Ω6Ÿ6 Ÿ6·6
·6Ò6 Ò6˘6
˘6ê7 ê7ö7
ö7≠7 
≠7Æ7 
Æ7…7 …7Ã7
Ã7Œ7 
Œ7Î7 
Î7Ô7 
Ô7Ù7 
Ù7ñ8 ñ8†8
†8¨8 ¨8¥8
¥8∫8 ∫8¿8
¿8À8 À8œ8
œ8·< 
·<Á< 
Á<Ì< 
Ì<Û< 
Û<≠A ≠AÆA
ÆAËM 2Çfile:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/gestao-imobiliaria-pesquisas/src/runtime/widget.tsx