import { describe, expect, it } from 'vitest'

import hangingSource from '../hangingTissue/PrintedHangingTissue.tsx?raw'
import faceTissueSource from '../faceTissue/PrintedFaceTissue.tsx?raw'
import wetTissueSource from '../wetTissue/PrintedWetTissue.tsx?raw'
import inner1Source from '../innerPackaging/PrintedInnerPackaging1.tsx?raw'
import inner2Source from '../innerPackaging/PrintedInnerPackaging2.tsx?raw'
import pouchSource from '../pouch/PrintedPouch.tsx?raw'
import boxSource from './PrintedBox.tsx?raw'

describe('packaging artwork renderer policy', () => {
  it('uses direct-color materials for every ordinary uploaded artwork renderer', () => {
    expect(boxSource).toContain('<meshBasicMaterial')
    expect(pouchSource).toContain('<meshBasicMaterial')
    expect(inner1Source).toContain('<meshBasicMaterial')
    expect(inner2Source).toContain('<meshBasicMaterial')
    expect(hangingSource).toContain('createArtworkMaterial')
    expect(faceTissueSource).toContain('createArtworkMaterial')
    expect(hangingSource).not.toContain('emissiveMap')
  })

  it('keeps unprinted inner packaging 2 and hanging-tissue faces physically lit', () => {
    expect(inner2Source).toContain('if (!frontImage && !backImage)')
    expect(inner2Source).toContain('<meshStandardMaterial')
    expect(hangingSource).toContain('images[face]')
    expect(hangingSource).toContain('new MeshStandardMaterial')
  })

  it('layers hanging-tissue artwork over a lit base and matches the pulled-sheet material', () => {
    expect(hangingSource).toContain('baseFaceMeshes')
    expect(hangingSource).toContain('material.transparent = true')
    expect(hangingSource).toContain('pulledSheetRef.current.traverse')
  })

  it('keeps face tissue side mesh and top sheet physically lit', () => {
    expect(faceTissueSource).toContain('FACE_TISSUE_SIDE_MESH_NAME')
    expect(faceTissueSource).toContain('FACE_TISSUE_TOP_SHEET_NAME')
    expect(faceTissueSource).toContain('new MeshStandardMaterial')
  })

  it('keeps wet tissue artwork direct-color while selecting the supplied roots', () => {
    expect(wetTissueSource).toContain('createArtworkMaterial')
    expect(wetTissueSource).toContain('new MeshStandardMaterial')
    expect(wetTissueSource).toContain('WET_TISSUE_OPEN_ROOT_NAME')
    expect(wetTissueSource).toContain('WET_TISSUE_CLOSED_ROOT_NAME')
    expect(wetTissueSource).toContain('WET_TISSUE_BODY_MESH_NAME')
    expect(wetTissueSource).toContain('WET_TISSUE_LID_ART_MESH_NAME')
  })
})
