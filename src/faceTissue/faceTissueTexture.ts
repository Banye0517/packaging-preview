import type { FaceTissueDimensions, FaceTissueState } from '../app/types'

export type FaceTissueArtworkPanel = 'bottom' | 'front' | 'back' | 'top'

export interface FaceTissueUvRegion {
  face: FaceTissueArtworkPanel
  minU: number
  maxU: number
  minV: number
  maxV: number
}

// These four regions are the authored body UV islands in 面纸.gltf. The model root rotates
// the asset, so the physical order is front, top, back, bottom. The side mesh is excluded.
export const FACE_TISSUE_UV_REGIONS: readonly FaceTissueUvRegion[] = [
  { face: 'front', minU: 0.1728069, maxU: 0.6047526, minV: 0.0564945, maxV: 0.2430997 },
  { face: 'top', minU: 0.1728069, maxU: 0.6047526, minV: 0.2409711, maxV: 0.5100324 },
  { face: 'back', minU: 0.1728069, maxU: 0.6047526, minV: 0.5084300, maxV: 0.6941437 },
  { face: 'bottom', minU: 0.1728069, maxU: 0.6047526, minV: 0.6934617, maxV: 0.9594612 },
]

const FACE_TISSUE_UV_BOUNDS = {
  minU: Math.min(...FACE_TISSUE_UV_REGIONS.map((region) => region.minU)),
  maxU: Math.max(...FACE_TISSUE_UV_REGIONS.map((region) => region.maxU)),
  minV: Math.min(...FACE_TISSUE_UV_REGIONS.map((region) => region.minV)),
  maxV: Math.max(...FACE_TISSUE_UV_REGIONS.map((region) => region.maxV)),
}

function getVerticalArtworkOffsets(
  imageY: number,
  imageHeight: number,
  atlasY: number,
  atlasHeight: number,
) {
  const imageCenterY = imageY + imageHeight / 2
  const atlasCenterY = atlasY + atlasHeight / 2
  const nearestPeriod = Math.round((atlasCenterY - imageCenterY) / atlasHeight)
  const candidatePeriods = [nearestPeriod - 1, nearestPeriod, nearestPeriod + 1]
  const visiblePeriods = candidatePeriods
    .filter((periodIndex, index, periods) => periods.indexOf(periodIndex) === index)
    .filter((periodIndex) => {
      const candidateY = imageY + periodIndex * atlasHeight
      return candidateY < atlasY + atlasHeight && candidateY + imageHeight > atlasY
    })
  const coveringPeriod = visiblePeriods.find((periodIndex) => {
    const candidateY = imageY + periodIndex * atlasHeight
    return candidateY <= atlasY && candidateY + imageHeight >= atlasY + atlasHeight
  })

  return coveringPeriod === undefined ? visiblePeriods : [coveringPeriod]
}

export function calculateFaceTissueArtworkScale(
  current: FaceTissueDimensions,
  reference: FaceTissueDimensions,
) {
  return Math.min(
    1,
    reference.width / current.width,
    reference.height / current.height,
    reference.thickness / current.thickness,
  )
}

export function drawFaceTissueAtlas(
  context: CanvasRenderingContext2D,
  size: number,
  image: HTMLImageElement,
  transform: FaceTissueState['artworkTransform'],
  current: FaceTissueDimensions,
  reference: FaceTissueDimensions,
) {
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, size)

  const atlasX = FACE_TISSUE_UV_BOUNDS.minU * size
  const atlasY = FACE_TISSUE_UV_BOUNDS.minV * size
  const atlasWidth = (FACE_TISSUE_UV_BOUNDS.maxU - FACE_TISSUE_UV_BOUNDS.minU) * size
  const atlasHeight = (FACE_TISSUE_UV_BOUNDS.maxV - FACE_TISSUE_UV_BOUNDS.minV) * size
  const artworkScale = calculateFaceTissueArtworkScale(current, reference)
  const imageAspectRatio = image.width / image.height
  const containedWidth = Math.min(atlasWidth, atlasHeight * imageAspectRatio)
  const containedHeight = Math.min(atlasHeight, atlasWidth / imageAspectRatio)
  const scaleX = artworkScale * transform.scale / 100 * transform.stretchX / 100
  const scaleY = artworkScale * transform.scale / 100 * transform.stretchY / 100
  const imageX = atlasX + transform.offsetX / 100 * atlasWidth
  const imageY = atlasY - transform.offsetY / 100 * atlasHeight
  const imageHeight = containedHeight * scaleY
  const verticalOffsets = getVerticalArtworkOffsets(imageY, imageHeight, atlasY, atlasHeight)

  context.save()
  context.beginPath()
  context.rect(atlasX, atlasY, atlasWidth, atlasHeight)
  context.clip()
  verticalOffsets.forEach((verticalOffset) => {
    context.save()
    context.translate(imageX, imageY + verticalOffset * atlasHeight)
    context.scale(scaleX, scaleY)
    context.rotate(transform.rotation * Math.PI / 180)
    context.drawImage(image, 0, 0, containedWidth, containedHeight)
    context.restore()
  })
  context.restore()
}
