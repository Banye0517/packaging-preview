import type { PouchFace, PouchState } from '../app/types'
import { FaceUploader } from './FaceUploader'

const POUCH_FACES: ReadonlyArray<{ face: PouchFace; label: string }> = [
  { face: 'front', label: '正面' },
  { face: 'back', label: '背面' },
]

interface PouchArtworkGridProps {
  faces: PouchState['faces']
  errors: Partial<Record<PouchFace, string>>
  onUpload: (face: PouchFace, file: File) => void
  onRemove: (face: PouchFace) => void
}

export function PouchArtworkGrid({
  faces,
  errors,
  onUpload,
  onRemove,
}: PouchArtworkGridProps) {
  return (
    <div className="face-grid face-grid--pouch">
      {POUCH_FACES.map(({ face, label }) => (
        <FaceUploader
          key={face}
          face={face}
          label={label}
          asset={faces[face]}
          error={errors[face]}
          onUpload={(nextFace, file) => onUpload(nextFace as PouchFace, file)}
          onRemove={(nextFace) => onRemove(nextFace as PouchFace)}
        />
      ))}
    </div>
  )
}
