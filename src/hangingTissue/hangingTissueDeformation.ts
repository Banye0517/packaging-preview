import { BufferAttribute, type BufferGeometry } from 'three'

export interface HangingTissueDeformation {
  bodyMinY: number
  bodyMaxY: number
  connectorMaxY: number
  widthScale: number
  heightScale: number
  depthScale: number
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
    positions.setX(index, positions.getX(index) * (1 + (options.widthScale - 1) * weight))
    positions.setY(index, mappedY(y, options))
    positions.setZ(index, positions.getZ(index) * (1 + (options.depthScale - 1) * weight))
  }
  positions.needsUpdate = true
  result.computeVertexNormals()
  result.computeBoundingBox()
  result.computeBoundingSphere()
  return result
}
