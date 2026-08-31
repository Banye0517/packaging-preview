import type { ArtworkTransform, PouchFace } from '../app/types'
import type { BufferGeometry } from 'three'

export interface UvRegion {
  minU: number
  maxU: number
  minV: number
  maxV: number
}

export interface InnerPackaging2UvRegions {
  front: UvRegion
  back: UvRegion
}

interface AtlasFaceInput {
  image: HTMLImageElement
  transform: ArtworkTransform
}

const MODEL_UV_ROTATION: Record<PouchFace, number> = {
  front: Math.PI,
  back: Math.PI,
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
  return Number.isFinite(region.minU) && Number.isFinite(region.minV) &&
    region.minU >= 0 && region.maxU <= 1 && region.minV >= 0 && region.maxV <= 1 &&
    region.maxU > region.minU && region.maxV > region.minV
}

export function extractInnerPackaging2UvRegions(
  geometry: BufferGeometry,
): InnerPackaging2UvRegions {
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const uv = geometry.getAttribute('uv')
  const index = geometry.getIndex()
  if (!position) throw new Error('Inner packaging 2 model contains no positions')
  if (!normal || !uv) throw new Error('Inner packaging 2 model contains no normals or UVs')
  if (!index) throw new Error('Inner packaging 2 model contains no index')

  const positive = createEmptyRegion()
  const negative = createEmptyRegion()
  const indexCount = index.count

  for (let offset = 0; offset < indexCount; offset += 3) {
    const indices = [0, 1, 2].map((corner) => index.getX(offset + corner))
    const normalZ = indices.reduce((sum, vertex) => sum + normal.getZ(vertex), 0) / 3
    if (Math.abs(normalZ) < 0.05) continue
    const region = normalZ > 0 ? positive : negative
    indices.forEach((vertex) => includeUv(region, uv.getX(vertex), uv.getY(vertex)))
  }

  if (!validateRegion(positive) || !validateRegion(negative)) {
    throw new Error('Inner packaging 2 front/back UV regions could not be resolved')
  }

  const positiveCenter = (positive.minU + positive.maxU) / 2
  const negativeCenter = (negative.minU + negative.maxU) / 2
  return positiveCenter < negativeCenter
    ? { front: positive, back: negative }
    : { front: negative, back: positive }
}

export function calculateInnerPackaging2DrawSize(
  imageWidth: number,
  imageHeight: number,
  panelWidth: number,
  panelHeight: number,
  scalePercent: number,
) {
  const fitScale = Math.max(panelWidth / imageWidth, panelHeight / imageHeight)
  const scale = fitScale * scalePercent / 100
  return { width: imageWidth * scale, height: imageHeight * scale }
}

export function drawInnerPackaging2Atlas(
  context: CanvasRenderingContext2D,
  size: number,
  faces: Partial<Record<PouchFace, AtlasFaceInput>>,
  regions: InnerPackaging2UvRegions,
) {
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, size)

  ;(['front', 'back'] as const).forEach((face) => {
    const input = faces[face]
    if (!input) return
    const region = regions[face]
    const panelX = region.minU * size
    const panelY = region.minV * size
    const panelWidth = (region.maxU - region.minU) * size
    const panelHeight = (region.maxV - region.minV) * size
    const { width, height } = calculateInnerPackaging2DrawSize(
      input.image.width,
      input.image.height,
      panelWidth,
      panelHeight,
      input.transform.scale,
    )
    const drawWidth = width * input.transform.stretchX / 100
    const drawHeight = height * input.transform.stretchY / 100
    context.save()
    context.beginPath()
    context.rect(panelX, panelY, panelWidth, panelHeight)
    context.clip()
    context.translate(
      panelX + panelWidth / 2 + input.transform.offsetX / 100 * panelWidth,
      panelY + panelHeight / 2 - input.transform.offsetY / 100 * panelHeight,
    )
    context.rotate(MODEL_UV_ROTATION[face] + input.transform.rotation * Math.PI / 180)
    context.drawImage(input.image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
    context.restore()
  })
}
