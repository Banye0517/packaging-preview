import type { PackageInstance } from '../app/types'

type BoxKey = keyof PackageInstance['box']

interface BoxPanelProps {
  box: PackageInstance['box']
  onChange: (key: BoxKey, value: number) => void
}

const DIMENSIONS: ReadonlyArray<{
  key: BoxKey
  label: string
  min: number
  max: number
}> = [
  { key: 'width', label: '盒宽（毫米）', min: 20, max: 1000 },
  { key: 'height', label: '盒高（毫米）', min: 20, max: 1000 },
  { key: 'depth', label: '盒深（毫米）', min: 10, max: 500 },
  { key: 'radius', label: '圆角（毫米）', min: 0, max: 40 },
]

export function BoxPanel({ box, onChange }: BoxPanelProps) {
  return (
    <>
      <p className="eyebrow">BOX DIMENSIONS</p>
      <h1>盒型设置</h1>
      <p className="panel-description">输入真实尺寸，三维盒体始终保持正确比例。</p>
      <div className="control-stack">
        {DIMENSIONS.map(({ key, label, min, max }) => (
          <label className="field-row" key={key}>
            <span>{label}</span>
            <input
              type="number"
              min={min}
              max={max}
              value={box[key]}
              onChange={(event) => onChange(key, event.currentTarget.valueAsNumber)}
            />
          </label>
        ))}
      </div>
    </>
  )
}
