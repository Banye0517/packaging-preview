import type { CompositionLayout } from '../app/types'

export type Vec3Tuple = [number, number, number]

export interface LayoutBounds {
  id: string
  min: Vec3Tuple
  max: Vec3Tuple
}

export interface PlacedLayoutItem {
  id: string
  position: Vec3Tuple
  rotationY: number
  scale: Vec3Tuple
  rotatedBounds: LayoutBounds
}

export interface CompositionLayoutResult {
  items: PlacedLayoutItem[]
  bounds: Omit<LayoutBounds, 'id'>
  gap: number
}

interface PreparedItem extends LayoutBounds {
  width: number
  height: number
  depth: number
  rotationY: number
}

function rotateBounds(item: LayoutBounds, rotationY: number): PreparedItem {
  const height = item.max[1] - item.min[1]
  const cosine = Math.cos(rotationY)
  const sine = Math.sin(rotationY)
  const corners = [
    [item.min[0], item.min[2]], [item.min[0], item.max[2]],
    [item.max[0], item.min[2]], [item.max[0], item.max[2]],
  ]
  const rotatedX = corners.map(([x, z]) => x * cosine + z * sine)
  const rotatedZ = corners.map(([x, z]) => -x * sine + z * cosine)
  const minX = Math.min(...rotatedX)
  const maxX = Math.max(...rotatedX)
  const minZ = Math.min(...rotatedZ)
  const maxZ = Math.max(...rotatedZ)

  return {
    ...item,
    min: [minX, item.min[1], minZ],
    max: [maxX, item.max[1], maxZ],
    width: maxX - minX,
    height,
    depth: maxZ - minZ,
    rotationY,
  }
}

function packRow(items: PreparedItem[], z: number, gap: number) {
  const totalWidth = items.reduce((sum, item) => sum + item.width, 0) + gap * Math.max(0, items.length - 1)
  let cursor = -totalWidth / 2
  return items.map((item) => {
    const x = cursor + item.width / 2
    cursor += item.width + gap
    return placeItem(item, x, z)
  })
}

function placeItem(item: PreparedItem, x: number, z: number): PlacedLayoutItem {
  const centerX = (item.min[0] + item.max[0]) / 2
  const centerZ = (item.min[2] + item.max[2]) / 2
  return {
    id: item.id,
    position: [x - centerX, -item.min[1], z - centerZ],
    rotationY: item.rotationY,
    scale: [1, 1, 1],
    rotatedBounds: {
      id: item.id,
      min: [...item.min],
      max: [...item.max],
    },
  }
}

function layoutFamily(items: LayoutBounds[], gap: number) {
  return packRow(items.map((item) => rotateBounds(item, 0)), 0, gap)
}

function layoutCluster(items: LayoutBounds[], gap: number) {
  const prepared = items.map((item, index) => rotateBounds(item, index % 2 === 0 ? -0.08 : 0.08))
  const placed = packRow(prepared, 0, gap)
  const maximumDepth = Math.max(...prepared.map((item) => item.depth))
  return placed.map((item, index) => ({
    ...item,
    position: [item.position[0], item.position[1], item.position[2] + (index % 2 === 0 ? 0.08 : -0.08) * maximumDepth] as Vec3Tuple,
  }))
}

function layoutGrid(items: LayoutBounds[], gap: number) {
  const prepared = items.map((item) => rotateBounds(item, 0))
  if (prepared.length <= 3) return packRow(prepared, 0, gap)
  const front = prepared.slice(0, 3)
  const back = prepared.slice(3)
  const frontDepth = Math.max(...front.map((item) => item.depth))
  const backDepth = Math.max(...back.map((item) => item.depth))
  const rowDistance = frontDepth / 2 + backDepth / 2 + gap
  return [
    ...packRow(front, rowDistance / 2, gap),
    ...packRow(back, -rowDistance / 2, gap),
  ]
}

function layoutHero(items: LayoutBounds[], heroId: string | null, gap: number) {
  const heroIndex = Math.max(0, items.findIndex((item) => item.id === heroId))
  const hero = rotateBounds(items[heroIndex], 0)
  const others = items
    .filter((_, index) => index !== heroIndex)
    .map((item, index) => rotateBounds(item, index % 2 === 0 ? 0.1 : -0.1))
  if (items.length === 2) {
    const other = others[0]
    const distance = hero.depth / 2 + other.depth / 2 + gap
    const byId = new Map([
      placeItem(hero, 0, distance / 2),
      placeItem(other, 0, -distance / 2),
    ].map((item) => [item.id, item]))
    return items.map((item) => byId.get(item.id)!)
  }
  const left = others.filter((_, index) => index % 2 === 0).reverse()
  const right = others.filter((_, index) => index % 2 === 1)
  const leftPlaced = packRow(left, 0, gap)
  const rightPlaced = packRow(right, 0, gap)
  let leftCursor = -hero.width / 2 - gap
  for (const item of leftPlaced.reverse()) {
    const localCenter = (item.rotatedBounds.min[0] + item.rotatedBounds.max[0]) / 2
    item.position[0] = leftCursor - (item.rotatedBounds.max[0] - item.rotatedBounds.min[0]) / 2 - localCenter
    leftCursor = item.position[0] - (item.rotatedBounds.max[0] - item.rotatedBounds.min[0]) / 2 - gap
  }
  let rightCursor = hero.width / 2 + gap
  for (const item of rightPlaced) {
    const localCenter = (item.rotatedBounds.min[0] + item.rotatedBounds.max[0]) / 2
    item.position[0] = rightCursor + (item.rotatedBounds.max[0] - item.rotatedBounds.min[0]) / 2 - localCenter
    rightCursor = item.position[0] + (item.rotatedBounds.max[0] - item.rotatedBounds.min[0]) / 2 + gap
  }
  if (leftPlaced.length > 0 && rightPlaced.length > 0) {
    const leftEdge = Math.min(...leftPlaced.map((item) => item.position[0] + item.rotatedBounds.min[0]))
    const rightEdge = Math.max(...rightPlaced.map((item) => item.position[0] + item.rotatedBounds.max[0]))
    const balancedExtent = Math.max(-leftEdge, rightEdge)
    const leftShift = -balancedExtent - leftEdge
    const rightShift = balancedExtent - rightEdge
    leftPlaced.forEach((item) => { item.position[0] += leftShift })
    rightPlaced.forEach((item) => { item.position[0] += rightShift })
  }
  const byId = new Map([
    ...leftPlaced,
    placeItem(hero, 0, 0),
    ...rightPlaced,
  ].map((item) => [item.id, item]))
  return items.map((item) => byId.get(item.id)!)
}

function getCombinedBounds(items: PlacedLayoutItem[]) {
  const min: Vec3Tuple = [Infinity, Infinity, Infinity]
  const max: Vec3Tuple = [-Infinity, -Infinity, -Infinity]
  for (const item of items) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], item.position[axis] + item.rotatedBounds.min[axis])
      max[axis] = Math.max(max[axis], item.position[axis] + item.rotatedBounds.max[axis])
    }
  }
  return { min, max }
}

export function hasLayoutIntersections(items: PlacedLayoutItem[], gap = 0) {
  const epsilon = 1e-9
  for (let first = 0; first < items.length; first += 1) {
    for (let second = first + 1; second < items.length; second += 1) {
      const a = items[first]
      const b = items[second]
      const separatedX = a.position[0] + a.rotatedBounds.max[0] + gap <= b.position[0] + b.rotatedBounds.min[0] + epsilon
        || b.position[0] + b.rotatedBounds.max[0] + gap <= a.position[0] + a.rotatedBounds.min[0] + epsilon
      const separatedZ = a.position[2] + a.rotatedBounds.max[2] + gap <= b.position[2] + b.rotatedBounds.min[2] + epsilon
        || b.position[2] + b.rotatedBounds.max[2] + gap <= a.position[2] + a.rotatedBounds.min[2] + epsilon
      if (!separatedX && !separatedZ) return true
    }
  }
  return false
}

export function calculateCompositionLayout(
  items: LayoutBounds[],
  layout: CompositionLayout,
  heroId: string | null,
): CompositionLayoutResult {
  if (items.length === 0) {
    return { items: [], bounds: { min: [0, 0, 0], max: [0, 0, 0] }, gap: 0.12 }
  }
  const averageHeight = items.reduce((sum, item) => sum + item.max[1] - item.min[1], 0) / items.length
  const gap = Math.max(0.12, Math.min(0.45, averageHeight * 0.08))
  const placed = layout === 'hero'
    ? layoutHero(items, heroId, gap)
    : layout === 'cluster'
      ? layoutCluster(items, gap)
      : layout === 'grid'
        ? layoutGrid(items, gap)
        : layoutFamily(items, gap)
  const beforeCentering = getCombinedBounds(placed)
  const centerX = (beforeCentering.min[0] + beforeCentering.max[0]) / 2
  const centerZ = (beforeCentering.min[2] + beforeCentering.max[2]) / 2
  const centered = placed.map((item) => ({
    ...item,
    position: [item.position[0] - centerX, item.position[1], item.position[2] - centerZ] as Vec3Tuple,
  }))
  return { items: centered, bounds: getCombinedBounds(centered), gap }
}
