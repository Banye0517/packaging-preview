import { useState } from 'react'

import type { ArtworkAsset, InnerPackaging1State } from '../app/types'
import { FaceUploader } from '../artwork/FaceUploader'

interface TextureNumberInputProps {
  label: string
  min: number
  max: number
  suffix: string
  value: number
  onChange: (value: number) => void
}

function TextureNumberInput({
  label,
  min,
  max,
  suffix,
  value,
  onChange,
}: TextureNumberInputProps) {
  const [draft, setDraft] = useState(String(value))

  const commit = () => {
    const parsed = Number(draft)
    if (!Number.isFinite(parsed) || draft.trim() === '') {
      setDraft(String(value))
      return
    }
    const nextValue = Math.min(max, Math.max(min, parsed))
    setDraft(String(nextValue))
    onChange(nextValue)
  }

  return (
    <span className="texture-number">
      <input
        type="number"
        min={min}
        max={max}
        value={draft}
        aria-label={`${label}数值`}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
      />
      <span aria-hidden="true">{suffix}</span>
    </span>
  )
}

interface InnerPackagingArtworkUploaderProps {
  artwork: ArtworkAsset | null
  error?: string
  onUpload: (file: File) => void
  onRemove: () => void
  transform: Pick<
    InnerPackaging1State,
    | 'artworkScale'
    | 'artworkOffsetX'
    | 'artworkOffsetY'
    | 'artworkRotation'
    | 'artworkStretchX'
    | 'artworkStretchY'
  >
  onTransformChange: (
    key:
      | 'artworkScale'
      | 'artworkOffsetX'
      | 'artworkOffsetY'
      | 'artworkRotation'
      | 'artworkStretchX'
      | 'artworkStretchY',
    value: number,
  ) => void
  onTransformReset: () => void
}

export function InnerPackagingArtworkUploader({
  artwork,
  error,
  onUpload,
  onRemove,
  transform,
  onTransformChange,
  onTransformReset,
}: InnerPackagingArtworkUploaderProps) {
  const controls = [
    { key: 'artworkScale', label: '贴图缩放', min: 50, max: 300, suffix: '%' },
    { key: 'artworkOffsetX', label: '水平位置', min: -100, max: 100, suffix: '%' },
    { key: 'artworkOffsetY', label: '垂直位置', min: -100, max: 100, suffix: '%' },
    { key: 'artworkRotation', label: '贴图旋转', min: -180, max: 180, suffix: '°' },
    { key: 'artworkStretchX', label: '水平拉伸', min: 50, max: 300, suffix: '%' },
    { key: 'artworkStretchY', label: '垂直拉伸', min: 50, max: 300, suffix: '%' },
  ] as const
  return (
    <>
      <div className="face-grid face-grid--pouch">
        <FaceUploader
          face="front"
          label="完整UV贴图"
          asset={artwork}
          error={error}
          onUpload={(_, file) => onUpload(file)}
          onRemove={onRemove}
        />
      </div>
      <section className="texture-transform-controls" aria-label="贴图变换">
        <div className="texture-transform-heading">
          <strong>贴图调整</strong>
          <button type="button" onClick={onTransformReset}>重置贴图</button>
        </div>
        {controls.map(({ key, label, min, max, suffix }) => (
          <label className="texture-slider" key={key}>
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              value={transform[key]}
              aria-label={label}
              onChange={(event) =>
                onTransformChange(key, event.currentTarget.valueAsNumber)
              }
            />
            <TextureNumberInput
              key={transform[key]}
              label={label}
              min={min}
              max={max}
              suffix={suffix}
              value={transform[key]}
              onChange={(nextValue) => onTransformChange(key, nextValue)}
            />
          </label>
        ))}
      </section>
    </>
  )
}
