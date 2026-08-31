import type { ArtworkAsset, BoxFace } from '../app/types'

interface FaceUploaderProps {
  face: BoxFace
  label: string
  asset: ArtworkAsset | null
  error?: string
  onUpload: (face: BoxFace, file: File) => void
  onRemove: (face: BoxFace) => void
}

export function FaceUploader({
  face,
  label,
  asset,
  error,
  onUpload,
  onRemove,
}: FaceUploaderProps) {
  const inputId = `face-upload-${face}`

  return (
    <article className={`face-uploader${error ? ' has-error' : ''}`}>
      <div className="face-card-heading">
        <strong>{label}</strong>
        <span>{asset ? `${asset.width} × ${asset.height}` : '未上传'}</span>
      </div>

      <label className="face-dropzone" htmlFor={inputId}>
        {asset ? (
          <img src={asset.previewUrl} alt={`${label}印刷图预览`} />
        ) : (
          <span>
            <b>＋</b>
            点击上传
            <small>PNG / JPG / WebP</small>
          </span>
        )}
      </label>
      <input
        id={inputId}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label={`上传${label}印刷图`}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) onUpload(face, file)
          event.currentTarget.value = ''
        }}
      />

      <div className="face-card-footer">
        <span title={asset?.name}>{asset?.name ?? '建议使用平整设计稿'}</span>
        {asset ? (
          <button type="button" onClick={() => onRemove(face)}>
            移除
          </button>
        ) : null}
      </div>
      {error ? <p className="face-error">{error}</p> : null}
    </article>
  )
}
