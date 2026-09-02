import type { ArtworkTransform, WetTissueArtworkSlot, WetTissueState } from '../app/types'
import { FaceUploader } from '../artwork/FaceUploader'

interface WetTissueArtworkUploaderProps {
  value: WetTissueState
  errors: Partial<Record<WetTissueArtworkSlot, string>>
  onUpload: (slot: WetTissueArtworkSlot, file: File) => void
  onRemove: (slot: WetTissueArtworkSlot) => void
  onSelectArtwork: (slot: WetTissueArtworkSlot) => void
  onTransformChange: (slot: WetTissueArtworkSlot, key: keyof ArtworkTransform, value: number) => void
  onTransformReset: (slot: WetTissueArtworkSlot) => void
}

const SLOTS: ReadonlyArray<{ slot: WetTissueArtworkSlot; label: string }> = [
  { slot: 'body', label: '纸盒贴纸（完整 UV）' },
  { slot: 'lid', label: '盖子贴纸（完整 UV）' },
]

const CONTROLS = [
  { key: 'scale', label: '贴图缩放', min: 50, max: 300, suffix: '%' },
  { key: 'offsetX', label: '水平位置', min: -100, max: 100, suffix: '%' },
  { key: 'offsetY', label: '垂直位置', min: -100, max: 100, suffix: '%' },
  { key: 'rotation', label: '贴图旋转', min: -180, max: 180, suffix: '°' },
  { key: 'stretchX', label: '水平拉伸', min: 50, max: 300, suffix: '%' },
  { key: 'stretchY', label: '垂直拉伸', min: 50, max: 300, suffix: '%' },
] as const

export function WetTissueArtworkUploader({
  value, errors, onUpload, onRemove, onSelectArtwork, onTransformChange, onTransformReset,
}: WetTissueArtworkUploaderProps) {
  const slot = value.selectedArtwork
  const label = SLOTS.find((item) => item.slot === slot)?.label ?? slot
  const transform = value.transforms[slot]

  return (
    <>
      <div className="face-grid face-grid--wet-tissue">
        {SLOTS.map((item) => (
          <div
            key={item.slot}
            className={value.selectedArtwork === item.slot ? 'is-selected' : undefined}
            onClick={() => onSelectArtwork(item.slot)}
          >
            <FaceUploader
              face={item.slot}
              label={item.label}
              asset={value.artworks[item.slot]}
              error={errors[item.slot]}
              onUpload={onUpload}
              onRemove={onRemove}
            />
          </div>
        ))}
      </div>
      <details className="texture-transform-disclosure">
        <summary>高级调整</summary>
        <section className="texture-transform-controls" aria-label={`${label}贴图变换`}>
          <div className="texture-transform-heading">
            <strong>{label}调整</strong>
            <button type="button" aria-label={`重置${label}`} onClick={() => onTransformReset(slot)}>重置贴图</button>
          </div>
          {CONTROLS.map(({ key, label: controlLabel, min, max, suffix }) => (
            <label className="texture-slider" key={key}>
              <span>{controlLabel}</span>
              <input
                type="range" min={min} max={max} value={transform[key]} aria-label={controlLabel}
                onChange={(event) => onTransformChange(slot, key, event.currentTarget.valueAsNumber)}
              />
              <span className="texture-number">
                <input
                  type="number" min={min} max={max} value={transform[key]} aria-label={`${controlLabel}数值`}
                  onChange={(event) => onTransformChange(slot, key, event.currentTarget.valueAsNumber)}
                />
                <span aria-hidden="true">{suffix}</span>
              </span>
            </label>
          ))}
        </section>
      </details>
    </>
  )
}
