import { Uint32BufferAttribute, type BufferGeometry } from 'three'

import type {
  ArtworkTransform,
  HangingTissueDimensions,
  HangingTissueFace,
} from '../app/types'

export interface UvRegion {
  minU: number
  maxU: number
  minV: number
  maxV: number
}

export type HangingTissueUvRegions = Record<HangingTissueFace, UvRegion>

interface AtlasFaceInput {
  image: HTMLImageElement
  transform: ArtworkTransform
  currentDimensions?: HangingTissueDimensions
  referenceDimensions?: HangingTissueDimensions
}

const FACES = ['front', 'back', 'left', 'right'] as const
const ATLAS_DRAW_ORDER = ['left', 'right', 'back', 'front'] as const
const AUTHORED_UV_ISLANDS = [
  { minU: 0, maxU: 0.31 },
  { minU: 0.31, maxU: 0.5 },
  { minU: 0.5, maxU: 0.8 },
  { minU: 0.8, maxU: 1.01 },
] as const
const MODEL_UV_ROTATION: Record<HangingTissueFace, number> = {
  front: 0,
  back: 0,
  left: 0,
  right: 0,
}

export function calculateArtworkDimensionCompensation(
  face: HangingTissueFace,
  current: HangingTissueDimensions,
  reference: HangingTissueDimensions,
) {
  return {
    x: (face === 'front' || face === 'back' ? reference.width / current.width : reference.depth / current.depth),
    y: reference.height / current.height,
  }
}

function createEmptyRegion(): UvRegion {
  return { minU: Infinity, maxU: -Infinity, minV: Infinity, maxV: -Infinity }
}

function includeUv(region: UvRegion, u: number, v: number) {
  region.minU = Math.min(region.minU, u)
  region.maxU = Math.max(region.maxU, u)
  region.minV = Math.min(region.minV, v)
  region.maxV = Math.max(region.maxV, v)
}

function validateRegion(region: UvRegion) {
  return Number.isFinite(region.minU) && Number.isFinite(region.maxU) &&
    Number.isFinite(region.minV) && Number.isFinite(region.maxV) &&
    region.minU >= -0.01 && region.maxU <= 1.01 && region.minV >= -0.01 && region.maxV <= 1.01 &&
    region.maxU > region.minU && region.maxV > region.minV
}

function faceForIslandPosition(x: number, z: number): HangingTissueFace {
  if (Math.abs(z) >= Math.abs(x)) return z >= 0 ? 'front' : 'back'
  return x >= 0 ? 'right' : 'left'
}

function collectFaceIndices(geometry: BufferGeometry) {
  const position = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  const index = geometry.getIndex()
  if (!position) throw new Error('Hanging tissue model contains no positions')
  if (!uv) throw new Error('Hanging tissue model contains no UVs')
  if (!index) throw new Error('Hanging tissue model contains no index')
  const islands = AUTHORED_UV_ISLANDS.map(() => ({ indices: [] as number[], x: 0, z: 0, count: 0 }))
  const remainder: number[] = []
  for (let offset = 0; offset < index.count; offset += 3) {
    const vertices = [0, 1, 2].map((corner) => index.getX(offset + corner))
    const centerU = vertices.reduce((sum, vertex) => sum + uv.getX(vertex), 0) / 3
    const islandIndex = AUTHORED_UV_ISLANDS.findIndex(
      ({ minU, maxU }) => centerU >= minU && centerU < maxU,
    )
    if (islandIndex < 0) {
      remainder.push(...vertices)
      continue
    }
    const island = islands[islandIndex]
    island.indices.push(...vertices)
    island.x += vertices.reduce((sum, vertex) => sum + position.getX(vertex), 0) / 3
    island.z += vertices.reduce((sum, vertex) => sum + position.getZ(vertex), 0) / 3
    island.count += 1
  }
  const faces: Record<HangingTissueFace, number[]> = {
    front: [], back: [], left: [], right: [],
  }
  islands.forEach((island) => {
    if (island.count === 0) return
    const face = faceForIslandPosition(island.x / island.count, island.z / island.count)
    if (faces[face].length > 0) {
      throw new Error(`Hanging tissue UV islands resolve to duplicate ${face} faces`)
    }
    faces[face] = island.indices
  })
  return { faces, remainder }
}

export function extractHangingTissueFaceGeometrySet(geometry: BufferGeometry) {
  if (!geometry.getAttribute('position')) {
    throw new Error('Hanging tissue model contains no positions')
  }
  const { faces: faceIndices, remainder } = collectFaceIndices(geometry)
  const faces = Object.fromEntries(FACES.map((face) => {
    if (faceIndices[face].length === 0) {
      throw new Error(`Hanging tissue model contains no ${face} surface`)
    }
    const result = geometry.clone()
    result.setIndex(new Uint32BufferAttribute(faceIndices[face], 1))
    return [face, result]
  })) as Record<HangingTissueFace, BufferGeometry>
  const remainderGeometry = geometry.clone()
  remainderGeometry.setIndex(new Uint32BufferAttribute(remainder, 1))
  return { faces, remainder: remainderGeometry }
}

export function extractHangingTissueFaceGeometries(geometry: BufferGeometry) {
  return extractHangingTissueFaceGeometrySet(geometry).faces
}

export function extractHangingTissueUvRegions(
  geometry: BufferGeometry,
): HangingTissueUvRegions {
  const position = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  if (!position) throw new Error('Hanging tissue model contains no positions')
  if (!uv) throw new Error('Hanging tissue model contains no normals or UVs')

  const regions = Object.fromEntries(
    FACES.map((face) => [face, createEmptyRegion()]),
  ) as HangingTissueUvRegions

  const { faces: faceIndices } = collectFaceIndices(geometry)
  FACES.forEach((face) => faceIndices[face].forEach((vertex) =>
    includeUv(regions[face], uv.getX(vertex), uv.getY(vertex)),
  ))

  if (!FACES.every((face) => validateRegion(regions[face]))) {
    throw new Error('Hanging tissue four-face UV regions could not be resolved')
  }
  return regions
}

function calculateDrawSize(
  image: HTMLImageElement,
  panelWidth: number,
  panelHeight: number,
  transform: ArtworkTransform,
) {
  const scale = Math.max(panelWidth / image.width, panelHeight / image.height) * transform.scale / 100
  return {
    width: image.width * scale * transform.stretchX / 100,
    height: image.height * scale * transform.stretchY / 100,
  }
}

export function drawHangingTissueAtlas(
  context: CanvasRenderingContext2D,
  size: number,
  faces: Partial<Record<HangingTissueFace, AtlasFaceInput>>,
  regions: HangingTissueUvRegions,
) {
  context.clearRect(0, 0, size, size)

  ATLAS_DRAW_ORDER.forEach((face) => {
    const input = faces[face]
    if (!input) return
    const region = regions[face]
    const panelX = region.minU * size
    const panelY = region.minV * size
    const panelWidth = (region.maxU - region.minU) * size
    const panelHeight = (region.maxV - region.minV) * size
    const draw = calculateDrawSize(input.image, panelWidth, panelHeight, input.transform)
    const compensation = input.currentDimensions && input.referenceDimensions
      ? calculateArtworkDimensionCompensation(face, input.currentDimensions, input.referenceDimensions)
      : { x: 1, y: 1 }

    context.save()
    context.beginPath()
    context.rect(panelX, panelY, panelWidth, panelHeight)
    context.clip()
    context.translate(
      panelX + panelWidth / 2 + input.transform.offsetX / 100 * panelWidth,
      panelY + panelHeight / 2 - input.transform.offsetY / 100 * panelHeight,
    )
    context.scale(compensation.x, compensation.y)
    context.rotate(MODEL_UV_ROTATION[face] + input.transform.rotation * Math.PI / 180)
    context.drawImage(input.image, -draw.width / 2, -draw.height / 2, draw.width, draw.height)
    context.restore()
  })
}
