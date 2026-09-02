import { describe, expect, it } from 'vitest'
import source from './PrintedFaceTissue.tsx?raw'

describe('PrintedFaceTissue renderer', () => {
  it('keeps the supplied mesh responsibilities and independent top sheet', () => {
    expect(source).toContain("useGLTF(FACE_TISSUE_MODEL_URL)")
    expect(source).toContain('FACE_TISSUE_PRINTABLE_MESH_NAME')
    expect(source).toContain('FACE_TISSUE_SIDE_MESH_NAME')
    expect(source).toContain('FACE_TISSUE_TOP_SHEET_NAME')
    expect(source).toContain('createArtworkMaterial')
    expect(source).toContain('new MeshStandardMaterial')
    expect(source).toContain('value.showTopSheet')
    expect(source).toContain('modelRotation * Math.PI / 180')
  })
})
