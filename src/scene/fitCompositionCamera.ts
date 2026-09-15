import { CAMERA_DISTANCE_LIMITS } from './cameraLimits'

export type Vec3Tuple = [number, number, number]
export type BoundsTuple = [number, number, number, number, number, number]
export type CompositionBounds = { min: Vec3Tuple; max: Vec3Tuple } | BoundsTuple

export interface FitCompositionCameraOptions {
  bounds: CompositionBounds
  fov: number
  aspect: number
  viewDirection?: Vec3Tuple
  target?: Vec3Tuple
  distanceLimits?: { min: number; max: number }
}

export interface FitCompositionCameraResult {
  position: Vec3Tuple
  target: Vec3Tuple
  distance: number
  near: number
  far: number
}

const MARGIN = 1.12

function normalize(value: Vec3Tuple): Vec3Tuple {
  const length = Math.hypot(...value)
  if (!Number.isFinite(length) || length < 1e-9) return [0, 0, -1]
  return [value[0] / length, value[1] / length, value[2] / length]
}

function cross(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function getBounds(bounds: CompositionBounds): { min: Vec3Tuple; max: Vec3Tuple } {
  return Array.isArray(bounds)
    ? { min: [bounds[0], bounds[1], bounds[2]], max: [bounds[3], bounds[4], bounds[5]] }
    : bounds
}

function corners(min: Vec3Tuple, max: Vec3Tuple): Vec3Tuple[] {
  return [
    [min[0], min[1], min[2]], [min[0], min[1], max[2]], [min[0], max[1], min[2]], [min[0], max[1], max[2]],
    [max[0], min[1], min[2]], [max[0], min[1], max[2]], [max[0], max[1], min[2]], [max[0], max[1], max[2]],
  ]
}

export function fitCompositionCamera(options: FitCompositionCameraOptions): FitCompositionCameraResult {
  const { min, max } = getBounds(options.bounds)
  const target: Vec3Tuple = options.target ?? [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  const direction = normalize(options.viewDirection ?? [0, 0, -1])
  const worldUp: Vec3Tuple = Math.abs(direction[1]) > 0.98 ? [0, 0, 1] : [0, 1, 0]
  const right = normalize(cross(direction, worldUp))
  const up = normalize(cross(right, direction))
  const projected = corners(min, max).map((corner) => [corner[0] - target[0], corner[1] - target[1], corner[2] - target[2]] as Vec3Tuple)
  const halfWidth = Math.max(...projected.map((point) => Math.abs(point[0] * right[0] + point[1] * right[1] + point[2] * right[2])))
  const halfHeight = Math.max(...projected.map((point) => Math.abs(point[0] * up[0] + point[1] * up[1] + point[2] * up[2])))
  const halfDepth = Math.max(...projected.map((point) => Math.abs(point[0] * direction[0] + point[1] * direction[1] + point[2] * direction[2])))
  const verticalFov = options.fov * Math.PI / 180
  const aspect = Math.max(options.aspect, 1e-6)
  const verticalDistance = halfHeight / Math.tan(verticalFov / 2)
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect)
  const horizontalDistance = halfWidth / Math.tan(horizontalFov / 2)
  const radius = Math.hypot(
    (max[0] - min[0]) / 2,
    (max[1] - min[1]) / 2,
    (max[2] - min[2]) / 2,
  )
  const orbitSafeDistance = radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2) * MARGIN
  const unclampedDistance = Math.max(
    Math.max(verticalDistance, horizontalDistance) * MARGIN + halfDepth,
    orbitSafeDistance,
  )
  const limits = options.distanceLimits ?? CAMERA_DISTANCE_LIMITS
  const distance = Math.min(Math.max(unclampedDistance, limits.min), limits.max)
  const position: Vec3Tuple = [target[0] - direction[0] * distance, target[1] - direction[1] * distance, target[2] - direction[2] * distance]
  return {
    position,
    target,
    distance,
    near: 0.01,
    far: Math.max(distance + radius * 2, limits.max + radius * 2),
  }
}

export const calculateFitCompositionCamera = fitCompositionCamera
