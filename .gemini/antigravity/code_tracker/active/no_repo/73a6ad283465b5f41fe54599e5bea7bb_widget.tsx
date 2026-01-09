��/** @jsx jsx */
import { type AllWidgetProps, DataSourceManager, FeatureLayerDataSource, jsx } from 'jimu-core'
import { useState } from 'react'
import type { IMConfig } from '../config'
import { type JimuMapView, JimuMapViewComponent } from 'jimu-arcgis'
import type Point from 'esri/geometry/Point'
import Query from 'esri/rest/support/Query'
import { Button } from 'jimu-ui'
import { ModalDropDown } from '../../../components/modal/ModalDropDown'
import { useBeiralDiscount } from '../../../hooks/beiral-discount/useBeiralDiscount'
import { useExportExcel } from '../../../hooks/useExportExcel'

interface EdificacaoInfo {
  id: number
  originalArea: number
  discountedArea: number
  attributes: any
  tipo: string // Novo campo para identificar o tipo
}

export interface EdificacoesPorTipo {
  edificacaoLayerDataSource: EdificacaoInfo[]
  edificacao2PavLayerDataSource: EdificacaoInfo[]
  edificacao3PavLayerDataSource: EdificacaoInfo[]
  edificacao4PavLayerDataSource: EdificacaoInfo[]
  edificacao5PavLayerDataSource: EdificacaoInfo[]
}

export default function (props: AllWidgetProps<IMConfig>) {
  const [loteInfo, setLoteInfo] = useState({
    OBJECTID: '',
    CHAVE: '',
    geometry: null as __esri.Polygon | null
  })

  // Estados consolidados
  const [edificacoesPorTipo, setEdificacoesPorTipo] = useState<EdificacoesPorTipo>({
    edificacaoLayerDataSource: [],
    edificacao2PavLayerDataSource: [],
    edificacao3PavLayerDataSource: [],
    edificacao4PavLayerDataSource: [],
    edificacao5PavLayerDataSource: []
  })

  const [debugInfo, setDebugInfo] = useState<string>('')
  const [showDebug, setShowDebug] = useState<boolean>(false)
  const [showResultModal, setShowResultModal] = useState<boolean>(false)
  const [appliedDiscount, setAppliedDiscount] = useState<string>('')
  const [discountValueInput, setDiscountValueInput] = useState<string>('')

  const dsManager = DataSourceManager.getInstance()

  // Data Sources
  const loteDataSourceId = props.config?.loteLayerDataSource?.dataSourceId
  const loteDataSource = loteDataSourceId ? dsManager.getDataSource(loteDataSourceId) as FeatureLayerDataSource : null

  const edificacaoDataSourceId = props.config?.edificacaoLayerDataSource?.dataSourceId
  const edificacaoDataSource = edificacaoDataSourceId ? dsManager.getDataSource(edificacaoDataSourceId) as FeatureLayerDataSource : null

  const edificacao2PavimentoDataSourceId = props.config?.edificacao2PavLayerDataSource?.dataSourceId
  const edificacao2PavimentoDataSource = edificacao2PavimentoDataSourceId ? dsManager.getDataSource(edificacao2PavimentoDataSourceId) as FeatureLayerDataSource : null

  const edificacao3PavimentoDataSourceId = props.config?.edificacao3PavLayerDataSource?.dataSourceId
  const edificacao3PavimentoDataSource = edificacao3PavimentoDataSourceId ? dsManager.getDataSource(edificacao3PavimentoDataSourceId) as FeatureLayerDataSource : null

  const edificacao4PavimentoDataSourceId = props.config?.edificacao4PavLayerDataSource?.dataSourceId
  const edificacao4PavimentoDataSource = edificacao4PavimentoDataSourceId ? dsManager.getDataSource(edificacao4PavimentoDataSourceId) as FeatureLayerDataSource : null

  const edificacao5PavimentoDataSourceId = props.config?.edificacao5PavLayerDataSource?.dataSourceId
  const edificacao5PavimentoDataSource = edificacao5PavimentoDataSourceId ? dsManager.getDataSource(edificacao5PavimentoDataSourceId) as FeatureLayerDataSource : null

  const handleGenerateDiscount = useBeiralDiscount()
  const { exportToExcel } = useExportExcel()

  const extractShapeArea = (attributes: any): number => {
    const possibleAreaFields = ['Shape.STArea()']

    for (const fieldName of possibleAreaFields) {
      if (attributes[fieldName] !== undefined && attributes[fieldName] !== null) {
        const value = parseFloat(attributes[fieldName])
        if (!isNaN(value) && value > 0) {
          return value
        }
      }
    }
    return 0
  }

  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (!jmv) return

    jmv.view.on('click', async evt => {
      const pt: Point = jmv.view.toMap({ x: evt.x, y: evt.y }) as Point

      setDebugInfo('')
      setShowResultModal(false)
      setEdificacoesPorTipo({
        edificacaoLayerDataSource: [],
        edificacao2PavLayerDataSource: [],
        edificacao3PavLayerDataSource: [],
        edificacao4PavLayerDataSource: [],
        edificacao5PavLayerDataSource: []
      })

      if (!loteDataSource) {
        setDebugInfo('❌ Configure as camadas nas configurações')
        return
      }

      const loteQuery = new Query({
        geometry: pt,
        spatialRelationship: 'intersects',
        returnGeometry: true,
        outFields: ['*'],
        where: '1=1'
      })

      const loteFeatureLayer = loteDataSource.layer as __esri.FeatureLayer
      setDebugInfo('🔍 Buscando lote...')

      try {
        const loteResult = await loteFeatureLayer.queryFeatures(loteQuery)

        if (loteResult.features.length === 0) {
          setDebugInfo('❌ Nenhum lote encontrado')
          setLoteInfo({ OBJECTID: '', CHAVE: '', geometry: null })
          return
        }

        const loteFeature = loteResult.features[0]
        const loteGeom = loteFeature.geometry as __esri.Polygon
        const loteAttr = loteFeature.attributes

        setLoteInfo({
          OBJECTID: loteAttr.OBJECTID?.toString() || '',
          CHAVE: loteAttr.CHAVE || `Lote ${loteAttr.OBJECTID}`,
          geometry: loteGeom
        })

        // Query para edificações
        const edificacoesQuery = new Query({
          geometry: loteGeom,
          spatialRelationship: 'contains',
          returnGeometry: false,
          outFields: ['*'],
          where: '1=1'
        })

        // Array para armazenar todas as promises
        const queries = []
        const novasEdificacoes: EdificacoesPorTipo = {
          edificacaoLayerDataSource: [],
          edificacao2PavLayerDataSource: [],
          edificacao3PavLayerDataSource: [],
          edificacao4PavLayerDataSource: [],
          edificacao5PavLayerDataSource: []
        }

        // 1 Pavimento
        if (edificacaoDataSource) {
          const layer1Pav = edificacaoDataSource.layer as __esri.FeatureLayer
          queries.push(
            layer1Pav.queryFeatures(edificacoesQuery).then(result => {
              novasEdificacoes.edificacaoLayerDataSource = result.features.map(feature => ({
                id: feature.attributes.OBJECTID,
                originalArea: extractShapeArea(feature.attributes),
                discountedArea: extractShapeArea(feature.attributes),
                attributes: feature.attributes,
                tipo: '1 Pavimento'
              }))
            }).catch(() => {
              novasEdificacoes.edificacaoLayerDataSource = []
            })
          )
        }

        // 2 Pavimentos
        if (edificacao2PavimentoDataSource) {
          const layer2Pav = edificacao2PavimentoDataSource.layer as __esri.FeatureLayer
          queries.push(
            layer2Pav.queryFeatures(edificacoesQuery).then(result => {
              novasEdificacoes.edificacao2PavLayerDataSource = result.features.map(feature => ({
                id: feature.attributes.OBJECTID,
                originalArea: extractShapeArea(feature.attributes),
                discountedArea: extractShapeArea(feature.attributes),
                attributes: feature.attributes,
                tipo: '2 Pavimentos'
              }))
            }).catch(() => {
              novasEdificacoes.edificacao2PavLayerDataSource = []
            })
          )
        }

        // 3 Pavimentos
        if (edificacao3PavimentoDataSource) {
          const layer3Pav = edificacao3PavimentoDataSource.layer as __esri.FeatureLayer
          queries.push(
            layer3Pav.queryFeatures(edificacoesQuery).then(result => {
              novasEdificacoes.edificacao3PavLayerDataSource = result.features.map(feature => ({
                id: feature.attributes.OBJECTID,
                originalArea: extractShapeArea(feature.attributes),
                discountedArea: extractShapeArea(feature.attributes),
                attributes: feature.attributes,
                tipo: '3 Pavimentos'
              }))
            }).catch(() => {
              novasEdificacoes.edificacao3PavLayerDataSource = []
            })
          )
        }

        // 4 Pavimentos
        if (edificacao4PavimentoDataSource) {
          const layer4Pav = edificacao4PavimentoDataSource.layer as __esri.FeatureLayer
          queries.push(
            layer4Pav.queryFeatures(edificacoesQuery).then(result => {
              novasEdificacoes.edificacao4PavLayerDataSource = result.features.map(feature => ({
                id: feature.attributes.OBJECTID,
                originalArea: extractShapeArea(feature.attributes),
                discountedArea: extractShapeArea(feature.attributes),
                attributes: feature.attributes,
                tipo: '4 Pavimentos'
              }))
            }).catch(() => {
              novasEdificacoes.edificacao4PavLayerDataSource = []
            })
          )
        }

        // 5+ Pavimentos
        if (edificacao5PavimentoDataSource) {
          const layer5Pav = edificacao5PavimentoDataSource.layer as __esri.FeatureLayer
          queries.push(
            layer5Pav.queryFeatures(edificacoesQuery).then(result => {
              novasEdificacoes.edificacao5PavLayerDataSource = result.features.map(feature => ({
                id: feature.attributes.OBJECTID,
                originalArea: extractShapeArea(feature.attributes),
                discountedArea: extractShapeArea(feature.attributes),
                attributes: feature.attributes,
                tipo: '5+ Pavimentos'
              }))
            }).catch(() => {
              novasEdificacoes.edificacao5PavLayerDataSource = []
            })
          )
        }

        // Aguardar todas as queries
        await Promise.all(queries)

        setEdificacoesPorTipo(novasEdificacoes)

        // Calcular totais
        const totalEdificacoes = Object.values(novasEdificacoes).reduce((sum, arr) => sum + arr.length, 0)
        const totalArea = Object.values(novasEdificacoes)
          .flat()
          .reduce((sum, e) => sum + e.originalArea, 0)

        const resumo = Object.entries(novasEdificacoes)
          .filter(([, edificacoes]) => edificacoes.length > 0)
          .map(([tipo, edificacoes]) => {
            const tipoNome = tipo.includes('2Pav') ? '2P' :
              tipo.includes('3Pav') ? '3P' :
                tipo.includes('4Pav') ? '4P' :
                  tipo.includes('5Pav') ? '5P+' : '1P'
            return `${tipoNome}:${edificacoes.length}`
          }).join(' | ')

        setDebugInfo(
          totalEdificacoes > 0
            ? `✅ ${totalEdificacoes} edificações | ${resumo} | ${totalArea.toFixed(1)} m²`
            : '⚠️ Nenhuma edificação encontrada no lote'
        )

      } catch (error) {
        setDebugInfo('❌ Erro ao buscar lote')
        console.error('Erro na consulta do lote:', error)
      }
    })
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  }

  const prepareExportData = () => {
    const allEdificacoes = Object.values(edificacoesPorTipo).flat()

    return allEdificacoes.map(e => {
      const reducao = e.originalArea - e.discountedArea
      const percentualReducao = e.originalArea > 0 ? (reducao / e.originalArea) * 100 : 0

      return {
        id: e.id,
        tipo: e.tipo,
        originalArea: e.originalArea,
        discountedArea: e.discountedArea,
        reducao: reducao,
        percentualReducao: percentualReducao
      }
    })
  }

  const layersConfigured = loteDataSource && (
    edificacaoDataSource ||
    edificacao2PavimentoDataSource ||
    edificacao3PavimentoDataSource ||
    edificacao4PavimentoDataSource ||
    edificacao5PavimentoDataSource
  )

  const allEdificacoes = Object.values(edificacoesPorTipo).flat()
  const edificacoesComArea = allEdificacoes.filter(e => e.originalArea > 0)
  const totalOriginalArea = edificacoesComArea.reduce((sum, e) => sum + e.originalArea, 0)
  const totalDiscountedArea = edificacoesComArea.reduce((sum, e) => sum + e.discountedArea, 0)

  return (
    <div className="widget-beiral-discount jimu-widget m-1">
      {props.useMapWidgetIds?.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds[0]}
          onActiveViewChange={activeViewChangeHandler}
        />
      )}

      <div className="widget-content mt-2">
        <div className="bg-primary p-2 rounded mb-2">
          <h5 className="text-center m-0 text-white">Desconto de Beiral Multi-Camadas</h5>
        </div>

        {!layersConfigured ? (
          <div className="alert alert-warning py-2 px-3 mb-2">
            <div style={{ fontSize: '14px' }}>
              <strong>⚠️ Configure as camadas:</strong>
              <br />
              📍 Lotes {!loteDataSource && '(faltando)'} | 🏠 Configure pelo menos uma camada de edificação
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-light p-2 mb-2 rounded text-center">
              <div style={{ fontSize: '14px' }}>
                <strong>Clique em um lote no mapa</strong>
              </div>
              {debugInfo && (
                <div className="mt-1">
                  <div className="text-muted" style={{ fontSize: '13px' }}>{debugInfo}</div>
                  {allEdificacoes.length > 0 && (
                    <button
                      className="btn btn-link btn-sm p-0 ml-2"
                      style={{ fontSize: '13px' }}
                      onClick={() => setShowDebug(!showDebug)}
                    >
                      {showDebug ? '▼' : '▶'} Detalhes
                    </button>
                  )}
                </div>
              )}
            </div>

            {loteInfo.CHAVE && (
              <div className="border p-2 mb-2 rounded">
                <div className="text-center">
                  <strong style={{ fontSize: '15px' }}>🎯 {loteInfo.CHAVE}</strong>
                  {totalOriginalArea > 0 && (
                    <div className="mt-1" style={{ fontSize: '13px' }}>
                      {edificacoesComArea.length} edificações | {formatNumber(totalOriginalArea)} m²
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resumo por tipo */}
            {allEdificacoes.length > 0 && (
              <div className="row mb-2">
                {Object.entries(edificacoesPorTipo).map(([key, edificacoes]) => {
                  if (edificacoes.length === 0) return null

                  const subtotal = edificacoes.reduce((sum, e) => sum + e.originalArea, 0)
                  const tipoNome = key.includes('2Pav') ? '2P' :
                    key.includes('3Pav') ? '3P' :
                      key.includes('4Pav') ? '4P' :
                        key.includes('5Pav') ? '5P+' : '1P'

                  return (
                    <div key={key} className="col-6 col-md-3 mb-1">
                      <div className="card bg-light text-center">
                        <div className="card-body py-1">
                          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{tipoNome}</div>
                          <div style={{ fontSize: '14px', color: '#0066cc' }}>{edificacoes.length}</div>
                          <div style={{ fontSize: '10px', color: '#666' }}>{formatNumber(subtotal)} m²</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {showDebug && allEdificacoes.length > 0 && (
              <div className="bg-light p-2 mb-2 rounded">
                <div style={{ fontSize: '14px' }}><strong>📋 Edificações por Tipo:</strong></div>
                <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '12px' }}>
                  {Object.entries(edificacoesPorTipo).map(([key, edificacoes]) => {
                    if (edificacoes.length === 0) return null

                    return (
                      <div key={key} className="border-bottom py-1">
                        <strong>{edificacoes[0]?.tipo}:</strong> {edificacoes.length} unidades
                        <div className="ml-2">
                          {edificacoes.slice(0, 5).map(e => `ID:${e.id}`).join(', ')}
                          {edificacoes.length > 5 && `... +${edificacoes.length - 5}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {edificacoesComArea.length > 0 && (
              <div className="bg-light p-3 mb-2 rounded">
                <div className="mb-2">
                  <label style={{ fontSize: '14px' }}><strong>Desconto de Beiral (%):</strong></label>
                  <input
                    type="number"
                    className="form-control mt-1"
                    placeholder="Ex: 15"
                    step="0.01"
                    min="0"
                    max="100"
                    value={discountValueInput}
                    onChange={(e) => setDiscountValueInput(e.target.value)}
                  />
                </div>
                <Button
                  type="primary"
                  className="w-100"
                  onClick={() => handleGenerateDiscount({
                    edificacoesPorTipo,
                    setEdificacoesPorTipo,
                    discountValueInput,
                    setAppliedDiscount,
                    setShowResultModal
                  })}
                  disabled={!discountValueInput}
                >
                  Calcular Desconto de Beiral
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <ModalDropDown
        showResultModal={showResultModal}
        setShowResultModal={setShowResultModal}
        loteInfo={loteInfo}
        edificacoesPorTipo={edificacoesPorTipo}
        appliedDiscount={appliedDiscount}
        exportToExcel={exportToExcel}
        prepareExportData={prepareExportData}
        formatNumber={formatNumber}
      />
    </div>
  )
}��2ufile:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/beiral-discount/src/runtime/widget.tsx