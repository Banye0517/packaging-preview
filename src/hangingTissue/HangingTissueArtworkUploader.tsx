import type {
  ArtworkTransform,
  HangingTissueFace,
  HangingTissueState,
} from '../app/types'
import { FaceUploader } from '../artwork/FaceUploader'

interface HangingTissueArtworkUploaderProps {
  value: HangingTissueState
  errors: Partial<Record<HangingTissueFace, string>>
  onUpload: (face: HangingTissueFace, file: File) => void
  onRemove: (face: HangingTissueFace) => void
  onSelectFace: (face: HangingTissueFace) => void
  onTransformChange: (face: HangingTissueFace, key: keyof ArtworkTransform, value: number) => void
  onTransformReset: (face: HangingTissueFace) => void
}

const FACES: ReadonlyArray<{ face: HangingTissueFace; label: string }> = [
  { face: 'front', label: '正面' },
  { face: 'back', label: '背面' },
  { face: 'left', label: '左侧' },
  { face: 'right', label: '右侧' },
]

const CONTROLS = [
  { key: 'scale', label: '贴图缩放', min: 50, max: 300, suffix: '%' },
  { key: 'offsetX', label: '水平位置', min: -100, max: 100, suffix: '%' },
  { key: 'offsetY', label: '垂直位置', min: -100, max: 100, suffix: '%' },
  { key: 'rotation', label: '贴图旋转', min: -180, max: 180, suffix: '°' },
  { key: 'stretchX', label: '水平拉伸', min: 50, max: 300, suffix: '%' },
  { key: 'stretchY', label: '垂直拉伸', min: 50, max: 300, suffix: '%' },
] as const

export function HangingTissueArtworkUploader({
  value, errors, onUpload, onRemove, onSelectFace, onTransformChange, onTransformReset,
}: HangingTissueArtworkUploaderProps) {
  const face = value.selectedFace
  const transform = value.transforms[face]
  const label = FACES.find((item) => item.face === face)?.label ?? face

  return (
    <>
      <div className="face-grid face-grid--hanging-tissue">
        {FACES.map((item) => (
          <div
            key={item.face}
            className={value.selectedFace === item.face ? 'is-selected' : undefined}
            onClick={() => onSelectFace(item.face)}
          >
            <FaceUploader
              face={item.face}
              label={item.label}
              asset={value.faces[item.face]}
              error={errors[item.face]}
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
            <strong>{label}贴图调整</strong>
            <button type="button" aria-label={`重置${label}贴图`} onClick={() => onTransformReset(face)}>
              重置贴图
            </button>
          </div>
          {CONTROLS.map(({ key, label: controlLabel, min, max, suffix }) => (
            <label className="texture-slider" key={key}>
              <span>{controlLabel}</span>
              <input
                type="range" min={min} max={max} value={transform[key]}
                aria-label={controlLabel}
                onChange={(event) => onTransformChange(face, key, event.currentTarget.valueAsNumber)}
              />
              <span className="texture-number">
                <input
                  type="number" min={min} max={max} value={transform[key]}
                  aria-label={`${controlLabel}数值`}
                  onChange={(event) => onTransformChange(face, key, event.currentTarget.valueAsNumber)}
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
