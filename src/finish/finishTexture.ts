import {
  CanvasTexture,
  ClampToEdgeWrapping,
  DataTexture,
  NoColorSpace,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  UnsignedByteType,
} from 'three'

import type { FinishMaskTransform } from './finishTypes'
import type { FinishKind } from './finishTypes'

const STATIC_FINISH_TRANSFORM: FinishMaskTransform = {
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
}

export function configureFinishMaskTexture(
  texture: Texture,
  transform: FinishMaskTransform,
) {
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.center.set(0.5, 0.5)
  const repeat = 100 / transform.scale
  texture.repeat.set(repeat, repeat)
  texture.offset.set(transform.offsetX / 100, transform.offsetY / 100)
  texture.rotation = transform.rotation * Math.PI / 180
  texture.colorSpace = NoColorSpace
  texture.needsUpdate = true
}

export function loadInvertedFinishMask(
  source: string,
  transform: FinishMaskTransform,
  onLoad: (texture: Texture) => void,
) {
  return new TextureLoader().load(source, (sourceTexture) => {
    const image = sourceTexture.image as CanvasImageSource & { width: number; height: number }
    const canvas = document.createElement('canvas')
    canvas.width = image.width + 2
    canvas.height = image.height + 2
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(image, 1, 1)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    const coverageMap = buildFinishMaskCoverage(pixels.data, canvas.width, canvas.height)
    for (let index = 0; index < pixels.data.length; index += 4) {
      const coverage = coverageMap[index / 4]
      const channel = Math.round(coverage * 255)
      pixels.data[index] = channel
      pixels.data[index + 1] = channel
      pixels.data[index + 2] = channel
      pixels.data[index + 3] = 255
    }
    context.putImageData(pixels, 0, 0)
    const mask = new CanvasTexture(canvas)
    configureFinishMaskTexture(mask, transform)
    sourceTexture.dispose()
    onLoad(mask)
  })
}

export function getFinishMaskCoverage(red: number, green: number, blue: number, alpha: number) {
  if (alpha === 0) return 0
  const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
  const shapeCoverage = luminance <= 220 ? 1 : luminance >= 250 ? 0 : (250 - luminance) / 30
  return shapeCoverage * alpha / 255
}

export function buildFinishMaskCoverage(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const pixelCount = width * height
  const background = new Uint8Array(pixelCount)
  const outside = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  let head = 0
  let tail = 0

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4
    const alpha = pixels[offset + 3]
    const luminance = pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722
    background[pixel] = alpha < 8 || luminance >= 245 ? 1 : 0
  }

  const enqueue = (pixel: number) => {
    if (!background[pixel] || outside[pixel]) return
    outside[pixel] = 1
    queue[tail] = pixel
    tail += 1
  }
  for (let x = 0; x < width; x += 1) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  while (head < tail) {
    const pixel = queue[head]
    head += 1
    const x = pixel % width
    const y = Math.floor(pixel / width)
    if (x > 0) enqueue(pixel - 1)
    if (x + 1 < width) enqueue(pixel + 1)
    if (y > 0) enqueue(pixel - width)
    if (y + 1 < height) enqueue(pixel + width)
  }

  return Float32Array.from(outside, (value) => value ? 0 : 1)
}

export const HOLOGRAPHIC_GRADIENT_STOPS = [
  { offset: 0, color: '#6f3fc2' },
  { offset: 0.34, color: '#86afea' },
  { offset: 0.62, color: '#d5efef' },
  { offset: 1, color: '#79b88c' },
] as const

export function getHolographicGradientStops() {
  return HOLOGRAPHIC_GRADIENT_STOPS
}

export function createHolographicFilmTexture() {
  const size = 256
  const data = new Uint8Array(size * size * 4)
  const stops = HOLOGRAPHIC_GRADIENT_STOPS.map((stop) => ({ ...stop, rgb: hexToRgb(stop.color) }))
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = getHolographicGradientPosition(x, y, size)
      const upperIndex = Math.max(1, stops.findIndex((stop) => stop.offset >= t))
      const lower = stops[upperIndex - 1]
      const upper = stops[upperIndex] ?? stops[stops.length - 1]
      const mix = upper.offset === lower.offset ? 0 : (t - lower.offset) / (upper.offset - lower.offset)
      const dx = (x - size * 0.53) / size
      const dy = (y - size * 0.45) / size
      const sheen = Math.max(0, 1 - Math.hypot(dx, dy) / 0.58) * 0.34
      const offset = (y * size + x) * 4
      for (let channel = 0; channel < 3; channel += 1) {
        const spectrum = lower.rgb[channel] + (upper.rgb[channel] - lower.rgb[channel]) * mix
        data[offset + channel] = Math.round(spectrum + (255 - spectrum) * sheen)
      }
      data[offset + 3] = 255
    }
  }

  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType)
  configureFinishMaskTexture(texture, STATIC_FINISH_TRANSFORM)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export function createMetalFilmTexture(kind: Extract<FinishKind, 'gold-foil' | 'silver-foil'>) {
  const size = 256
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const position = x / (size - 1)
      const broadHighlight = Math.exp(-Math.pow((position - 0.36) / 0.15, 2))
      const sharpHighlight = Math.exp(-Math.pow((position - 0.68) / 0.045, 2))
      const edgeShade = Math.min(position, 1 - position) * 2
      const verticalGrain = Math.sin(y * 0.42) * 0.018
      const sheen = Math.max(0, Math.min(1,
        0.12 + edgeShade * 0.24 + broadHighlight * 0.52 + sharpHighlight * 0.32 + verticalGrain,
      ))
      const base = kind === 'gold-foil' ? [168, 98, 10] : [132, 143, 158]
      const highlight = kind === 'gold-foil' ? [255, 239, 151] : [255, 255, 255]
      const offset = (y * size + x) * 4
      data[offset] = Math.round(base[0] + (highlight[0] - base[0]) * sheen)
      data[offset + 1] = Math.round(base[1] + (highlight[1] - base[1]) * sheen)
      data[offset + 2] = Math.round(base[2] + (highlight[2] - base[2]) * sheen)
      data[offset + 3] = 255
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType)
  configureFinishMaskTexture(texture, STATIC_FINISH_TRANSFORM)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export function getHolographicGradientPosition(x: number, _y: number, size: number) {
  return x / (size - 1)
}

function hexToRgb(color: string): [number, number, number] {
  return [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16)) as [number, number, number]
}
