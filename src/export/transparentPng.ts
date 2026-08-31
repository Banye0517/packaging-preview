import { Color, PerspectiveCamera, Scene, Vector2, WebGLRenderer } from 'three'

export const EXPORT_SIZE = 2000

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
) {
  const previousSize = renderer.getSize(new Vector2())
  const previousPixelRatio = renderer.getPixelRatio()
  const previousClearColor = renderer.getClearColor(new Color()).clone()
  const previousClearAlpha = renderer.getClearAlpha()
  const previousBackground = scene.background
  const previousAspect = camera.aspect

  renderer.setPixelRatio(1)
  renderer.setSize(EXPORT_SIZE, EXPORT_SIZE, false)
  renderer.setClearColor(0x000000, 0)
  scene.background = null
  camera.aspect = 1
  camera.updateProjectionMatrix()
  try {
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL('image/png')
  } finally {
    scene.background = previousBackground
    camera.aspect = previousAspect
    camera.updateProjectionMatrix()
    renderer.setClearColor(previousClearColor, previousClearAlpha)
    renderer.setPixelRatio(previousPixelRatio)
    renderer.setSize(previousSize.x, previousSize.y, false)
    renderer.render(scene, camera)
  }
}
