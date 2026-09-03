import { describe, expect, it } from 'vitest'

import source from './PrintedPouch.tsx?raw'

describe('PrintedPouch renderer', () => {
  it('casts product shadows without receiving dense self-shadow maps', () => {
    expect(source.match(/castShadow receiveShadow=\{false\}/g)).toHaveLength(3)
  })
})
