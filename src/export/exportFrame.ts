import { Matrix4, type PerspectiveCamera } from 'three'

export type ExportPresetId =
  | 'square-standard'
  | 'square-hd'
  | 'landscape-2k'
  | 'portrait-2k'

export type ExportRatio = '1:1' | '16:9' | '9:16'

export interface ExportPreset {
  id: ExportPresetId
  ratio: ExportRatio
  width: number
  height: number
}

export interface ExportFrameRect {
  left: number
  top: number
  width: number
  height: number
}

export interface PreviewStageLayout {
  frame: ExportFrameRect
  primaryToolbar: ExportFrameRect
  cameraToolbar: ExportFrameRect
  placement: 'horizontal-rails' | 'portrait-side-rail' | 'mobile-stacked'
}

export const EXPORT_PRESETS: readonly ExportPreset[] = [
  { id: 'square-standard', ratio: '1:1', width: 800, height: 800 },
  { id: 'square-hd', ratio: '1:1', width: 3000, height: 3000 },
  { id: 'landscape-2k', ratio: '16:9', width: 2560, height: 1440 },
  { id: 'portrait-2k', ratio: '9:16', width: 1440, height: 2560 },
]

export const DEFAULT_EXPORT_PRESET_ID: ExportPresetId = 'square-standard'

export function getExportPreset(id: ExportPresetId) {
  return EXPORT_PRESETS.find((preset) => preset.id === id) ?? EXPORT_PRESETS[0]
}

export function getExportFramePadding(viewportWidth: number) {
  return viewportWidth <= 720 ? 34 : 56
}

export function calculateExportFrameRect(
  viewportWidth: number,
  viewportHeight: number,
  preset: ExportPreset,
  padding: number,
): ExportFrameRect {
  const availableWidth = Math.max(1, viewportWidth - padding * 2)
  const availableHeight = Math.max(1, viewportHeight - padding * 2)
  const ratio = preset.width / preset.height
  const width = Math.min(availableWidth, availableHeight * ratio)
  const height = width / ratio

  return {
    left: (viewportWidth - width) / 2,
    top: (viewportHeight - height) / 2,
    width,
    height,
  }
}

function fitFrameInRegion(
  left: number,
  top: number,
  width: number,
  height: number,
  preset: ExportPreset,
): ExportFrameRect {
  const ratio = preset.width / preset.height
  const frameWidth = Math.max(1, Math.min(width, height * ratio))
  const frameHeight = frameWidth / ratio
  return {
    left: left + (width - frameWidth) / 2,
    top: top + (height - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
  }
}

export function calculatePreviewStageLayout(viewportWidth: number, viewportHeight: number, preset: ExportPreset): PreviewStageLayout {
  const width = Math.max(1, viewportWidth)
  const height = Math.max(1, viewportHeight)
  if (width <= 760) {
    return {
      frame: fitFrameInRegion(20, 142, Math.max(1, width - 40), Math.max(1, height - 204), preset),
      primaryToolbar: { left: 10, top: 8, width: Math.max(1, width - 20), height: 126 },
      cameraToolbar: { left: 10, top: Math.max(142, height - 54), width: Math.max(1, width - 20), height: 44 },
      placement: 'mobile-stacked',
    }
  }
  if (preset.ratio === '9:16') {
    return {
      frame: fitFrameInRegion(24, 24, Math.max(1, width - 244), Math.max(1, height - 92), preset),
      primaryToolbar: { left: width - 204, top: 16, width: 188, height: Math.max(1, height - 86) },
      cameraToolbar: { left: 24, top: height - 52, width: Math.max(1, width - 244), height: 40 },
      placement: 'portrait-side-rail',
    }
  }
  return {
    frame: fitFrameInRegion(24, 104, Math.max(1, width - 48), Math.max(1, height - 162), preset),
    primaryToolbar: { left: 24, top: 10, width: Math.max(1, width - 48), height: 84 },
    cameraToolbar: { left: 24, top: height - 48, width: Math.max(1, width - 48), height: 38 },
    placement: 'horizontal-rails',
  }
}

export function rectsOverlap(a: ExportFrameRect, b: ExportFrameRect) {
  return a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top
}

export function calculatePreviewFov(exportFov: number, viewportHeight: number, frameHeight: number) {
  const radians = exportFov * Math.PI / 180
  return Math.atan(Math.tan(radians / 2) * viewportHeight / Math.max(frameHeight, 1)) * 360 / Math.PI
}

export function applyExportFrameProjection(
  camera: PerspectiveCamera,
  viewportWidth: number,
  viewportHeight: number,
  preset: ExportPreset,
  exportFov = 38,
) {
  const safeWidth = Math.max(viewportWidth, 1)
  const safeHeight = Math.max(viewportHeight, 1)
  const frame = calculatePreviewStageLayout(safeWidth, safeHeight, preset).frame
  camera.aspect = preset.width / preset.height
  camera.fov = exportFov
  camera.updateProjectionMatrix()
  const scaleX = frame.width / safeWidth
  const scaleY = frame.height / safeHeight
  const translateX = 2 * (frame.left + frame.width / 2) / safeWidth - 1
  const translateY = 1 - 2 * (frame.top + frame.height / 2) / safeHeight
  const frameTransform = new Matrix4().set(
    scaleX, 0, 0, translateX,
    0, scaleY, 0, translateY,
    0, 0, 1, 0,
    0, 0, 0, 1,
  )
  camera.projectionMatrix.premultiply(frameTransform)
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
}
