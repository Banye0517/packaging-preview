import { BufferAttribute, type BufferGeometry } from 'three'

import type { HangingTissueFace } from '../app/types'

export interface HangingTissueDeformation {
  bodyMinY: number
  bodyMaxY: number
  connectorMaxY: number
  widthScale: number
  heightScale: number
  depthScale: number
  radius?: number
  bodyWidth?: number
  bodyDepth?: number
  bodyCenterX?: number
  bodyCenterZ?: number
  bodyHalfWidth?: number
  bodyHalfDepth?: number
  surfaceFace?: HangingTissueFace
}

function roundedCrossSection(
  x: number,
  z: number,
  weight: number,
  options: HangingTissueDeformation,
) {
  const radius = Math.min(
    Math.max(options.radius ?? 0, 0),
    (options.bodyWidth ?? 0) / 2,
    (options.bodyDepth ?? 0) / 2,
  )
  if (radius === 0 || !options.bodyWidth || !options.bodyDepth ||
    !options.bodyHalfWidth || !options.bodyHalfDepth || weight === 0) return { x, z }

  const centerX = (options.bodyCenterX ?? 0) * options.widthScale
  const centerZ = (options.bodyCenterZ ?? 0) * options.depthScale
  const halfWidth = options.bodyHalfWidth * options.widthScale
  const halfDepth = options.bodyHalfDepth * options.depthScale
  const radiusX = radius / options.bodyWidth * halfWidth * 2
  const radiusZ = radius / options.bodyDepth * halfDepth * 2
  const localX = x - centerX
  const localZ = z - centerZ
  const absX = Math.abs(localX)
  const absZ = Math.abs(localZ)
  const signX = Math.sign(localX) || 1
  const signZ = Math.sign(localZ) || 1
  let roundedX = localX
  let roundedZ = localZ

  if (options.surfaceFace === 'front' || options.surfaceFace === 'back') {
    if (absX > halfWidth - radiusX) {
      const t = Math.min(Math.max((absX - (halfWidth - radiusX)) / radiusX, 0), 1)
      const angle = Math.PI / 2 - t * Math.PI / 2
      roundedX = signX * (halfWidth - radiusX + radiusX * Math.cos(angle))
      roundedZ = signZ * (halfDepth - radiusZ + radiusZ * Math.sin(angle))
    }
  } else if (options.surfaceFace === 'left' || options.surfaceFace === 'right') {
    if (absZ > halfDepth - radiusZ) {
      roundedX = signX * halfWidth
      roundedZ = signZ * (halfDepth - radiusZ)
    }
  } else {
    const isFrontOrBack = absZ / halfDepth >= absX / halfWidth
    if (isFrontOrBack) {
      if (absX > halfWidth - radiusX) {
        const t = Math.min(Math.max((absX - (halfWidth - radiusX)) / radiusX, 0), 1)
        const angle = Math.PI / 2 - t * Math.PI / 4
        roundedX = signX * (halfWidth - radiusX + radiusX * Math.cos(angle))
        roundedZ = signZ * (halfDepth - radiusZ + radiusZ * Math.sin(angle))
      }
    } else if (absZ > halfDepth - radiusZ) {
        const t = Math.min(Math.max((absZ - (halfDepth - radiusZ)) / radiusZ, 0), 1)
        const angle = t * Math.PI / 4
        roundedX = signX * (halfWidth - radiusX + radiusX * Math.cos(angle))
        roundedZ = signZ * (halfDepth - radiusZ + radiusZ * Math.sin(angle))
    }
  }

  return {
    x: x + (centerX + roundedX - x) * weight,
    z: z + (centerZ + roundedZ - z) * weight,
  }
}

function horizontalWeight(y: number, options: HangingTissueDeformation) {
  if (y < options.bodyMinY) return 0
  if (y <= options.bodyMaxY) return 1
  if (y >= options.connectorMaxY) return 0
  return 1 - (y - options.bodyMaxY) /
    (options.connectorMaxY - options.bodyMaxY)
}

function mappedY(y: number, options: HangingTissueDeformation) {
  if (y < options.bodyMinY) return y
  const bodyHeight = options.bodyMaxY - options.bodyMinY
  const heightDelta = bodyHeight * (options.heightScale - 1)
  if (y <= options.bodyMaxY) {
    return options.bodyMinY + (y - options.bodyMinY) * options.heightScale
  }
  return y + heightDelta
}

export function deformHangingTissueGeometry(
  source: BufferGeometry,
  options: HangingTissueDeformation,
) {
  const result = source.clone()
  const positions = result.getAttribute('position') as BufferAttribute
  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index)
    const weight = horizontalWeight(y, options)
    const scaledX = positions.getX(index) * (1 + (options.widthScale - 1) * weight)
    const scaledZ = positions.getZ(index) * (1 + (options.depthScale - 1) * weight)
    const rounded = roundedCrossSection(scaledX, scaledZ, weight, options)
    positions.setX(index, rounded.x)
    positions.setY(index, mappedY(y, options))
    positions.setZ(index, rounded.z)
  }
  positions.needsUpdate = true
  result.computeVertexNormals()
  result.computeBoundingBox()
  result.computeBoundingSphere()
  return result
}
