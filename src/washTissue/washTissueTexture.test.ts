import { describe, expect, it, vi } from 'vitest'

import type { ArtworkTransform } from '../app/types'
import { drawWashTissueAtlas } from './washTissueTexture'

const transform: ArtworkTransform = {
  scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100,
}

describe('wash tissue texture atlas', () => {
  it('preserves the supplied rectangular UV template aspect ratio', () => {
    const context = {
      fillRect: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
      scale: vi.fn(), rotate: vi.fn(), drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 738, height: 1003 } as HTMLImageElement

    drawWashTissueAtlas(context, 2048, image, transform, {
      width: 160, height: 205, thickness: 80,
    }, {
      width: 160, height: 205, thickness: 80,
    })

    const atlasHeight = Math.round(2048 * 1003 / 738)
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 2048, atlasHeight)
    expect(context.drawImage).toHaveBeenCalledWith(image, -1024, -atlasHeight / 2, 2048, atlasHeight)
  })
})
