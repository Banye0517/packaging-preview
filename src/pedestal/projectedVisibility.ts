export interface ScreenRect {
  left: number
  top: number
  right: number
  bottom: number
}

export const MIN_REAR_VISIBLE_FRACTION = 0.8
const DEFAULT_VIEW_DIRECTION: [number, number, number] = [-6.4, -5.2, -8.8]

export interface ProjectableBounds {
  id: string
  min: [number, number, number]
  max: [number, number, number]
}

function corners(bounds: ProjectableBounds) {
  const { min, max } = bounds
  return [
    [min[0], min[1], min[2]], [min[0], min[1], max[2]], [min[0], max[1], min[2]], [min[0], max[1], max[2]],
    [max[0], min[1], min[2]], [max[0], min[1], max[2]], [max[0], max[1], min[2]], [max[0], max[1], max[2]],
  ] as Array<[number, number, number]>
}

export function calculateProjectedRects(
  items: ProjectableBounds[],
  aspect = 1,
  fitBounds?: { min: [number, number, number]; max: [number, number, number] },
) {
  const rectangles = new Map<string, ScreenRect>()
  if (items.length === 0) return rectangles
  const sceneBounds = fitBounds ?? {
    min: [
      Math.min(...items.map((item) => item.min[0])),
      Math.min(0, ...items.map((item) => item.min[1])),
      Math.min(...items.map((item) => item.min[2])),
    ] as [number, number, number],
    max: [
      Math.max(...items.map((item) => item.max[0])),
      Math.max(...items.map((item) => item.max[1])),
      Math.max(...items.map((item) => item.max[2])),
    ] as [number, number, number],
  }
  const fit = fitCompositionCamera({ bounds: sceneBounds, fov: 38, aspect, viewDirection: DEFAULT_VIEW_DIRECTION })
  const camera = new PerspectiveCamera(38, aspect, fit.near, fit.far)
  camera.position.set(...fit.position)
  camera.lookAt(...fit.target)
  camera.updateMatrixWorld(true)
  for (const item of items) {
    const projected = corners(item).map((point) => new Vector3(...point).project(camera))
    rectangles.set(item.id, {
      left: Math.min(...projected.map((point) => point.x)),
      top: -Math.max(...projected.map((point) => point.y)),
      right: Math.max(...projected.map((point) => point.x)),
      bottom: -Math.min(...projected.map((point) => point.y)),
    })
  }
  return rectangles
}

function area(rect: ScreenRect) {
  return Math.max(0, rect.right - rect.left) * Math.max(0, rect.bottom - rect.top)
}

export function calculateVisibleFraction(rear: ScreenRect, occluders: ScreenRect[]) {
  const rearArea = area(rear)
  if (rearArea <= 0) return 1
  const xs = [rear.left, rear.right]
  const ys = [rear.top, rear.bottom]
  for (const occluder of occluders) {
    xs.push(Math.max(rear.left, occluder.left), Math.min(rear.right, occluder.right))
    ys.push(Math.max(rear.top, occluder.top), Math.min(rear.bottom, occluder.bottom))
  }
  const sortedX = [...new Set(xs)].filter((value) => value >= rear.left && value <= rear.right).sort((a, b) => a - b)
  const sortedY = [...new Set(ys)].filter((value) => value >= rear.top && value <= rear.bottom).sort((a, b) => a - b)
  let covered = 0
  for (let x = 0; x < sortedX.length - 1; x += 1) {
    for (let y = 0; y < sortedY.length - 1; y += 1) {
      const centerX = (sortedX[x] + sortedX[x + 1]) / 2
      const centerY = (sortedY[y] + sortedY[y + 1]) / 2
      if (occluders.some((rect) => centerX > rect.left && centerX < rect.right && centerY > rect.top && centerY < rect.bottom)) {
        covered += (sortedX[x + 1] - sortedX[x]) * (sortedY[y + 1] - sortedY[y])
      }
    }
  }
  return Math.max(0, 1 - covered / rearArea)
}

export function getRequiredRearSupportHeight(
  rearLocalBounds: { minY: number; maxY: number },
  highestFrontTop: number,
  visibleFraction = MIN_REAR_VISIBLE_FRACTION,
) {
  const height = rearLocalBounds.maxY - rearLocalBounds.minY
  return highestFrontTop + height * visibleFraction - rearLocalBounds.maxY
}
import { PerspectiveCamera, Vector3 } from 'three'

import { fitCompositionCamera } from '../scene/fitCompositionCamera'
