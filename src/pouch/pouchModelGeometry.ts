import { BufferGeometry, Float32BufferAttribute, type BufferAttribute } from 'three'

export type PouchDepthAxis = 'x' | 'y' | 'z'

interface PouchModelParts {
  front: BufferGeometry
  back: BufferGeometry
  structure: BufferGeometry
}

interface FittedPouchDimensions {
  width: number
  height: number
  thickness: number
  gussetDepth: number
}

export function fitPouchGeometry(
  geometry: BufferGeometry,
  dimensions: FittedPouchDimensions,
) {
  const fitted = geometry.clone()
  fitted.computeBoundingBox()
  const bounds = fitted.boundingBox!
  const centerX = (bounds.min.x + bounds.max.x) / 2
  const centerY = (bounds.min.y + bounds.max.y) / 2
  const centerZ = (bounds.min.z + bounds.max.z) / 2
  const sourceWidth = bounds.max.x - bounds.min.x
  const sourceHeight = bounds.max.y - bounds.min.y
  const heightScale = dimensions.height / sourceHeight
  const positions = fitted.getAttribute('position')

  for (let index = 0; index < positions.count; index += 1) {
    positions.setXYZ(
      index,
      (positions.getX(index) - centerX) * dimensions.width / sourceWidth,
      (positions.getY(index) - centerY) * heightScale,
      (positions.getZ(index) - centerZ) * heightScale,
    )
  }
  positions.needsUpdate = true
  fitted.computeVertexNormals()
  fitted.computeBoundingBox()
  fitted.computeBoundingSphere()
  return fitted
}

function axisOffset(axis: PouchDepthAxis) {
  if (axis === 'x') return 0
  if (axis === 'y') return 1
  return 2
}

function createTriangleSubset(source: BufferGeometry, triangleIndices: number[]) {
  const geometry = new BufferGeometry()
  for (const attributeName of ['position', 'normal', 'uv'] as const) {
    const sourceAttribute = source.getAttribute(attributeName) as BufferAttribute | undefined
    if (!sourceAttribute) continue
    const values: number[] = []
    for (const triangleIndex of triangleIndices) {
      const firstVertex = triangleIndex * 3
      for (let vertex = firstVertex; vertex < firstVertex + 3; vertex += 1) {
        for (let component = 0; component < sourceAttribute.itemSize; component += 1) {
          values.push(sourceAttribute.array[vertex * sourceAttribute.itemSize + component])
        }
      }
    }
    geometry.setAttribute(
      attributeName,
      new Float32BufferAttribute(values, sourceAttribute.itemSize),
    )
  }
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

function rebuildArtworkUvs(
  geometry: BufferGeometry,
  depthAxis: PouchDepthAxis,
  mirrorX: boolean,
) {
  geometry.computeBoundingBox()
  const bounds = geometry.boundingBox!
  const positions = geometry.getAttribute('position')
  const horizontalAxis = depthAxis === 'x' ? 'z' : 'x'
  const verticalAxis = depthAxis === 'y' ? 'z' : 'y'
  const read = (index: number, axis: 'x' | 'y' | 'z') => {
    if (axis === 'x') return positions.getX(index)
    if (axis === 'y') return positions.getY(index)
    return positions.getZ(index)
  }
  const horizontalMin = bounds.min[horizontalAxis]
  const horizontalSize = bounds.max[horizontalAxis] - horizontalMin
  const verticalMin = bounds.min[verticalAxis]
  const verticalSize = bounds.max[verticalAxis] - verticalMin
  const values: number[] = []
  for (let index = 0; index < positions.count; index += 1) {
    const normalizedX = (read(index, horizontalAxis) - horizontalMin) / horizontalSize
    const normalizedY = (read(index, verticalAxis) - verticalMin) / verticalSize
    values.push(mirrorX ? 1 - normalizedX : normalizedX, normalizedY)
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(values, 2))
}

export function partitionPouchGeometry(
  geometry: BufferGeometry,
  depthAxis: PouchDepthAxis = 'y',
): PouchModelParts {
  const source = geometry.index ? geometry.toNonIndexed() : geometry.clone()
  const normals = source.getAttribute('normal')
  const normalComponent = axisOffset(depthAxis)
  const groups = {
    front: [] as number[],
    back: [] as number[],
    structure: [] as number[],
  }
  const triangleCount = source.getAttribute('position').count / 3

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    let facing = 0
    for (let vertex = 0; vertex < 3; vertex += 1) {
      const index = triangle * 3 + vertex
      if (normalComponent === 0) facing += normals.getX(index)
      if (normalComponent === 1) facing += normals.getY(index)
      if (normalComponent === 2) facing += normals.getZ(index)
    }
    facing /= 3
    if (facing > 0.68) groups.front.push(triangle)
    else if (facing < -0.68) groups.back.push(triangle)
    else groups.structure.push(triangle)
  }

  const result = {
    front: createTriangleSubset(source, groups.front),
    back: createTriangleSubset(source, groups.back),
    structure: createTriangleSubset(source, groups.structure),
  }
  rebuildArtworkUvs(result.front, depthAxis, false)
  rebuildArtworkUvs(result.back, depthAxis, true)
  source.dispose()
  return result
}
