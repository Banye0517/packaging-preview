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
import { calculateProjectedRects, calculateVisibleFraction, MIN_REAR_VISIBLE_FRACTION } from './projectedVisibility'

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
      expect(result.pedestals.filter((block) => block.role === 'base')).toHaveLength(1)
      const base = result.pedestals.find((block) => block.role === 'base')!
      expect(base.center[1] - base.height / 2).toBeCloseTo(0)
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

  it('keeps every rear support higher than the front row', () => {
    const result = calculatePedestalLayout(items, 'grid', 'hero', 'steps')
    const frontHeights = result.supports.filter((support) => support.row === 'front').map((support) => support.height)
    const rearHeights = result.supports.filter((support) => support.row === 'rear').map((support) => support.height)

    expect(frontHeights.length).toBeGreaterThan(0)
    expect(rearHeights.length).toBeGreaterThan(0)
    expect(Math.min(...rearHeights)).toBeGreaterThan(Math.max(...frontHeights))
  })

  it('raises short rear packages above tall overlapping front silhouettes', () => {
    const visibilityItems: LayoutBounds[] = [
      { id: 'front-tall', min: [-1, 0, -0.5], max: [1, 5, 0.5] },
      { id: 'front-small', min: [-0.5, 0, -0.5], max: [0.5, 1, 0.5] },
      { id: 'rear-short', min: [-1, 0, -0.5], max: [1, 1, 0.5] },
      { id: 'rear-small', min: [-0.5, 0, -0.5], max: [0.5, 1, 0.5] },
    ]
    const result = calculatePedestalLayout(visibilityItems, 'grid', null, 'steps')
    const rear = result.supports.find((support) => support.packageId === 'rear-short')!

    expect(rear.height).toBeGreaterThan(5)
  })

  it('keeps at least 80 percent of every rear projected bounds visible in the default camera', () => {
    const result = calculatePedestalLayout(items, 'cluster', 'hero', 'steps')
    const worldBounds = result.items.map((item) => ({
      id: item.id,
      min: item.rotatedBounds.min.map((value, axis) => value + item.position[axis]) as [number, number, number],
      max: item.rotatedBounds.max.map((value, axis) => value + item.position[axis]) as [number, number, number],
    }))
    for (const aspect of [1, 16 / 9, 9 / 16]) {
      const rectangles = calculateProjectedRects(worldBounds, aspect, result.bounds)
      const frontRects = result.supports
        .filter((support) => support.row === 'front')
        .map((support) => rectangles.get(support.packageId)!)

      for (const support of result.supports.filter((entry) => entry.row === 'rear')) {
        expect(calculateVisibleFraction(rectangles.get(support.packageId)!, frontRects))
          .toBeGreaterThanOrEqual(MIN_REAR_VISIBLE_FRACTION - 0.005)
      }
    }
  })
})
