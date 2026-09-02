import { Vector3, type BufferGeometry } from 'three'

export interface WetTissueDimensions {
  width: number
  height: number
  thickness: number
}

export interface WetTissueDeformationOptions {
  sourceDimensions: WetTissueDimensions
  targetDimensions: WetTissueDimensions
}

export function deformWetTissueGeometry(
  source: BufferGeometry,
  options: WetTissueDeformationOptions,
) {
  const result = source.clone()
  const positions = result.getAttribute('position')
  const { sourceDimensions, targetDimensions } = options
  if (Object.values(sourceDimensions).some((value) => value <= 0) ||
    Object.values(targetDimensions).some((value) => value <= 0)) {
    result.dispose()
    throw new Error('Wet tissue dimensions must be positive')
  }

  result.computeBoundingBox()
  if (!result.boundingBox) {
    result.dispose()
    throw new Error('Wet tissue geometry has no bounds')
  }
  const center = result.boundingBox.getCenter(new Vector3())
  for (let index = 0; index < positions.count; index += 1) {
    positions.setX(index, center.x + (positions.getX(index) - center.x) * targetDimensions.width / sourceDimensions.width)
    positions.setY(index, center.y + (positions.getY(index) - center.y) * targetDimensions.height / sourceDimensions.height)
    positions.setZ(index, center.z + (positions.getZ(index) - center.z) * targetDimensions.thickness / sourceDimensions.thickness)
  }
  positions.needsUpdate = true
  result.computeVertexNormals()
  result.computeBoundingBox()
  result.computeBoundingSphere()
  return result
}

export function calculateWetTissueArtworkCompensation(
  reference: WetTissueDimensions,
  current: WetTissueDimensions,
  slot: 'body' | 'lid' = 'body',
) {
  return slot === 'lid'
    ? { x: reference.width / current.width, y: reference.thickness / current.thickness }
    : { x: reference.width / current.width, y: reference.height / current.height }
}
