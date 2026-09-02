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
}

interface VerticalBounds {
  minY: number
  maxY: number
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
