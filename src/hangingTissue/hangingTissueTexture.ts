import { Float32BufferAttribute, Uint32BufferAttribute, type BufferGeometry } from 'three'

import type { ArtworkTransform, HangingTissueFace } from '../app/types'

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
}

const FACES = ['front', 'back', 'left', 'right'] as const
const MIN_SURFACE_ALIGNMENT = 0.5
const MODEL_UV_ROTATION: Record<HangingTissueFace, number> = {
  front: 0,
  back: 0,
  left: 0,
  right: 0,
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

function faceForNormal(x: number, z: number): HangingTissueFace {
  if (Math.abs(z) >= Math.abs(x)) return z >= 0 ? 'front' : 'back'
  return x >= 0 ? 'right' : 'left'
}

function collectFaceIndices(geometry: BufferGeometry) {
  const normal = geometry.getAttribute('normal')
  const index = geometry.getIndex()
  if (!normal) throw new Error('Hanging tissue model contains no normals or UVs')
  if (!index) throw new Error('Hanging tissue model contains no index')
  const result: Record<HangingTissueFace, number[]> = {
    front: [], back: [], left: [], right: [],
  }
  const remainder: number[] = []
  for (let offset = 0; offset < index.count; offset += 3) {
    const vertices = [0, 1, 2].map((corner) => index.getX(offset + corner))
    const normalX = vertices.reduce((sum, vertex) => sum + normal.getX(vertex), 0) / 3
    const normalZ = vertices.reduce((sum, vertex) => sum + normal.getZ(vertex), 0) / 3
    if (Math.max(Math.abs(normalX), Math.abs(normalZ)) < MIN_SURFACE_ALIGNMENT) {
      remainder.push(...vertices)
      continue
    }
    result[faceForNormal(normalX, normalZ)].push(...vertices)
  }
  return { faces: result, remainder }
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
    const position = result.getAttribute('position')
    const usedVertices = [...new Set(faceIndices[face])]
    const usesZForHorizontal = face === 'left' || face === 'right'
    const horizontal = usedVertices.map((vertex) => usesZForHorizontal ? position.getZ(vertex) : position.getX(vertex))
    const vertical = usedVertices.map((vertex) => position.getY(vertex))
    const minHorizontal = Math.min(...horizontal)
    const maxHorizontal = Math.max(...horizontal)
    const minVertical = Math.min(...vertical)
    const maxVertical = Math.max(...vertical)
    if (maxHorizontal <= minHorizontal || maxVertical <= minVertical) {
      throw new Error(`Hanging tissue ${face} surface cannot be planar-mapped`)
    }
    const projectedUv = new Float32Array(position.count * 2)
    usedVertices.forEach((vertex) => {
      const horizontalValue = usesZForHorizontal ? position.getZ(vertex) : position.getX(vertex)
      projectedUv[vertex * 2] = (horizontalValue - minHorizontal) / (maxHorizontal - minHorizontal)
      projectedUv[vertex * 2 + 1] = 1 - (position.getY(vertex) - minVertical) / (maxVertical - minVertical)
    })
    result.setAttribute('uv', new Float32BufferAttribute(projectedUv, 2))
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
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, size)

  FACES.forEach((face) => {
    const input = faces[face]
    if (!input) return
    const region = regions[face]
    const panelX = region.minU * size
    const panelY = region.minV * size
    const panelWidth = (region.maxU - region.minU) * size
    const panelHeight = (region.maxV - region.minV) * size
    const draw = calculateDrawSize(input.image, panelWidth, panelHeight, input.transform)

    context.save()
    context.beginPath()
    context.rect(panelX, panelY, panelWidth, panelHeight)
    context.clip()
    context.translate(
      panelX + panelWidth / 2 + input.transform.offsetX / 100 * panelWidth,
      panelY + panelHeight / 2 - input.transform.offsetY / 100 * panelHeight,
    )
    context.rotate(MODEL_UV_ROTATION[face] + input.transform.rotation * Math.PI / 180)
    context.drawImage(input.image, -draw.width / 2, -draw.height / 2, draw.width, draw.height)
    context.restore()
  })
}
