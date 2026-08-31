import type {
  ArtworkTransform,
  InnerPackaging2State,
  PouchFace,
} from '../app/types'
import { FaceUploader } from '../artwork/FaceUploader'

interface InnerPackaging2ArtworkUploaderProps {
  value: InnerPackaging2State
  errors: Partial<Record<PouchFace, string>>
  onUpload: (face: PouchFace, file: File) => void
  onRemove: (face: PouchFace) => void
  onSelectFace: (face: PouchFace) => void
  onTransformChange: (
    face: PouchFace,
    key: keyof ArtworkTransform,
    value: number,
  ) => void
  onTransformReset: (face: PouchFace) => void
}

const FACES: ReadonlyArray<{ face: PouchFace; label: string }> = [
  { face: 'front', label: '正面' },
  { face: 'back', label: '背面' },
]

const CONTROLS = [
  { key: 'scale', label: '贴图缩放', min: 50, max: 300, suffix: '%' },
  { key: 'offsetX', label: '水平位置', min: -100, max: 100, suffix: '%' },
  { key: 'offsetY', label: '垂直位置', min: -100, max: 100, suffix: '%' },
  { key: 'rotation', label: '贴图旋转', min: -180, max: 180, suffix: '°' },
] as const

export function InnerPackaging2ArtworkUploader({
  value,
  errors,
  onUpload,
  onRemove,
  onSelectFace,
  onTransformChange,
  onTransformReset,
}: InnerPackaging2ArtworkUploaderProps) {
  const face = value.selectedFace
  const transform = value.transforms[face]
  const label = face === 'front' ? '正面' : '背面'

  return (
    <>
      <div className="face-grid face-grid--pouch">
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
              onUpload={(nextFace, file) => onUpload(nextFace as PouchFace, file)}
              onRemove={(nextFace) => onRemove(nextFace as PouchFace)}
            />
          </div>
        ))}
      </div>
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
              type="range"
              min={min}
              max={max}
              value={transform[key]}
              aria-label={controlLabel}
              onChange={(event) =>
                onTransformChange(face, key, event.currentTarget.valueAsNumber)
              }
            />
            <span className="texture-number">
              <input
                type="number"
                min={min}
                max={max}
                value={transform[key]}
                aria-label={`${controlLabel}数值`}
                onChange={(event) =>
                  onTransformChange(face, key, event.currentTarget.valueAsNumber)
                }
              />
              <span aria-hidden="true">{suffix}</span>
            </span>
          </label>
        ))}
      </section>
    </>
  )
}
