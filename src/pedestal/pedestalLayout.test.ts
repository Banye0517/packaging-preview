import { describe, expect, it } from 'vitest'

import type { CompositionLayout, PedestalPreset } from '../app/types'
import { calculateCompositionLayout, type LayoutBounds } from '../composition/layout'
import {
  calculatePedestalLayout,
  hasPackageIntersections,
  hasPackagePedestalIntersections,
  hasPedestalIntersections,
  isFullySupported,
} from './pedestalLayout'

const items: LayoutBounds[] = [
  { id: 'hero', min: [-1.2, -0.1, -0.55], max: [1.3, 3.4, 0.65] },
  { id: 'wide', min: [-1.7, 0, -0.45], max: [1.5, 1.8, 0.5] },
  { id: 'deep', min: [-0.7, -0.2, -1.1], max: [0.8, 2.5, 1.2] },
  { id: 'small', min: [-0.35, 0, -0.3], max: [0.4, 1.1, 0.35] },
  { id: 'offset', min: [-0.2, -0.15, -0.8], max: [1.1, 2.1, 0.7] },
  { id: 'flat', min: [-1.1, 0, -0.75], max: [1, 0.8, 0.8] },
]

const layouts: CompositionLayout[] = ['hero', 'family', 'cluster', 'grid']
const presets: Exclude<PedestalPreset, 'none'>[] = ['steps', 'islands', 'horizontal']

describe('calculatePedestalLayout', () => {
  it.each(layouts.flatMap((layout) => presets.map((preset) => [layout, preset] as const)))(
    'solves %s with %s without intersections',
    (layout, preset) => {
      const result = calculatePedestalLayout(items, layout, 'hero', preset)

      expect(result.fallbackReason).toBeNull()
      expect(hasPackageIntersections(result.items)).toBe(false)
      expect(hasPackagePedestalIntersections(result.items, result.pedestals)).toBe(false)
      expect(hasPedestalIntersections(result.pedestals)).toBe(false)
      expect(result.items.every((item) => isFullySupported(item, result.pedestals))).toBe(true)
    },
  )

  it('returns the existing ground layout when pedestals are disabled', () => {
    const result = calculatePedestalLayout(items, 'cluster', 'hero', 'none')

    expect(result.pedestals).toEqual([])
    expect(result.items).toEqual(calculateCompositionLayout(items, 'cluster', 'hero').items)
  })

  it('is deterministic and expands supports around real bounds', () => {
    const first = calculatePedestalLayout(items, 'hero', 'hero', 'steps')
    const second = calculatePedestalLayout(items, 'hero', 'hero', 'steps')

    expect(first).toEqual(second)
    expect(first.pedestals.every((block) => block.width >= block.minWidth)).toBe(true)
    expect(first.pedestals.every((block) => block.depth >= block.minDepth)).toBe(true)
  })

  it('places the hero package on the highest support in hero layout', () => {
    const result = calculatePedestalLayout(items, 'hero', 'hero', 'steps')
    const hero = result.items.find((item) => item.id === 'hero')!
    const heroBottom = hero.position[1] + hero.rotatedBounds.min[1]
    const otherBottoms = result.items.filter((item) => item.id !== 'hero')
      .map((item) => item.position[1] + item.rotatedBounds.min[1])

    expect(heroBottom).toBe(Math.max(heroBottom, ...otherBottoms))
  })
})
