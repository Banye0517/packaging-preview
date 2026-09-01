import { describe, expect, it } from 'vitest'

import hangingSource from '../hangingTissue/PrintedHangingTissue.tsx?raw'
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
    expect(hangingSource).not.toContain('emissiveMap')
  })
})
