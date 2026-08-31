import { Color, Object3D, PerspectiveCamera, Scene, Vector2, WebGLRenderer } from 'three'

export type PngExportSize = 800 | 3000

export interface TransparentPngOptions {
  size: PngExportSize
  includeShadow: boolean
  shadowGroup?: Object3D | null
}

export interface PngExportSelection {
  size: PngExportSize
  includeShadow: boolean
}

export const PNG_EXPORT_OPTIONS: ReadonlyArray<PngExportSelection & { label: string; quality: '普通' | '高清' }> = [
  { label: '普通 PNG（无投影）', quality: '普通', size: 800, includeShadow: false },
  { label: '普通 PNG（有投影）', quality: '普通', size: 800, includeShadow: true },
  { label: '高清 PNG（无投影）', quality: '高清', size: 3000, includeShadow: false },
  { label: '高清 PNG（有投影）', quality: '高清', size: 3000, includeShadow: true },
]

export function dataUrlToBlob(dataUrl: string) {
  const [header, encoded = ''] = dataUrl.split(',')
  const mimeType = header.match(/^data:([^;]+);base64$/)?.[1] ?? 'application/octet-stream'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type: mimeType })
}

export function renderTransparentPng(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  { size, includeShadow, shadowGroup }: TransparentPngOptions = {
    size: 3000,
    includeShadow: false,
  },
) {
  const previousSize = renderer.getSize(new Vector2())
  const previousPixelRatio = renderer.getPixelRatio()
  const previousClearColor = renderer.getClearColor(new Color()).clone()
  const previousClearAlpha = renderer.getClearAlpha()
  const previousBackground = scene.background
  const previousAspect = camera.aspect
  const previousShadowVisible = shadowGroup?.visible

  renderer.setPixelRatio(1)
  renderer.setSize(size, size, false)
  renderer.setClearColor(0x000000, 0)
  scene.background = null
  if (shadowGroup) shadowGroup.visible = includeShadow
  camera.aspect = 1
  camera.updateProjectionMatrix()
  try {
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL('image/png')
  } finally {
    scene.background = previousBackground
    if (shadowGroup && previousShadowVisible !== undefined) {
      shadowGroup.visible = previousShadowVisible
    }
    camera.aspect = previousAspect
    camera.updateProjectionMatrix()
    renderer.setClearColor(previousClearColor, previousClearAlpha)
    renderer.setPixelRatio(previousPixelRatio)
    renderer.setSize(previousSize.x, previousSize.y, false)
    renderer.render(scene, camera)
  }
}
