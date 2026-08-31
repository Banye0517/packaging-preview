import { describe, expect, it } from 'vitest'

import { BOX_MATERIAL_FACE_ORDER, DEFAULT_BOX_ROTATION } from './faceMaterials'

describe('BOX_MATERIAL_FACE_ORDER', () => {
  it('matches the BoxGeometry material group order', () => {
    expect(BOX_MATERIAL_FACE_ORDER).toEqual([
      'right',
      'left',
      'top',
      'bottom',
      'front',
      'back',
    ])
  })

  it('keeps the box axes aligned for exact camera views', () => {
    expect(DEFAULT_BOX_ROTATION).toEqual([0, 0, 0])
  })
})
