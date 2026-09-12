import { describe, expect, it } from 'vitest'

import {
  calculateCompositionLayout,
  hasLayoutIntersections,
  type LayoutBounds,
} from './layout'

const TWO_ITEMS: LayoutBounds[] = [
  { id: 'a', min: [-1, -2, -0.5], max: [1, 2, 0.5] },
  { id: 'b', min: [-0.5, -1, -1], max: [0.5, 3, 1] },
]

describe('calculateCompositionLayout', () => {
  it.each(['hero', 'family', 'cluster', 'grid'] as const)(
    'grounds, separates, and centers the %s layout',
    (layout) => {
      const result = calculateCompositionLayout(TWO_ITEMS, layout, 'a')

      expect(result.items).toHaveLength(2)
      for (const item of result.items) {
        expect(item.position[1] + item.rotatedBounds.min[1]).toBeCloseTo(0)
      }
      expect(hasLayoutIntersections(result.items, result.gap)).toBe(false)
      expect(result.bounds.min[0] + result.bounds.max[0]).toBeCloseTo(0)
      expect(result.bounds.min[2] + result.bounds.max[2]).toBeCloseTo(0)
    },
  )

  it('places the selected hero in the horizontal center', () => {
    const items: LayoutBounds[] = [
      ...TWO_ITEMS,
      { id: 'c', min: [-0.4, -1, -0.4], max: [0.4, 1, 0.4] },
    ]

    const result = calculateCompositionLayout(items, 'hero', 'b')
    const hero = result.items.find((item) => item.id === 'b')

    expect(hero?.position[0]).toBeCloseTo(0)
    expect(result.items.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('uses two grounded rows for five and six grid items', () => {
    const items = Array.from({ length: 6 }, (_, index): LayoutBounds => ({
      id: String(index),
      min: [-0.5, -1 - index * 0.1, -0.4],
      max: [0.5, 1, 0.4],
    }))

    const result = calculateCompositionLayout(items, 'grid', null)
    const rows = new Set(result.items.map((item) => item.position[2].toFixed(3)))

    expect(rows.size).toBe(2)
    expect(hasLayoutIntersections(result.items, result.gap)).toBe(false)
    expect(result.items.every((item) => item.position[1] + item.rotatedBounds.min[1] === 0)).toBe(true)
  })

  it('moves neighbors when one item becomes wider without scaling either item', () => {
    const initial = calculateCompositionLayout(TWO_ITEMS, 'family', null)
    const resizedBounds: LayoutBounds[] = [
      { ...TWO_ITEMS[0], min: [-2, -2, -0.5], max: [2, 2, 0.5] },
      TWO_ITEMS[1],
    ]
    const resized = calculateCompositionLayout(resizedBounds, 'family', null)

    expect(resized.bounds.max[0] - resized.bounds.min[0]).toBeGreaterThan(
      initial.bounds.max[0] - initial.bounds.min[0],
    )
    expect(resized.items.find((item) => item.id === 'a')?.scale).toEqual([1, 1, 1])
    expect(hasLayoutIntersections(resized.items, resized.gap)).toBe(false)
  })
})
