import type { ArtworkAsset, BoxFace, ProjectState } from '../app/types'
import { FaceUploader } from './FaceUploader'

const FACE_LABELS: ReadonlyArray<{ face: BoxFace; label: string }> = [
  { face: 'front', label: '正面' },
  { face: 'back', label: '背面' },
  { face: 'left', label: '左侧' },
  { face: 'right', label: '右侧' },
  { face: 'top', label: '顶部' },
  { face: 'bottom', label: '底部' },
]

interface FaceGridProps {
  faces: ProjectState['faces']
  errors: Partial<Record<BoxFace, string>>
  onUpload: (face: BoxFace, file: File) => void
  onRemove: (face: BoxFace) => void
}

export function FaceGrid({ faces, errors, onUpload, onRemove }: FaceGridProps) {
  return (
    <div className="face-grid">
      {FACE_LABELS.map(({ face, label }) => (
        <FaceUploader
          key={face}
          face={face}
          label={label}
          asset={faces[face] as ArtworkAsset | null}
          error={errors[face]}
          onUpload={onUpload}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}
