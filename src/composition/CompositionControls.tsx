import type { CompositionLayout, PackageInstance, PackagingType } from '../app/types'
import { getPackageLabel } from '../app/packageFactory'
import { recommendedLayout } from '../app/projectReducer'

const PACKAGE_TYPES: Array<[PackagingType, string]> = [
  ['box', '盒装'], ['pouch', '自立袋'], ['inner-packaging-1', '内包装1'],
  ['inner-packaging-2', '内包装2'], ['hanging-tissue', '悬挂抽纸'],
  ['face-tissue', '面纸'], ['wet-tissue', '湿纸巾'], ['wash-tissue', '洗脸巾'],
]
const LAYOUTS: Array<[CompositionLayout, string]> = [
  ['hero', 'A 主次'], ['family', 'B 横排'], ['cluster', 'C 错落'], ['grid', 'D 阵列'],
]

export function CompositionControls({ instances, selectedId, layout, onAdd, onSelect, onRemove, onLayout }: {
  instances: PackageInstance[]
  selectedId: string
  layout: CompositionLayout
  onAdd: (type: PackagingType) => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onLayout: (layout: CompositionLayout) => void
}) {
  const counts = new Map<PackagingType, number>()
  return <section className="composition-controls" aria-label="包装组合">
    <div className="composition-instances">
      {instances.map((instance) => {
        const occurrence = (counts.get(instance.packagingType) ?? 0) + 1
        counts.set(instance.packagingType, occurrence)
        return <div className="composition-instance" key={instance.id}>
          <button type="button" aria-pressed={instance.id === selectedId} onClick={() => onSelect(instance.id)}>
            {getPackageLabel(instance.packagingType, occurrence)}
          </button>
          <button type="button" aria-label={`删除 ${getPackageLabel(instance.packagingType, occurrence)}`} disabled={instances.length === 1} onClick={() => onRemove(instance.id)}>×</button>
        </div>
      })}
    </div>
    <div className="composition-adders">
      {PACKAGE_TYPES.map(([type, label]) => <button key={type} type="button" disabled={instances.length >= 6} aria-label={`添加${label}`} onClick={() => onAdd(type)}>{label}<span aria-hidden="true">＋</span></button>)}
    </div>
    {instances.length >= 2 ? <fieldset className="composition-layouts">
      <legend>排列方式（推荐 {LAYOUTS.find(([value]) => value === recommendedLayout(instances.length))?.[1]}）</legend>
      {LAYOUTS.map(([value, label]) => <label key={value}><input type="radio" name="composition-layout" value={value} checked={layout === value} onChange={() => onLayout(value)} />{label}</label>)}
    </fieldset> : null}
    {instances.length >= 6 ? <p className="composition-limit">最多添加 6 个包装</p> : null}
  </section>
}
