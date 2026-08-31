import { describe, expect, it } from 'vitest'

import { readImageDataUrl } from './readImageDataUrl'

describe('readImageDataUrl', () => {
  it('creates a stable local data URL from an uploaded image', async () => {
    const file = new File(['box-art'], 'front.png', { type: 'image/png' })

    await expect(readImageDataUrl(file)).resolves.toMatch(/^data:image\/png;base64,/)
  })
})
