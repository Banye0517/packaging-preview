import type { FaceTissueState, InnerPackagingModelRotation } from '../app/types'

interface FaceTissuePanelProps {
  value: FaceTissueState
  onChange: (key: 'width' | 'height' | 'thickness' | 'radius', value: number) => void
  onRotationChange: (value: InnerPackagingModelRotation) => void
  onTopSheetChange: (value: boolean) => void
}

export function FaceTissuePanel({
  value, onChange, onRotationChange, onTopSheetChange,
}: FaceTissuePanelProps) {
  return (
    <>
      <p className="eyebrow">FACE TISSUE DIMENSIONS</p>
      <h1>面纸设置</h1>
      <p className="panel-description">主体图稿使用完整 UV，左右侧面保留模型结构材质。</p>
      <div className="control-stack">
        {([
          ['width', '盒身宽度（毫米）'],
          ['height', '盒身高度（毫米）'],
          ['thickness', '盒身厚度（毫米）'],
          ['radius', '圆角（毫米）'],
        ] as const).map(([key, label]) => (
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
          <span>显示顶部抽纸</span>
          <input
            type="checkbox"
            aria-label="顶部抽纸"
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
                  name="face-tissue-model-rotation"
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
