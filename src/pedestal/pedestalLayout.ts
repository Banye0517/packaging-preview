import type { CompositionLayout, PedestalPreset } from '../app/types'
import {
  calculateCompositionLayout,
  type CompositionLayoutResult,
  type LayoutBounds,
  type PlacedLayoutItem,
  type Vec3Tuple,
} from '../composition/layout'
import {
  calculateProjectedRects,
  calculateVisibleFraction,
  getRequiredRearSupportHeight,
  MIN_REAR_VISIBLE_FRACTION,
} from './projectedVisibility'

export interface PedestalBlock {
  id: string
  role: 'base' | 'riser'
  center: Vec3Tuple
  width: number
  height: number
  depth: number
  minWidth: number
  minDepth: number
}

export interface PackageSupport {
  packageId: string
  blockId: string
  row: 'front' | 'rear'
  height: number
}

export interface PedestalLayoutResult extends CompositionLayoutResult {
  pedestals: PedestalBlock[]
  supports: PackageSupport[]
  fallbackReason: string | null
}

const MIN_WIDTH = 1.15
const MIN_DEPTH = 1.15
const BASE_HEIGHT = 0.36
const REAR_RISES: Record<Exclude<PedestalPreset, 'none'>, readonly number[]> = {
  steps: [1.35, 1, 0.75],
  islands: [1.15, 0.85, 0.65],
  horizontal: [0.9, 0.9, 0.9],
}
const EPSILON = 1e-7
const EXPORT_ASPECTS = [1, 16 / 9, 9 / 16] as const

function boundsFor(item: PlacedLayoutItem) {
  return {
    min: item.rotatedBounds.min.map((value, axis) => value + item.position[axis]) as Vec3Tuple,
    max: item.rotatedBounds.max.map((value, axis) => value + item.position[axis]) as Vec3Tuple,
  }
}

function blockBounds(block: PedestalBlock) {
  return {
    min: [block.center[0] - block.width / 2, block.center[1] - block.height / 2, block.center[2] - block.depth / 2] as Vec3Tuple,
    max: [block.center[0] + block.width / 2, block.center[1] + block.height / 2, block.center[2] + block.depth / 2] as Vec3Tuple,
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

function getProjectedVisibility(
  placed: PlacedLayoutItem[],
  packageId: string,
  rearIds: Set<string>,
  supportMargin: number,
) {
  const worldItems = placed.map((item) => ({ id: item.id, ...boundsFor(item) }))
  const fitBounds = {
    min: [
      Math.min(...worldItems.map((item) => item.min[0])) - supportMargin,
      0,
      Math.min(...worldItems.map((item) => item.min[2])) - supportMargin,
    ] as Vec3Tuple,
    max: [
      Math.max(...worldItems.map((item) => item.max[0])) + supportMargin,
      Math.max(...worldItems.map((item) => item.max[1])),
      Math.max(...worldItems.map((item) => item.max[2])) + supportMargin,
    ] as Vec3Tuple,
  }
  return Math.min(...EXPORT_ASPECTS.map((aspect) => {
    const rectangles = calculateProjectedRects(worldItems, aspect, fitBounds)
    const frontRects = placed.filter((item) => !rearIds.has(item.id)).map((item) => rectangles.get(item.id)!)
    return calculateVisibleFraction(rectangles.get(packageId)!, frontRects)
  }))
}

function safeGroundFallback(
  items: LayoutBounds[],
  layout: CompositionLayout,
  heroId: string | null,
  message: string,
): PedestalLayoutResult {
  const ground = calculateCompositionLayout(items, layout, heroId)
  return { ...ground, pedestals: [], supports: ground.items.map((item) => ({ packageId: item.id, blockId: 'ground', row: 'front', height: 0 })), fallbackReason: message }
}

function getRearIds(ids: string[], layout: CompositionLayout, heroId: string | null) {
  const rearCount = Math.floor(ids.length / 2)
  if (rearCount === 0) return new Set<string>()
  if (layout === 'hero' && heroId && ids.includes(heroId)) {
    return new Set([heroId, ...ids.filter((id) => id !== heroId).slice(-(rearCount - 1))])
  }
  if (layout === 'family') return new Set(ids.filter((_, index) => index % 2 === 1).slice(0, rearCount))
  if (layout === 'cluster') return new Set(ids.filter((_, index) => index % 2 === 0).slice(0, rearCount))
  return new Set(ids.slice(-rearCount))
}

function packSupportRow(items: PlacedLayoutItem[], z: number, gap: number) {
  const totalWidth = items.reduce((sum, item) => sum + item.rotatedBounds.max[0] - item.rotatedBounds.min[0], 0) + gap * Math.max(0, items.length - 1)
  let cursor = -totalWidth / 2
  return items.map((item) => {
    const width = item.rotatedBounds.max[0] - item.rotatedBounds.min[0]
    const centerX = cursor + width / 2
    const localCenterX = (item.rotatedBounds.min[0] + item.rotatedBounds.max[0]) / 2
    const localCenterZ = (item.rotatedBounds.min[2] + item.rotatedBounds.max[2]) / 2
    cursor += width + gap
    return { ...item, position: [centerX - localCenterX, item.position[1], z - localCenterZ] as Vec3Tuple }
  })
}

export function calculatePedestalLayout(
  items: LayoutBounds[],
  layout: CompositionLayout,
  heroId: string | null,
  preset: PedestalPreset,
): PedestalLayoutResult {
  const ground = calculateCompositionLayout(items, layout, heroId)
  if (preset === 'none' || items.length === 0) {
    return { ...ground, pedestals: [], supports: ground.items.map((item) => ({ packageId: item.id, blockId: 'ground', row: 'front', height: 0 })), fallbackReason: null }
  }

  const averageHeight = items.reduce((sum, item) => sum + item.max[1] - item.min[1], 0) / items.length
  const supportMargin = Math.max(0.12, Math.min(0.32, averageHeight * 0.04))
  const supportLayout = calculateCompositionLayout(expandSupportBounds(items, supportMargin), layout, heroId)
  const packageById = new Map(ground.items.map((item) => [item.id, item]))
  const ids = items.map((item) => item.id)
  const rearIds = getRearIds(ids, layout, heroId)
  const supportsById = new Map(supportLayout.items.map((item) => [item.id, item]))
  const orderedSupportItems = ids.map((id) => supportsById.get(id)!)
  const frontSupportItems = orderedSupportItems.filter((item) => !rearIds.has(item.id))
  const rearSupportItems = orderedSupportItems.filter((item) => rearIds.has(item.id))
  const frontDepth = Math.max(0, ...frontSupportItems.map((item) => item.rotatedBounds.max[2] - item.rotatedBounds.min[2]))
  const rearDepth = Math.max(0, ...rearSupportItems.map((item) => item.rotatedBounds.max[2] - item.rotatedBounds.min[2]))
  const rowDistance = rearSupportItems.length > 0 ? frontDepth / 2 + rearDepth / 2 + supportLayout.gap : 0
  const rowPlaced = [
    ...packSupportRow(frontSupportItems, rowDistance / 2, supportLayout.gap),
    ...packSupportRow(rearSupportItems, -rowDistance / 2, supportLayout.gap),
  ]
  const rearOrder = new Map(rearSupportItems.map((item, index) => [item.id, index]))
  const topById = new Map(rowPlaced.map((item) => [
    item.id,
    rearIds.has(item.id) ? BASE_HEIGHT + (REAR_RISES[preset][rearOrder.get(item.id) ?? 0] ?? REAR_RISES[preset][0]) : BASE_HEIGHT,
  ]))
  for (const rearItem of rowPlaced.filter((item) => rearIds.has(item.id))) {
    const rearPackage = packageById.get(rearItem.id)!
    const rearMinX = rearItem.position[0] + rearPackage.rotatedBounds.min[0]
    const rearMaxX = rearItem.position[0] + rearPackage.rotatedBounds.max[0]
    const overlappingFrontTops = rowPlaced.filter((item) => !rearIds.has(item.id)).flatMap((frontItem) => {
      const frontPackage = packageById.get(frontItem.id)!
      const frontMinX = frontItem.position[0] + frontPackage.rotatedBounds.min[0]
      const frontMaxX = frontItem.position[0] + frontPackage.rotatedBounds.max[0]
      if (frontMaxX <= rearMinX || frontMinX >= rearMaxX) return []
      return [BASE_HEIGHT + frontPackage.rotatedBounds.max[1] - frontPackage.rotatedBounds.min[1]]
    })
    if (overlappingFrontTops.length === 0) continue
    const visibilityHeight = getRequiredRearSupportHeight(
      { minY: rearPackage.rotatedBounds.min[1], maxY: rearPackage.rotatedBounds.max[1] },
      Math.max(...overlappingFrontTops),
    )
    topById.set(rearItem.id, Math.max(topById.get(rearItem.id)!, visibilityHeight))
  }
  if (layout === 'hero' && heroId && topById.has(heroId)) {
    topById.set(heroId, Math.max(...topById.values()))
  }
  const createPlacedItems = () => rowPlaced.map((supportItem) => {
    const packageItem = packageById.get(supportItem.id)!
    const top = topById.get(supportItem.id)!
    return { ...packageItem, position: [supportItem.position[0], top - packageItem.rotatedBounds.min[1], supportItem.position[2]] as Vec3Tuple }
  })
  const maxPackageHeight = Math.max(...items.map((item) => item.max[1] - item.min[1]))
  for (let pass = 0; pass < 3; pass += 1) {
    let changed = false
    for (const rearItem of rowPlaced.filter((item) => rearIds.has(item.id))) {
      const currentPlaced = createPlacedItems()
      if (getProjectedVisibility(currentPlaced, rearItem.id, rearIds, supportMargin) >= MIN_REAR_VISIBLE_FRACTION) continue
      const initialTop = topById.get(rearItem.id)!
      let low = initialTop
      let high = initialTop + maxPackageHeight * 4 + 2
      for (let iteration = 0; iteration < 18; iteration += 1) {
        const candidate = (low + high) / 2
        topById.set(rearItem.id, candidate)
        const candidatePlaced = createPlacedItems()
        const visible = getProjectedVisibility(candidatePlaced, rearItem.id, rearIds, supportMargin)
        if (visible >= MIN_REAR_VISIBLE_FRACTION) high = candidate
        else low = candidate
      }
      topById.set(rearItem.id, high)
      changed = true
    }
    if (!changed) break
  }
  const placed = createPlacedItems()
  const packageWorldBounds = placed.map(boundsFor)
  const minX = Math.min(...packageWorldBounds.map((entry) => entry.min[0])) - supportMargin
  const maxX = Math.max(...packageWorldBounds.map((entry) => entry.max[0])) + supportMargin
  const minZ = Math.min(...packageWorldBounds.map((entry) => entry.min[2])) - supportMargin
  const maxZ = Math.max(...packageWorldBounds.map((entry) => entry.max[2])) + supportMargin
  const base: PedestalBlock = {
    id: 'pedestal-base', role: 'base', center: [(minX + maxX) / 2, BASE_HEIGHT / 2, (minZ + maxZ) / 2],
    width: maxX - minX, height: BASE_HEIGHT, depth: maxZ - minZ, minWidth: MIN_WIDTH, minDepth: MIN_DEPTH,
  }
  const risers = rowPlaced.flatMap((supportItem) => {
    if (!rearIds.has(supportItem.id)) return []
    const top = topById.get(supportItem.id)!
    const riserHeight = top - BASE_HEIGHT
    const packageItem = placed.find((item) => item.id === supportItem.id)!
    const packageWorld = boundsFor(packageItem)
    return [{
      id: `pedestal-${supportItem.id}`,
      role: 'riser' as const,
      center: [
        (packageWorld.min[0] + packageWorld.max[0]) / 2,
        BASE_HEIGHT + riserHeight / 2,
        (packageWorld.min[2] + packageWorld.max[2]) / 2,
      ] as Vec3Tuple,
      width: supportItem.rotatedBounds.max[0] - supportItem.rotatedBounds.min[0],
      height: riserHeight,
      depth: supportItem.rotatedBounds.max[2] - supportItem.rotatedBounds.min[2],
      minWidth: MIN_WIDTH,
      minDepth: MIN_DEPTH,
    }]
  })
  const pedestals = [base, ...risers]
  const supports: PackageSupport[] = placed.map((item) => ({
    packageId: item.id,
    blockId: rearIds.has(item.id) ? `pedestal-${item.id}` : base.id,
    row: rearIds.has(item.id) ? 'rear' : 'front',
    height: topById.get(item.id)!,
  }))

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
    supports,
    bounds: combinedBounds(centeredItems, centeredPedestals),
    gap: supportLayout.gap,
    fallbackReason: null,
  }
}
