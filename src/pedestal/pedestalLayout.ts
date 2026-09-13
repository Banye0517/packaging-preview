import type { CompositionLayout, PedestalPreset } from '../app/types'
import {
  calculateCompositionLayout,
  type CompositionLayoutResult,
  type LayoutBounds,
  type PlacedLayoutItem,
  type Vec3Tuple,
} from '../composition/layout'

export interface PedestalBlock {
  id: string
  center: Vec3Tuple
  width: number
  height: number
  depth: number
  minWidth: number
  minDepth: number
}

export interface PedestalLayoutResult extends CompositionLayoutResult {
  pedestals: PedestalBlock[]
  fallbackReason: string | null
}

const MIN_WIDTH = 1.15
const MIN_DEPTH = 1.15
const LEVELS: Record<Exclude<PedestalPreset, 'none'>, readonly number[]> = {
  steps: [1.8, 1.2, 0.6, 0.6, 0, 0],
  islands: [1.45, 0.9, 0.45, 0, 0, 0],
  horizontal: [1.25, 1.25, 0.65, 0.65, 0, 0],
}
const EPSILON = 1e-7

function boundsFor(item: PlacedLayoutItem) {
  return {
    min: item.rotatedBounds.min.map((value, axis) => value + item.position[axis]) as Vec3Tuple,
    max: item.rotatedBounds.max.map((value, axis) => value + item.position[axis]) as Vec3Tuple,
  }
}

function blockBounds(block: PedestalBlock) {
  return {
    min: [block.center[0] - block.width / 2, 0, block.center[2] - block.depth / 2] as Vec3Tuple,
    max: [block.center[0] + block.width / 2, block.height, block.center[2] + block.depth / 2] as Vec3Tuple,
  }
}

function overlapsVolume(a: { min: Vec3Tuple; max: Vec3Tuple }, b: { min: Vec3Tuple; max: Vec3Tuple }) {
  return [0, 1, 2].every((axis) =>
    a.min[axis] < b.max[axis] - EPSILON && a.max[axis] > b.min[axis] + EPSILON,
  )
}

export function hasPackageIntersections(items: PlacedLayoutItem[]) {
  for (let first = 0; first < items.length; first += 1) {
    for (let second = first + 1; second < items.length; second += 1) {
      if (overlapsVolume(boundsFor(items[first]), boundsFor(items[second]))) return true
    }
  }
  return false
}

export function hasPackagePedestalIntersections(items: PlacedLayoutItem[], blocks: PedestalBlock[]) {
  return items.some((item) => blocks.some((block) => overlapsVolume(boundsFor(item), blockBounds(block))))
}

export function hasPedestalIntersections(blocks: PedestalBlock[]) {
  for (let first = 0; first < blocks.length; first += 1) {
    for (let second = first + 1; second < blocks.length; second += 1) {
      if (overlapsVolume(blockBounds(blocks[first]), blockBounds(blocks[second]))) return true
    }
  }
  return false
}

export function isFullySupported(item: PlacedLayoutItem, blocks: PedestalBlock[]) {
  const packageBounds = boundsFor(item)
  if (Math.abs(packageBounds.min[1]) <= EPSILON) return true
  return blocks.some((block) => {
    const support = blockBounds(block)
    return Math.abs(packageBounds.min[1] - support.max[1]) <= EPSILON &&
      packageBounds.min[0] >= support.min[0] - EPSILON &&
      packageBounds.max[0] <= support.max[0] + EPSILON &&
      packageBounds.min[2] >= support.min[2] - EPSILON &&
      packageBounds.max[2] <= support.max[2] + EPSILON
  })
}

function expandSupportBounds(items: LayoutBounds[], margin: number) {
  return items.map((item) => {
    const centerX = (item.min[0] + item.max[0]) / 2
    const centerZ = (item.min[2] + item.max[2]) / 2
    const width = Math.max(MIN_WIDTH, item.max[0] - item.min[0] + margin * 2)
    const depth = Math.max(MIN_DEPTH, item.max[2] - item.min[2] + margin * 2)
    return {
      ...item,
      min: [centerX - width / 2, item.min[1], centerZ - depth / 2] as Vec3Tuple,
      max: [centerX + width / 2, item.max[1], centerZ + depth / 2] as Vec3Tuple,
    }
  })
}

function combinedBounds(items: PlacedLayoutItem[], blocks: PedestalBlock[]) {
  const all = [
    ...items.map(boundsFor),
    ...blocks.map(blockBounds),
  ]
  const min: Vec3Tuple = [Infinity, Infinity, Infinity]
  const max: Vec3Tuple = [-Infinity, -Infinity, -Infinity]
  for (const entry of all) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], entry.min[axis])
      max[axis] = Math.max(max[axis], entry.max[axis])
    }
  }
  return { min, max }
}

function safeGroundFallback(
  items: LayoutBounds[],
  layout: CompositionLayout,
  heroId: string | null,
  message: string,
): PedestalLayoutResult {
  const ground = calculateCompositionLayout(items, layout, heroId)
  return { ...ground, pedestals: [], fallbackReason: message }
}

export function calculatePedestalLayout(
  items: LayoutBounds[],
  layout: CompositionLayout,
  heroId: string | null,
  preset: PedestalPreset,
): PedestalLayoutResult {
  const ground = calculateCompositionLayout(items, layout, heroId)
  if (preset === 'none' || items.length === 0) {
    return { ...ground, pedestals: [], fallbackReason: null }
  }

  const averageHeight = items.reduce((sum, item) => sum + item.max[1] - item.min[1], 0) / items.length
  const supportMargin = Math.max(0.12, Math.min(0.32, averageHeight * 0.04))
  const supportLayout = calculateCompositionLayout(expandSupportBounds(items, supportMargin), layout, heroId)
  const packageById = new Map(ground.items.map((item) => [item.id, item]))
  const orderedIds = items.map((item) => item.id)
  if (layout === 'hero' && heroId && orderedIds.includes(heroId)) {
    orderedIds.splice(orderedIds.indexOf(heroId), 1)
    orderedIds.unshift(heroId)
  }
  const levelById = new Map(orderedIds.map((id, index) => [id, LEVELS[preset][index] ?? 0]))

  const placed = supportLayout.items.map((supportItem) => {
    const packageItem = packageById.get(supportItem.id)!
    const level = levelById.get(supportItem.id) ?? 0
    return {
      ...packageItem,
      position: [supportItem.position[0], level - packageItem.rotatedBounds.min[1], supportItem.position[2]] as Vec3Tuple,
    }
  })

  const pedestals = supportLayout.items.flatMap((supportItem) => {
    const level = levelById.get(supportItem.id) ?? 0
    if (level <= 0) return []
    const packageItem = placed.find((item) => item.id === supportItem.id)!
    const packageWorld = boundsFor(packageItem)
    return [{
      id: `pedestal-${supportItem.id}`,
      center: [
        (packageWorld.min[0] + packageWorld.max[0]) / 2,
        level / 2,
        (packageWorld.min[2] + packageWorld.max[2]) / 2,
      ] as Vec3Tuple,
      width: supportItem.rotatedBounds.max[0] - supportItem.rotatedBounds.min[0],
      height: level,
      depth: supportItem.rotatedBounds.max[2] - supportItem.rotatedBounds.min[2],
      minWidth: MIN_WIDTH,
      minDepth: MIN_DEPTH,
    }]
  })

  if (hasPackageIntersections(placed) || hasPackagePedestalIntersections(placed, pedestals) ||
      hasPedestalIntersections(pedestals) || placed.some((item) => !isFullySupported(item, pedestals))) {
    return safeGroundFallback(items, layout, heroId, '展台空间不足，已恢复无展台排列')
  }

  const beforeCentering = combinedBounds(placed, pedestals)
  const shiftX = -(beforeCentering.min[0] + beforeCentering.max[0]) / 2
  const shiftZ = -(beforeCentering.min[2] + beforeCentering.max[2]) / 2
  const centeredItems = placed.map((item) => ({
    ...item,
    position: [item.position[0] + shiftX, item.position[1], item.position[2] + shiftZ] as Vec3Tuple,
  }))
  const centeredPedestals = pedestals.map((block) => ({
    ...block,
    center: [block.center[0] + shiftX, block.center[1], block.center[2] + shiftZ] as Vec3Tuple,
  }))

  return {
    items: centeredItems,
    pedestals: centeredPedestals,
    bounds: combinedBounds(centeredItems, centeredPedestals),
    gap: supportLayout.gap,
    fallbackReason: null,
  }
}
