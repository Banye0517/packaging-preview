import { describe, expect, it } from 'vitest'

import { createInitialProject } from '../app/projectReducer'
import { decodeProject, encodeProject } from './codec'

describe('project codec', () => {
  it('removes the rejected body radius from version 15 projects', () => {
    const current = createInitialProject()
    const version15 = JSON.parse(JSON.stringify(current))
    version15.hangingTissue.radius = 20

    const decoded = decodeProject(JSON.stringify(version15))

    expect(decoded.version).toBe(15)
    expect('radius' in decoded.hangingTissue).toBe(false)
  })

  it('migrates version 11 projects with default hanging tissue state', () => {
    const current = createInitialProject()
    const version11 = JSON.parse(JSON.stringify({ ...current, version: 11 }))
    delete version11.hangingTissue

    const decoded = decodeProject(JSON.stringify(version11))

    expect(decoded.version).toBe(15)
    expect(decoded.hangingTissue.faces).toEqual({
      front: null, back: null, left: null, right: null,
    })
    expect(decoded.hangingTissue.showPulledSheet).toBe(true)
  })

  it('migrates version 12 hanging tissue with the native default depth', () => {
    const current = createInitialProject()
    const version12 = JSON.parse(JSON.stringify({ ...current, version: 12 }))
    delete version12.hangingTissue.depth

    const decoded = decodeProject(JSON.stringify(version12))

    expect(decoded.version).toBe(15)
    expect(decoded.hangingTissue.depth).toBe(80)
    expect(decoded.hangingTissue.faces).toEqual(current.hangingTissue.faces)
    expect(decoded.hangingTissue.width).toBe(current.hangingTissue.width)
    expect(decoded.hangingTissue.height).toBe(current.hangingTissue.height)
  })

  it('round-trips a valid local project', () => {
    const project = createInitialProject()
    project.name = '饼干包装'

    expect(decodeProject(encodeProject(project))).toEqual(project)
  })

  it('migrates version 13 artwork references from current hanging tissue dimensions', () => {
    const current = createInitialProject()
    current.hangingTissue.faces.front = {
      id: 'front', name: 'front.png', mimeType: 'image/png', width: 100, height: 100,
      previewUrl: 'data:image/png;base64,AAAA',
    }
    const version13 = JSON.parse(JSON.stringify({ ...current, version: 13 }))
    delete version13.hangingTissue.artworkReferenceDimensions

    const decoded = decodeProject(JSON.stringify(version13))

    expect(decoded.version).toBe(15)
    expect(decoded.hangingTissue.artworkReferenceDimensions.front).toEqual({
      width: 160, height: 205, depth: 80,
    })
    expect(decoded.hangingTissue.artworkReferenceDimensions.back).toBeNull()
  })

  it('migrates version 10 inner packaging transforms with default stretch', () => {
    const current = createInitialProject()
    const version10 = JSON.parse(JSON.stringify({ ...current, version: 10 }))
    delete version10.innerPackaging2.transforms.front.stretchX
    delete version10.innerPackaging2.transforms.front.stretchY
    delete version10.innerPackaging2.transforms.back.stretchX
    delete version10.innerPackaging2.transforms.back.stretchY

    const decoded = decodeProject(JSON.stringify(version10))

    expect(decoded.version).toBe(15)
    expect(decoded.innerPackaging2.transforms.front).toMatchObject({
      stretchX: 100,
      stretchY: 100,
    })
    expect(decoded.innerPackaging2.transforms.back).toMatchObject({
      stretchX: 100,
      stretchY: 100,
    })
  })

  it('rejects an invalid pouch finish mask face set', () => {
    const project = createInitialProject()
    const masks = project.pouchFinish.layers['gold-foil'].masks as Record<string, unknown>
    masks.left = null

    expect(() => decodeProject(encodeProject(project))).toThrow(
      '不是有效的 BoxLab 项目文件',
    )
  })

  it('migrates version 8 projects with an empty pouch finish state', () => {
    const project = createInitialProject()
    const version8 = { ...project, version: 8 } as Record<string, unknown>
    delete version8.pouchFinish

    const decoded = decodeProject(JSON.stringify(version8))

    expect(decoded.version).toBe(15)
    expect(Object.keys(decoded.pouchFinish.layers['gold-foil'].masks)).toEqual(['front', 'back'])
  })

  it('rejects files that are not BoxLab projects', () => {
    expect(() => decodeProject('{"version":2}')).toThrow('不是有效的 BoxLab 项目文件')
  })

  it('rejects external texture URLs in project files', () => {
    const project = createInitialProject()
    project.faces.front = {
      id: 'external',
      name: 'front.png',
      mimeType: 'image/png',
      width: 100,
      height: 100,
      previewUrl: 'https://example.com/front.png',
    }

    expect(() => decodeProject(encodeProject(project))).toThrow(
      '不是有效的 BoxLab 项目文件',
    )
  })

  it('migrates a version 1 project to a version 10 box project', () => {
    const current = createInitialProject()
    const legacy = {
      version: 1,
      name: '旧版包装',
      activeTab: current.activeTab,
      faces: current.faces,
      box: current.box,
      camera: current.camera,
    }

    const decoded = decodeProject(JSON.stringify(legacy))

    expect(decoded.version).toBe(15)
    expect(decoded.packagingType).toBe('box')
    expect(decoded.pouch.faces).toEqual({ front: null, back: null })
    expect(decoded.faces).toEqual(legacy.faces)
  })

  it('rejects invalid pouch dimensions in version 3 projects', () => {
    const project = createInitialProject()
    project.pouch.thickness = 0

    expect(() => decodeProject(encodeProject(project))).toThrow(
      '不是有效的 BoxLab 项目文件',
    )
  })

  it('migrates a version 2 project to version 9 with empty inner packaging', () => {
    const current = createInitialProject()
    const version2 = {
      ...current,
      version: 2,
    }
    delete (version2 as Partial<typeof version2>).innerPackaging1

    const decoded = decodeProject(JSON.stringify(version2))

    expect(decoded.version).toBe(15)
    expect(decoded.innerPackaging1.artwork).toBeNull()
  })

  it('migrates version 3 inner packaging front artwork to one UV artwork', () => {
    const current = createInitialProject()
    const artwork = {
      id: 'front',
      name: 'front.png',
      mimeType: 'image/png' as const,
      width: 1024,
      height: 1024,
      previewUrl: 'data:image/png;base64,AAAA',
    }
    const version3 = {
      ...current,
      version: 3,
      innerPackaging1: {
        faces: { front: artwork, back: null },
        width: 160,
        height: 205,
      },
    }

    const decoded = decodeProject(JSON.stringify(version3))

    expect(decoded.version).toBe(15)
    expect(decoded.innerPackaging1.artwork).toEqual(artwork)
  })

  it('migrates version 4 artwork with default transform values', () => {
    const current = createInitialProject()
    const version4 = {
      ...current,
      version: 4,
      innerPackaging1: {
        artwork: null,
        width: 160,
        height: 205,
      },
    }

    const decoded = decodeProject(JSON.stringify(version4))

    expect(decoded.version).toBe(15)
    expect(decoded.innerPackaging1).toMatchObject({
      artworkScale: 100,
      artworkOffsetX: 0,
      artworkOffsetY: 0,
      artworkRotation: 0,
      artworkStretchX: 100,
      artworkStretchY: 100,
    })
  })

  it('migrates version 5 artwork with default rotation and stretch', () => {
    const current = createInitialProject()
    const version5 = {
      ...current,
      version: 5,
      innerPackaging1: {
        artwork: null,
        width: 160,
        height: 205,
        artworkScale: 120,
        artworkOffsetX: 10,
        artworkOffsetY: -5,
      },
    }

    const decoded = decodeProject(JSON.stringify(version5))

    expect(decoded.version).toBe(15)
    expect(decoded.innerPackaging1).toMatchObject({
      artworkScale: 120,
      artworkOffsetX: 10,
      artworkOffsetY: -5,
      artworkRotation: 0,
      artworkStretchX: 100,
      artworkStretchY: 100,
    })
  })

  it('migrates version 6 with the default model direction', () => {
    const current = createInitialProject()
    const innerPackaging1 = { ...current.innerPackaging1 }
    delete (innerPackaging1 as Partial<typeof innerPackaging1>).modelRotation
    const version6 = { ...current, version: 6, innerPackaging1 }

    const decoded = decodeProject(JSON.stringify(version6))

    expect(decoded.version).toBe(15)
    expect(decoded.innerPackaging1.modelRotation).toBe(0)
  })

  it('migrates version 7 with empty default box finish state', () => {
    const current = createInitialProject()
    const version7 = { ...current, version: 7 }
    delete (version7 as Partial<typeof version7>).boxFinish

    const decoded = decodeProject(JSON.stringify(version7))

    expect(decoded.version).toBe(15)
    expect(decoded.boxFinish.selectedKind).toBe('gold-foil')
    expect(decoded.boxFinish.layers['gold-foil'].masks.front).toBeNull()
  })

  it('round-trips finish masks and their transforms', () => {
    const project = createInitialProject()
    project.boxFinish.layers['gold-foil'].masks.front = {
      asset: {
        id: 'gold-front',
        name: 'gold-front.png',
        mimeType: 'image/png',
        width: 512,
        height: 512,
        previewUrl: 'data:image/png;base64,AAAA',
      },
      transform: { scale: 160, offsetX: 12, offsetY: -8, rotation: 30 },
    }

    expect(decodeProject(encodeProject(project)).boxFinish).toEqual(project.boxFinish)
  })

  it('migrates version 9 projects with an empty inner packaging 2 state', () => {
    const project = createInitialProject()
    const version9 = { ...project, version: 9 } as Record<string, unknown>
    delete version9.innerPackaging2

    const decoded = decodeProject(JSON.stringify(version9))

    expect(decoded.version).toBe(15)
    expect(decoded.innerPackaging2.faces).toEqual({ front: null, back: null })
    expect(decoded.innerPackaging2.transforms.front).toEqual({
      scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100,
    })
  })

  it('rejects invalid inner packaging 2 face keys and transforms', () => {
    const project = createInitialProject()
    ;(project.innerPackaging2.faces as Record<string, unknown>).left = null
    expect(() => decodeProject(encodeProject(project))).toThrow(
      '不是有效的 BoxLab 项目文件',
    )

    const invalidTransform = createInitialProject()
    invalidTransform.innerPackaging2.transforms.front.scale = 301
    expect(() => decodeProject(encodeProject(invalidTransform))).toThrow(
      '不是有效的 BoxLab 项目文件',
    )
  })
})
