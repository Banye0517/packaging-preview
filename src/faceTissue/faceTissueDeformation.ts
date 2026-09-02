import { type BufferGeometry } from 'three'

export interface FaceTissueSourceBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

export interface FaceTissueDeformationOptions {
  sourceBounds: FaceTissueSourceBounds
  width: number
  height: number
  thickness: number
  radius: number
}

interface VerticalBounds {
  minY: number
  maxY: number
}

function getRoundedCoordinate(value: number, center: number, halfExtent: number, radius: number) {
  const distance = Math.abs(value - center)
  const innerExtent = Math.max(0, halfExtent - radius)
  return {
    sign: value < center ? -1 : 1,
    outsideInner: Math.max(0, distance - innerExtent),
  }
}

function applyCornerRadius(
  positions: BufferGeometry['attributes']['position'],
  bounds: FaceTissueSourceBounds,
  width: number,
  height: number,
  thickness: number,
  radius: number,
) {
  if (radius <= 0) return
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = bounds.minY + height / 2
  const centerZ = (bounds.minZ + bounds.maxZ) / 2
  const halfWidth = width / 2
  const halfHeight = height / 2
  const halfThickness = thickness / 2
  const safeRadius = Math.min(radius, halfWidth, halfHeight, halfThickness)

  for (let index = 0; index < positions.count; index += 1) {
    const x = getRoundedCoordinate(positions.getX(index), centerX, halfWidth, safeRadius)
    const y = getRoundedCoordinate(positions.getY(index), centerY, halfHeight, safeRadius)
    const z = getRoundedCoordinate(positions.getZ(index), centerZ, halfThickness, safeRadius)
    const distance = Math.hypot(x.outsideInner, y.outsideInner, z.outsideInner)
    if (distance <= safeRadius || distance === 0) continue
    const factor = safeRadius / distance
    positions.setX(index, centerX + x.sign * (halfWidth - safeRadius + x.outsideInner * factor))
    positions.setY(index, centerY + y.sign * (halfHeight - safeRadius + y.outsideInner * factor))
    positions.setZ(index, centerZ + z.sign * (halfThickness - safeRadius + z.outsideInner * factor))
  }
}

export function deformFaceTissueGeometry(
  source: BufferGeometry,
  options: FaceTissueDeformationOptions,
) {
  const result = source.clone()
  const positions = result.getAttribute('position')
  const { sourceBounds } = options
  const sourceWidth = sourceBounds.maxX - sourceBounds.minX
  const sourceHeight = sourceBounds.maxY - sourceBounds.minY
  const sourceThickness = sourceBounds.maxZ - sourceBounds.minZ
  if (sourceWidth <= 0 || sourceHeight <= 0 || sourceThickness <= 0) {
    result.dispose()
    throw new Error('Face tissue source bounds are invalid')
  }

  const sourceCenterX = (sourceBounds.minX + sourceBounds.maxX) / 2
  const sourceCenterZ = (sourceBounds.minZ + sourceBounds.maxZ) / 2
  for (let index = 0; index < positions.count; index += 1) {
    positions.setX(
      index,
      sourceCenterX +
        (positions.getX(index) - sourceCenterX) * options.width / sourceWidth,
    )
    positions.setY(
      index,
      sourceBounds.minY +
        (positions.getY(index) - sourceBounds.minY) * options.height / sourceHeight,
    )
    positions.setZ(
      index,
      sourceCenterZ +
        (positions.getZ(index) - sourceCenterZ) * options.thickness / sourceThickness,
    )
  }
  applyCornerRadius(
    positions,
    sourceBounds,
    options.width,
    options.height,
    options.thickness,
    options.radius,
  )
  positions.needsUpdate = true
  result.computeVertexNormals()
  result.computeBoundingBox()
  result.computeBoundingSphere()
  return result
}

export function calculateTopSheetAnchor(
  sourceBody: VerticalBounds,
  targetBody: VerticalBounds,
) {
  return { y: targetBody.maxY - sourceBody.maxY }
}
