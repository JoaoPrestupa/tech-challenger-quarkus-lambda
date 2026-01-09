�"/** @jsx jsx */
import { css, jsx, Immutable, DataSourceTypes, UseDataSource } from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import {
  MapWidgetSelector,
  SettingSection,
  SettingRow
} from 'jimu-ui/advanced/setting-components'
import type { IMConfig } from '../config'
import defaultI18nMessages from './translations/default'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'

export default function (props: AllWidgetSettingProps<IMConfig>) {

  const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    })
  }


  const style = css`
    .widget-setting-get-map-coordinates {
      .checkbox-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .data-source-section {
        margin-bottom: 15px;
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background-color: #f9f9f9;
      }
      .data-source-section-lote {
        border-color: #0066cc;
        background-color: #f0f7ff;
      }
      .data-source-section-edificacao {
        border-color: #28a745;
        background-color: #f0fff4;
      }
      .data-source-title {
        color: var(--dark-800);
        font-weight: bold;
        margin-bottom: 6px;
        font-size: 14px;
      }
      .data-source-description {
        color: #666;
        font-size: 11px;
        margin-bottom: 10px;
        line-height: 1.3;
      }
      .url-input {
        width: 100%;
        margin-bottom: 8px;
      }
      .preview-section {
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        margin-top: 10px;
      }
      .preview-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        font-size: 11px;
      }
      .preview-item {
        padding: 8px;
        background-color: white;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
      }
      .preview-item strong {
        color: #0066cc;
      }
      .preview-status {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 9px;
        font-weight: bold;
        margin-left: 5px;
      }
      .status-ok {
        background-color: #d4edda;
        color: #155724;
      }
      .status-missing {
        background-color: #f8d7da;
        color: #721c24;
      }
    }
  `

  const supportedDsTypes = Immutable([DataSourceTypes.FeatureLayer])

  const onLoteDataSourceChange = (useDataSources: UseDataSource[]) => {
    props.onSettingChange({
      id: props.id,
      config: props.config.set('loteLayerDataSource', useDataSources?.[0] || null)
    })
  }

  return (
    <div css={style}>
      <div className="widget-setting-get-map-coordinates">
        {/* SELETOR DE MAPA */}
        <SettingSection
          className="map-selector-section"
          title={props.intl.formatMessage({
            id: 'mapWidgetLabel',
            defaultMessage: defaultI18nMessages.selectMapWidget
          })}
        >
          <SettingRow>
            <MapWidgetSelector
              onSelect={onMapWidgetSelected}
              useMapWidgetIds={props.useMapWidgetIds}
            />
          </SettingRow>

          <SettingRow>
            <div className="data-source-section data-source-section-lote">
              <div className="data-source-title">
                📍 Camada de Lotes (Obrigatória)
              </div>
              <div className="data-source-description">
                Camada base com os lotes geográficos. É usada para seleção inicial e como referência espacial para todas as consultas.
              </div>
              <DataSourceSelector
                types={supportedDsTypes}
                useDataSourcesEnabled
                mustUseDataSource
                useDataSources={props.config?.loteLayerDataSource ? Immutable([props.config.loteLayerDataSource]) : Immutable([])}
                onChange={onLoteDataSourceChange}
                widgetId={props.id}
                hideDataView
              />
            </div>
          </SettingRow>

        </SettingSection>

      </div>
    </div>
  )
}
�"2ofile:///c:/Users/henrique.santos/Documents/work/client/your-extensions/widgets/bic-rest/src/setting/setting.tsx