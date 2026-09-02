import { describe, expect, it } from 'vitest'
import source from './PrintedWetTissue.tsx?raw'

describe('PrintedWetTissue renderer', () => {
  it('renders the authored body and lid meshes from one selectable open/closed asset', () => {
    expect(source).toContain('useGLTF(WET_TISSUE_MODEL_URL)')
    expect(source).toContain('WET_TISSUE_OPEN_ROOT_NAME')
    expect(source).toContain('WET_TISSUE_CLOSED_ROOT_NAME')
    expect(source).toContain('WET_TISSUE_BODY_MESH_NAME')
    expect(source).toContain('WET_TISSUE_LID_ART_MESH_NAME')
    expect(source).toContain('createArtworkMaterial')
    expect(source).toContain('new MeshStandardMaterial')
    expect(source).toContain('value.showTopSheet')
    expect(source).toContain('value.modelState')
  })
})
