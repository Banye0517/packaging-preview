import type { PerspectiveCamera } from 'three'

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
  const padding = getExportFramePadding(viewportWidth)
  const frame = calculateExportFrameRect(viewportWidth, viewportHeight, preset, padding)
  camera.aspect = viewportWidth / Math.max(viewportHeight, 1)
  camera.fov = calculatePreviewFov(exportFov, viewportHeight, frame.height)
  camera.updateProjectionMatrix()
}
