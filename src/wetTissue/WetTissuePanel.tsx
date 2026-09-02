import type { InnerPackagingModelRotation, WetTissueModelState, WetTissueState } from '../app/types'

interface WetTissuePanelProps {
  value: WetTissueState
  onChange: (key: 'width' | 'height' | 'thickness', value: number) => void
  onRotationChange: (value: InnerPackagingModelRotation) => void
  onModelStateChange: (value: WetTissueModelState) => void
  onTopSheetChange: (value: boolean) => void
}

export function WetTissuePanel({
  value, onChange, onRotationChange, onModelStateChange, onTopSheetChange,
}: WetTissuePanelProps) {
  return (
    <>
      <p className="eyebrow">WET TISSUE DIMENSIONS</p>
      <h1>湿纸巾设置</h1>
      <p className="panel-description">使用模型原始 UV 自动贴合纸盒和盖子；调整尺寸时保持已贴图稿的物理大小。</p>
      <div className="control-stack">
        {([
          ['width', '盒身宽度（毫米）'],
          ['height', '盒身高度（毫米）'],
          ['thickness', '盒身厚度（毫米）'],
        ] as const).map(([key, label]) => (
          <label className="field-row" key={key}>
            <span>{label}</span>
            <input type="number" min={30} max={1000} value={value[key]} onChange={(event) => onChange(key, event.currentTarget.valueAsNumber)} />
          </label>
        ))}
        <fieldset className="closure-fieldset">
          <legend>模型状态</legend>
          <div className="closure-options">
            <label><input type="radio" name="wet-tissue-model-state" value="open" checked={value.modelState === 'open'} onChange={() => onModelStateChange('open')} /><span>打开</span></label>
            <label><input type="radio" name="wet-tissue-model-state" value="closed" checked={value.modelState === 'closed'} onChange={() => onModelStateChange('closed')} /><span>关闭</span></label>
          </div>
        </fieldset>
        <label className="field-row">
          <span>显示顶部纸张</span>
          <input type="checkbox" aria-label="顶部纸张" checked={value.showTopSheet} onChange={(event) => onTopSheetChange(event.currentTarget.checked)} />
        </label>
        <fieldset className="closure-fieldset">
          <legend>模型方向</legend>
          <div className="closure-options">
            {([0, 90, 180] as const).map((rotation) => (
              <label key={rotation}><input type="radio" name="wet-tissue-model-rotation" value={rotation} checked={value.modelRotation === rotation} onChange={() => onRotationChange(rotation)} /><span>{rotation}°</span></label>
            ))}
          </div>
        </fieldset>
      </div>
    </>
  )
}
