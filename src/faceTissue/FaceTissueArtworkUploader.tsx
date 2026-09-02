import type { ArtworkTransform, FaceTissueState } from '../app/types'
import { FaceUploader } from '../artwork/FaceUploader'

interface FaceTissueArtworkUploaderProps {
  value: FaceTissueState
  error?: string
  onUpload: (file: File) => void
  onRemove: () => void
  onTransformChange: (key: keyof ArtworkTransform, value: number) => void
  onTransformReset: () => void
}

const CONTROLS = [
  { key: 'scale', label: '贴图缩放', min: 50, max: 300, suffix: '%' },
  { key: 'offsetX', label: '水平位置', min: -100, max: 100, suffix: '%' },
  { key: 'offsetY', label: '垂直位置', min: -100, max: 100, suffix: '%' },
  { key: 'rotation', label: '贴图旋转', min: -180, max: 180, suffix: '°' },
  { key: 'stretchX', label: '水平拉伸', min: 50, max: 300, suffix: '%' },
  { key: 'stretchY', label: '垂直拉伸', min: 50, max: 300, suffix: '%' },
] as const

export function FaceTissueArtworkUploader({
  value, error, onUpload, onRemove, onTransformChange, onTransformReset,
}: FaceTissueArtworkUploaderProps) {
  return (
    <>
      <div className="face-grid face-grid--face-tissue">
        <FaceUploader
          face="face-tissue"
          label="面纸图稿（完整 UV）"
          asset={value.artwork}
          error={error}
          onUpload={(_, file) => onUpload(file)}
          onRemove={() => onRemove()}
        />
      </div>
      <details className="texture-transform-disclosure">
        <summary>高级调整</summary>
        <section className="texture-transform-controls" aria-label="面纸贴图变换">
          <div className="texture-transform-heading">
            <strong>面纸贴图调整</strong>
            <button type="button" onClick={onTransformReset}>重置贴图</button>
          </div>
          {CONTROLS.map(({ key, label, min, max, suffix }) => (
            <label className="texture-slider" key={key}>
              <span>{label}</span>
              <input
                type="range"
                min={min}
                max={max}
                value={value.artworkTransform[key]}
                aria-label={label}
                onChange={(event) => onTransformChange(key, event.currentTarget.valueAsNumber)}
              />
              <span className="texture-number">
                <input
                  type="number"
                  min={min}
                  max={max}
                  value={value.artworkTransform[key]}
                  aria-label={`${label}数值`}
                  onChange={(event) => onTransformChange(key, event.currentTarget.valueAsNumber)}
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
