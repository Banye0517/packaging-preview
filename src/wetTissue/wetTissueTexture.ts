import type { ArtworkTransform, WetTissueDimensions, WetTissueArtworkSlot } from '../app/types'
import { calculateWetTissueArtworkCompensation } from './wetTissueDeformation'

export function drawWetTissueAtlas(
  context: CanvasRenderingContext2D,
  size: number,
  image: HTMLImageElement,
  transform: ArtworkTransform,
  current: WetTissueDimensions,
  reference: WetTissueDimensions,
  slot: WetTissueArtworkSlot,
) {
  context.clearRect(0, 0, size, size)
  const compensation = calculateWetTissueArtworkCompensation(reference, current, slot)
  context.save()
  context.translate(
    size / 2 + transform.offsetX / 100 * size,
    size / 2 - transform.offsetY / 100 * size,
  )
  context.scale(
    compensation.x * transform.scale / 100 * transform.stretchX / 100,
    compensation.y * transform.scale / 100 * transform.stretchY / 100,
  )
  context.rotate(transform.rotation * Math.PI / 180)
  context.drawImage(image, -size / 2, -size / 2, size, size)
  context.restore()
}
