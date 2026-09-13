import { Color, Object3D, PerspectiveCamera, Scene, Vector2, WebGLRenderer } from 'three'

export interface TransparentPngOptions {
  width: number
  height: number
  includeShadow: boolean
  exportFov: number
  shadowGroup?: Object3D | null
}

export interface PngExportSelection {
  width: number
  height: number
  includeShadow: boolean
}

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
  { width, height, includeShadow, exportFov, shadowGroup }: TransparentPngOptions = {
    width: 3000,
    height: 3000,
    includeShadow: false,
    exportFov: 38,
  },
) {
  const previousSize = renderer.getSize(new Vector2())
  const previousPixelRatio = renderer.getPixelRatio()
  const previousClearColor = renderer.getClearColor(new Color()).clone()
  const previousClearAlpha = renderer.getClearAlpha()
  const previousBackground = scene.background
  const previousAspect = camera.aspect
  const previousFov = camera.fov
  const previousShadowVisible = shadowGroup?.visible

  renderer.setPixelRatio(1)
  renderer.setSize(width, height, false)
  renderer.setClearColor(0x000000, 0)
  scene.background = null
  if (shadowGroup) shadowGroup.visible = includeShadow
  camera.aspect = width / height
  camera.fov = exportFov
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
    camera.fov = previousFov
    camera.updateProjectionMatrix()
    renderer.setClearColor(previousClearColor, previousClearAlpha)
    renderer.setPixelRatio(previousPixelRatio)
    renderer.setSize(previousSize.x, previousSize.y, false)
    renderer.render(scene, camera)
  }
}
