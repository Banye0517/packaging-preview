import type {
  InnerPackaging1State,
  InnerPackagingModelRotation,
} from '../app/types'

interface InnerPackaging1PanelProps {
  value: Pick<InnerPackaging1State, 'width' | 'height' | 'modelRotation'>
  title?: string
  onChange: (key: 'width' | 'height', value: number) => void
  onRotationChange: (value: InnerPackagingModelRotation) => void
}

const DIMENSIONS = [
  { key: 'width', label: '袋宽（毫米）' },
  { key: 'height', label: '袋高（毫米）' },
] as const

const MODEL_ROTATIONS: readonly InnerPackagingModelRotation[] = [0, 90, 180]

export function InnerPackaging1Panel({
  value,
  title = '内包装1设置',
  onChange,
  onRotationChange,
}: InnerPackaging1PanelProps) {
  return (
    <>
      <p className="eyebrow">INNER PACKAGING DIMENSIONS</p>
      <h1>{title}</h1>
      <p className="panel-description">
        保持原模型的厚度、底部、封边和鼓起形态，仅调整整体宽高。
      </p>
      <div className="control-stack">
        {DIMENSIONS.map(({ key, label }) => (
          <label className="field-row" key={key}>
            <span>{label}</span>
            <input
              type="number"
              min={30}
              max={1000}
              value={value[key]}
              onChange={(event) => onChange(key, event.currentTarget.valueAsNumber)}
            />
          </label>
        ))}
        <fieldset className="closure-fieldset">
          <legend>模型方向</legend>
          <div className="closure-options">
            {MODEL_ROTATIONS.map((rotation) => (
              <label key={rotation}>
                <input
                  type="radio"
                  name="inner-packaging-model-rotation"
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
