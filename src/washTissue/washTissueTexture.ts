import type { FaceTissueDimensions, FaceTissueState } from '../app/types'

export function drawWashTissueAtlas(
  context: CanvasRenderingContext2D,
  size: number,
  image: HTMLImageElement,
  transform: FaceTissueState['artworkTransform'],
  current: FaceTissueDimensions,
  reference: FaceTissueDimensions,
) {
  const height = Math.round(size * image.height / image.width)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, height)
  context.save()
  context.translate(
    size / 2 + transform.offsetX / 100 * size,
    height / 2 - transform.offsetY / 100 * height,
  )
  context.scale(
    reference.width / current.width * transform.scale / 100 * transform.stretchX / 100,
    reference.height / current.height * transform.scale / 100 * transform.stretchY / 100,
  )
  context.rotate(transform.rotation * Math.PI / 180)
  context.drawImage(image, -size / 2, -height / 2, size, height)
  context.restore()
}
