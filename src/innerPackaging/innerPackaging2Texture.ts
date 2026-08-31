import type { ArtworkTransform, PouchFace } from '../app/types'

interface AtlasFaceInput {
  image: HTMLImageElement
  transform: ArtworkTransform
}

export function calculateInnerPackaging2DrawSize(
  imageWidth: number,
  imageHeight: number,
  panelWidth: number,
  panelHeight: number,
  scalePercent: number,
) {
  const fitScale = Math.min(panelWidth / imageWidth, panelHeight / imageHeight)
  const scale = fitScale * scalePercent / 100
  return { width: imageWidth * scale, height: imageHeight * scale }
}

export function drawInnerPackaging2Atlas(
  context: CanvasRenderingContext2D,
  size: number,
  faces: Partial<Record<PouchFace, AtlasFaceInput>>,
) {
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, size)
  const panelWidth = size / 2

  ;(['front', 'back'] as const).forEach((face, index) => {
    const input = faces[face]
    if (!input) return
    const panelX = index * panelWidth
    const { width, height } = calculateInnerPackaging2DrawSize(
      input.image.width,
      input.image.height,
      panelWidth,
      size,
      input.transform.scale,
    )
    context.save()
    context.beginPath()
    context.rect(panelX, 0, panelWidth, size)
    context.clip()
    context.translate(
      panelX + panelWidth / 2 + input.transform.offsetX / 100 * panelWidth,
      size / 2 - input.transform.offsetY / 100 * size,
    )
    context.rotate(Math.PI + input.transform.rotation * Math.PI / 180)
    context.drawImage(input.image, -width / 2, -height / 2, width, height)
    context.restore()
  })
}
