import { Color, Group, PerspectiveCamera, Scene, Vector2, type WebGLRenderer } from 'three'
import { describe, expect, it, vi } from 'vitest'

import { dataUrlToBlob, renderTransparentPng } from './transparentPng'

describe('renderTransparentPng', () => {
  it('renders an 800 by 800 transparent PNG without a contact shadow and restores state', () => {
    const camera = new PerspectiveCamera(38, 1.6)
    camera.projectionMatrix.elements[8] = 0.24
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
    const previewProjection = camera.projectionMatrix.clone()
    const scene = new Scene()
    scene.background = new Color('#ffffff')
    const shadowGroup = new Group()
    const shadowVisibilityDuringRender: boolean[] = []
    scene.add(shadowGroup)
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
      render: vi.fn(() => shadowVisibilityDuringRender.push(shadowGroup.visible)),
    } as unknown as WebGLRenderer

    const result = renderTransparentPng(renderer, scene, camera, {
      width: 800,
      height: 800,
      includeShadow: false,
      exportFov: 38,
      shadowGroup,
    })

    expect(renderer.setSize).toHaveBeenNthCalledWith(1, 800, 800, false)
    expect(renderer.setClearColor).toHaveBeenNthCalledWith(1, 0x000000, 0)
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/png')
    expect(result).toBe('data:image/png;base64,exported')
    expect(renderer.setSize).toHaveBeenLastCalledWith(1200, 800, false)
    expect(scene.background).toBeInstanceOf(Color)
    expect(shadowGroup.visible).toBe(true)
    expect(shadowVisibilityDuringRender).toEqual([false, true])
    expect(camera.projectionMatrix.equals(previewProjection)).toBe(true)
  })

  it('renders a 3000 by 3000 transparent PNG with the contact shadow visible', () => {
    const camera = new PerspectiveCamera(38, 1.6)
    const scene = new Scene()
    const shadowGroup = new Group()
    const shadowVisibilityDuringRender: boolean[] = []
    const renderer = {
      domElement: { toDataURL: vi.fn(() => 'data:image/png;base64,exported') },
      getSize: vi.fn((target: Vector2) => target.set(1200, 800)),
      getPixelRatio: vi.fn(() => 2),
      getClearColor: vi.fn((target: Color) => target.set('#eef3f9')),
      getClearAlpha: vi.fn(() => 1),
      setPixelRatio: vi.fn(),
      setSize: vi.fn(),
      setClearColor: vi.fn(),
      render: vi.fn(() => shadowVisibilityDuringRender.push(shadowGroup.visible)),
    } as unknown as WebGLRenderer

    renderTransparentPng(renderer, scene, camera, {
      width: 3000,
      height: 3000,
      includeShadow: true,
      exportFov: 38,
      shadowGroup,
    })

    expect(renderer.setSize).toHaveBeenNthCalledWith(1, 3000, 3000, false)
    expect(shadowGroup.visible).toBe(true)
    expect(shadowVisibilityDuringRender).toEqual([true, true])
  })

  it.each([
    [800, 800],
    [3000, 3000],
    [2560, 1440],
    [1440, 2560],
  ])('renders at %i by %i pixels', (width, height) => {
    const camera = new PerspectiveCamera(52, 1.6)
    const scene = new Scene()
    const renderer = {
      domElement: { toDataURL: vi.fn(() => 'data:image/png;base64,exported') },
      getSize: vi.fn((target: Vector2) => target.set(1200, 800)),
      getPixelRatio: vi.fn(() => 2),
      getClearColor: vi.fn((target: Color) => target.set('#eef3f9')),
      getClearAlpha: vi.fn(() => 1),
      setPixelRatio: vi.fn(),
      setSize: vi.fn(),
      setClearColor: vi.fn(),
      render: vi.fn(),
    } as unknown as WebGLRenderer

    renderTransparentPng(renderer, scene, camera, {
      width,
      height,
      includeShadow: false,
      exportFov: 38,
    })

    expect(renderer.setSize).toHaveBeenNthCalledWith(1, width, height, false)
    expect(camera.aspect).toBe(1.6)
    expect(camera.fov).toBe(52)
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
