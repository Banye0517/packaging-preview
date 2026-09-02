import type { FaceTissueState, InnerPackagingModelRotation } from '../app/types'

interface FaceTissuePanelProps {
  value: FaceTissueState
  onChange: (key: 'width' | 'height' | 'thickness' | 'radius', value: number) => void
  onRotationChange: (value: InnerPackagingModelRotation) => void
  onTopSheetChange: (value: boolean) => void
  title?: string
  eyebrow?: string
  description?: string
  topSheetLabel?: string
  topSheetAriaLabel?: string
  rotationName?: string
  showRadius?: boolean
}

export function FaceTissuePanel({
  value,
  onChange,
  onRotationChange,
  onTopSheetChange,
  title = '面纸设置',
  eyebrow = 'FACE TISSUE DIMENSIONS',
  description = '主体图稿使用完整 UV，左右侧面保留模型结构材质。',
  topSheetLabel = '显示顶部抽纸',
  topSheetAriaLabel = '顶部抽纸',
  rotationName = 'face-tissue-model-rotation',
  showRadius = true,
}: FaceTissuePanelProps) {
  const dimensions = [
    ['width', '盒身宽度（毫米）'],
    ['height', '盒身高度（毫米）'],
    ['thickness', '盒身厚度（毫米）'],
    ...(showRadius ? [['radius', '圆角（毫米）'] as const] : []),
  ] as const

  return (
    <>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="panel-description">{description}</p>
      <div className="control-stack">
        {dimensions.map(([key, label]) => (
          <label className="field-row" key={key}>
            <span>{label}</span>
            <input
              type="number"
              min={key === 'radius' ? 0 : 30}
              max={key === 'radius' ? 40 : 1000}
              value={value[key]}
              onChange={(event) => onChange(key, event.currentTarget.valueAsNumber)}
            />
          </label>
        ))}
        <label className="field-row">
          <span>{topSheetLabel}</span>
          <input
            type="checkbox"
            aria-label={topSheetAriaLabel}
            checked={value.showTopSheet}
            onChange={(event) => onTopSheetChange(event.currentTarget.checked)}
          />
        </label>
        <fieldset className="closure-fieldset">
          <legend>模型方向</legend>
          <div className="closure-options">
            {([0, 90, 180] as const).map((rotation) => (
              <label key={rotation}>
                <input
                  type="radio"
                  name={rotationName}
                  checked={value.modelRotation === rotation}
                  onChange={() => onRotationChange(rotation)}
                />
                <span>{rotation}°</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </>
  )
}
