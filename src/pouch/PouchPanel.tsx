import type { PouchClosure, PouchState } from '../app/types'

type PouchSettingKey = Exclude<keyof PouchState, 'faces'>

interface PouchPanelProps {
  pouch: PouchState
  onChange: (key: PouchSettingKey, value: number | boolean | PouchClosure) => void
}

const DIMENSIONS: ReadonlyArray<{
  key: 'width' | 'height' | 'thickness' | 'gussetDepth'
  label: string
  min: number
  max: number
}> = [
  { key: 'width', label: '袋宽（毫米）', min: 30, max: 1000 },
  { key: 'height', label: '袋高（毫米）', min: 30, max: 1000 },
  { key: 'thickness', label: '袋体厚度（毫米）', min: 2, max: 200 },
  { key: 'gussetDepth', label: '底部展开深度（毫米）', min: 10, max: 500 },
]

const CLOSURES: ReadonlyArray<{ value: PouchClosure; label: string }> = [
  { value: 'none', label: '无封口' },
  { value: 'zipper', label: '拉链' },
  { value: 'spout', label: '顶部居中吸嘴' },
]

export function PouchPanel({ pouch, onChange }: PouchPanelProps) {
  return (
    <>
      <p className="eyebrow">POUCH DIMENSIONS</p>
      <h1>自立袋设置</h1>
      <p className="panel-description">
        三边圆弧热封连接正背片，底部为固定白色风琴结构。
      </p>
      <div className="control-stack">
        {DIMENSIONS.map(({ key, label, min, max }) => (
          <label className="field-row" key={key}>
            <span>{label}</span>
            <input
              type="number"
              min={min}
              max={max}
              value={pouch[key]}
              onChange={(event) => onChange(key, event.currentTarget.valueAsNumber)}
            />
          </label>
        ))}
        <label className="toggle-row">
          <span>四角圆角</span>
          <input
            type="checkbox"
            checked={pouch.roundedCorners}
            onChange={(event) => onChange('roundedCorners', event.currentTarget.checked)}
          />
        </label>
        <fieldset className="closure-fieldset">
          <legend>封口结构</legend>
          <div className="closure-options">
            {CLOSURES.map(({ value, label }) => (
              <label key={value}>
                <input
                  type="radio"
                  name="pouch-closure"
                  value={value}
                  checked={pouch.closure === value}
                  onChange={() => onChange('closure', value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </>
  )
}
