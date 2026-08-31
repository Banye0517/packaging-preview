import { describe, expect, it } from 'vitest'

import { validateImage } from './validateImage'

describe('validateImage', () => {
  it('rejects unsupported image types', async () => {
    const file = new File(['x'], 'layout.svg', { type: 'image/svg+xml' })

    await expect(validateImage(file)).rejects.toThrow('仅支持 PNG、JPG 和 WebP')
  })

  it('rejects empty image files', async () => {
    const file = new File([], 'empty.png', { type: 'image/png' })

    await expect(validateImage(file)).rejects.toThrow('图片文件为空')
  })
})
