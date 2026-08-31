import { describe, expect, it, vi } from 'vitest'

import type { ArtworkTransform } from '../app/types'
import {
  calculateInnerPackaging2DrawSize,
  drawInnerPackaging2Atlas,
} from './innerPackaging2Texture'

const transform: ArtworkTransform = {
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
}

describe('inner packaging 2 texture atlas', () => {
  it('aspect-fits artwork without deformation', () => {
    expect(calculateInnerPackaging2DrawSize(1200, 600, 512, 1024, 100)).toEqual({
      width: 512,
      height: 256,
    })
    expect(calculateInnerPackaging2DrawSize(600, 1200, 512, 1024, 150)).toEqual({
      width: 768,
      height: 1536,
    })
  })

  it('clips front and back drawings into separate atlas halves', () => {
    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const image = { width: 512, height: 1024 } as HTMLImageElement

    drawInnerPackaging2Atlas(context, 1024, {
      front: { image, transform },
      back: { image, transform: { ...transform, offsetX: 25 } },
    })

    expect(context.rect).toHaveBeenNthCalledWith(1, 0, 0, 512, 1024)
    expect(context.rect).toHaveBeenNthCalledWith(2, 512, 0, 512, 1024)
    expect(context.translate).toHaveBeenNthCalledWith(1, 256, 512)
    expect(context.translate).toHaveBeenNthCalledWith(2, 896, 512)
    expect(context.rotate).toHaveBeenNthCalledWith(1, Math.PI)
    expect(context.rotate).toHaveBeenNthCalledWith(2, Math.PI)
    expect(context.drawImage).toHaveBeenCalledTimes(2)
  })
})
