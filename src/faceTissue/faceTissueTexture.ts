import type { FaceTissueDimensions, FaceTissueState } from '../app/types'

export type FaceTissueArtworkPanel = 'bottom' | 'front' | 'back' | 'top'

export interface FaceTissueUvRegion {
  face: FaceTissueArtworkPanel
  minU: number
  maxU: number
  minV: number
  maxV: number
}

// These four regions are the authored body UV islands in 面纸.gltf. The side mesh is excluded.
export const FACE_TISSUE_UV_REGIONS: readonly FaceTissueUvRegion[] = [
  { face: 'bottom', minU: 0.1728069, maxU: 0.6047526, minV: 0.0564945, maxV: 0.2430997 },
  { face: 'front', minU: 0.1728069, maxU: 0.6047526, minV: 0.2409711, maxV: 0.5100324 },
  { face: 'back', minU: 0.1728069, maxU: 0.6047526, minV: 0.5084300, maxV: 0.6941437 },
  { face: 'top', minU: 0.1728069, maxU: 0.6047526, minV: 0.6934617, maxV: 0.9594612 },
]

export function calculateFaceTissueArtworkCompensation(
  face: FaceTissueArtworkPanel,
  current: FaceTissueDimensions,
  reference: FaceTissueDimensions,
) {
  return {
    x: reference.width / current.width,
    y: (face === 'front' || face === 'back')
      ? reference.height / current.height
      : reference.thickness / current.thickness,
  }
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
  FACE_TISSUE_UV_REGIONS.forEach((region) => {
    const targetX = region.minU * size
    const targetY = region.minV * size
    const targetWidth = (region.maxU - region.minU) * size
    const targetHeight = (region.maxV - region.minV) * size
    const sourceX = region.minU * image.width
    const sourceY = region.minV * image.height
    const sourceWidth = (region.maxU - region.minU) * image.width
    const sourceHeight = (region.maxV - region.minV) * image.height
    const compensation = calculateFaceTissueArtworkCompensation(region.face, current, reference)

    context.save()
    context.beginPath()
    context.rect(targetX, targetY, targetWidth, targetHeight)
    context.clip()
    context.translate(
      targetX + targetWidth / 2 + transform.offsetX / 100 * targetWidth,
      targetY + targetHeight / 2 - transform.offsetY / 100 * targetHeight,
    )
    context.scale(
      compensation.x * transform.scale / 100 * transform.stretchX / 100,
      compensation.y * transform.scale / 100 * transform.stretchY / 100,
    )
    context.rotate(transform.rotation * Math.PI / 180)
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight)
    context.restore()
  })
}
