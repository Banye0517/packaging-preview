import { describe, expect, it } from 'vitest'

import { createDefaultPouchFinish } from './finishTypes'
import { getActivePouchFinishFaces } from './pouchFinishFaces'

describe('pouch finish overlay', () => {
  it('returns only enabled front and back pouch masks', () => {
    const finish = createDefaultPouchFinish()
    const mask = {
      asset: {
        id: 'mask', name: 'mask.png', mimeType: 'image/png' as const,
        width: 100, height: 100, previewUrl: 'data:image/png;base64,AAAA',
      },
      transform: { scale: 100, offsetX: 0, offsetY: 0, rotation: 0 },
    }
    finish.layers['gold-foil'].masks.front = mask
    finish.layers['silver-foil'].masks.back = mask
    finish.layers['silver-foil'].enabled = false

    expect(getActivePouchFinishFaces(finish)).toEqual([
      { kind: 'gold-foil', face: 'front' },
    ])
  })
})
