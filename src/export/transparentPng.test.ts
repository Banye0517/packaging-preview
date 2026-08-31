import { Color, PerspectiveCamera, Scene, Vector2, type WebGLRenderer } from 'three'
import { describe, expect, it, vi } from 'vitest'

import { dataUrlToBlob, EXPORT_SIZE, renderTransparentPng } from './transparentPng'

describe('renderTransparentPng', () => {
  it('renders a 2000 by 2000 transparent PNG and restores the renderer', () => {
    const camera = new PerspectiveCamera(38, 1.6)
    const scene = new Scene()
    scene.background = new Color('#ffffff')
    const canvas = {
      toDataURL: vi.fn(() => 'data:image/png;base64,exported'),
    }
    const renderer = {
      domElement: canvas,
      getSize: vi.fn((target: Vector2) => target.set(1200, 800)),
      getPixelRatio: vi.fn(() => 2),
      getClearColor: vi.fn((target: Color) => target.set('#eef3f9')),
      getClearAlpha: vi.fn(() => 1),
      setPixelRatio: vi.fn(),
      setSize: vi.fn(),
      setClearColor: vi.fn(),
      render: vi.fn(),
    } as unknown as WebGLRenderer

    const result = renderTransparentPng(renderer, scene, camera)

    expect(EXPORT_SIZE).toBe(2000)
    expect(renderer.setSize).toHaveBeenNthCalledWith(1, 2000, 2000, false)
    expect(renderer.setClearColor).toHaveBeenNthCalledWith(1, 0x000000, 0)
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/png')
    expect(result).toBe('data:image/png;base64,exported')
    expect(renderer.setSize).toHaveBeenLastCalledWith(1200, 800, false)
    expect(scene.background).toBeInstanceOf(Color)
  })

  it('converts the PNG data URL into a downloadable Blob', async () => {
    const blob = dataUrlToBlob('data:image/png;base64,iVBORw0KGgo=')

    expect(blob.type).toBe('image/png')
    expect(blob.size).toBeGreaterThan(0)
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  })

  it('restores renderer and camera state when PNG encoding fails', () => {
    const camera = new PerspectiveCamera(38, 1.6)
    const scene = new Scene()
    scene.background = new Color('#ffffff')
    const renderer = {
      domElement: { toDataURL: vi.fn(() => { throw new Error('encode failed') }) },
      getSize: vi.fn((target: Vector2) => target.set(1200, 800)),
      getPixelRatio: vi.fn(() => 2),
      getClearColor: vi.fn((target: Color) => target.set('#eef3f9')),
      getClearAlpha: vi.fn(() => 1),
      setPixelRatio: vi.fn(),
      setSize: vi.fn(),
      setClearColor: vi.fn(),
      render: vi.fn(),
    } as unknown as WebGLRenderer

    expect(() => renderTransparentPng(renderer, scene, camera)).toThrow('encode failed')
    expect(camera.aspect).toBe(1.6)
    expect(renderer.setSize).toHaveBeenLastCalledWith(1200, 800, false)
    expect(scene.background).toBeInstanceOf(Color)
  })
})
