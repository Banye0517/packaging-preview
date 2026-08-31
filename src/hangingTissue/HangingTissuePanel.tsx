import type { HangingTissueState, InnerPackagingModelRotation } from '../app/types'

interface HangingTissuePanelProps {
  value: HangingTissueState
  onChange: (key: 'width' | 'height', value: number) => void
  onRotationChange: (value: InnerPackagingModelRotation) => void
  onPulledSheetChange: (value: boolean) => void
}

export function HangingTissuePanel({
  value, onChange, onRotationChange, onPulledSheetChange,
}: HangingTissuePanelProps) {
  return (
    <>
      <p className="eyebrow">HANGING TISSUE DIMENSIONS</p>
      <h1>悬挂抽纸设置</h1>
      <p className="panel-description">保持原模型的悬挂结构、厚度和内纸形态，仅调整整体宽高。</p>
      <div className="control-stack">
        {([
          ['width', '袋宽（毫米）'],
          ['height', '袋高（毫米）'],
        ] as const).map(([key, label]) => (
          <label className="field-row" key={key}>
            <span>{label}</span>
            <input type="number" min={30} max={1000} value={value[key]} onChange={(event) => onChange(key, event.currentTarget.valueAsNumber)} />
          </label>
        ))}
        <label className="field-row">
          <span>显示抽纸</span>
          <input type="checkbox" checked={value.showPulledSheet} onChange={(event) => onPulledSheetChange(event.currentTarget.checked)} />
        </label>
        <fieldset className="closure-fieldset">
          <legend>模型方向</legend>
          <div className="closure-options">
            {([0, 90, 180] as const).map((rotation) => (
              <label key={rotation}>
                <input type="radio" name="hanging-tissue-model-rotation" checked={value.modelRotation === rotation} onChange={() => onRotationChange(rotation)} />
                <span>{rotation}°</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </>
  )
}
