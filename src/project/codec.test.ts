import { describe, expect, it } from 'vitest'

import { createInitialProject as createProject, getSelectedInstance } from '../app/projectReducer'
import { createPackageInstance, clonePackageForAdd } from '../app/packageFactory'
import type { PackageInstance, ProjectState } from '../app/types'
import { decodeProject as decode, encodeProject } from './codec'

type TestProject = ProjectState & PackageInstance

function createInitialProject(): TestProject {
  const project = createProject()
  return Object.assign(project, getSelectedInstance(project))
}

function decodeProject(source: string): TestProject {
  const project = decode(source)
  return Object.assign(project, getSelectedInstance(project))
}

function createLegacyFixture(version: number, instance: PackageInstance): Record<string, unknown> {
  return {
    version,
    name: '旧版包装',
    activeTab: 'artwork',
    packagingType: instance.packagingType,
    faces: instance.faces,
    box: instance.box,
    pouch: instance.pouch,
    innerPackaging1: instance.innerPackaging1,
    innerPackaging2: instance.innerPackaging2,
    hangingTissue: instance.hangingTissue,
    faceTissue: instance.faceTissue,
    wetTissue: instance.wetTissue,
    washTissue: instance.washTissue,
    boxFinish: instance.boxFinish,
    pouchFinish: instance.pouchFinish,
    camera: { autoRotate: false, lightingIntensity: 0 },
  }
}

describe('project codec', () => {
  it('migrates version 16 projects to direct-color lighting by default', () => {
    const current = createInitialProject()
    const version16 = JSON.parse(JSON.stringify(createLegacyFixture(16, getSelectedInstance(current))))
    delete version16.camera.lightingIntensity

    const decoded = decodeProject(JSON.stringify(version16))

    expect(decoded.version).toBe(20)
    expect(decoded.camera.lightingIntensity).toBe(0)
  })

  it('round-trips signed lighting and rejects values outside -100 to 100', () => {
    const project = createInitialProject()
    project.camera.lightingIntensity = -65
    expect(decodeProject(encodeProject(project)).camera.lightingIntensity).toBe(-65)

    project.camera.lightingIntensity = -101
    expect(() => decodeProject(encodeProject(project))).toThrow('不是有效的 BoxLab 项目文件')
  })

  it('migrates version 15 projects with the default face tissue state', () => {
    const current = createInitialProject()
    const version15 = JSON.parse(JSON.stringify(createLegacyFixture(15, getSelectedInstance(current))))
    delete version15.faceTissue

    const decoded = decodeProject(JSON.stringify(version15))

    expect(decoded.version).toBe(20)
    expect(decoded.faceTissue.artwork).toBeNull()
    expect(decoded.faceTissue.showTopSheet).toBe(true)
    expect(decoded.faceTissue.artworkTransform).toEqual({
      scale: 100,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      stretchX: 100,
      stretchY: 100,
    })
  })

  it('removes the rejected body radius from version 15 projects', () => {
    const current = createInitialProject()
    const version15 = JSON.parse(JSON.stringify(createLegacyFixture(15, getSelectedInstance(current))))
    version15.hangingTissue.radius = 20

    const decoded = decodeProject(JSON.stringify(version15))

    expect(decoded.version).toBe(20)
    expect('radius' in decoded.hangingTissue).toBe(false)
  })

  it('migrates version 11 projects with default hanging tissue state', () => {
    const current = createInitialProject()
    const version11 = JSON.parse(JSON.stringify(createLegacyFixture(11, getSelectedInstance(current))))
    delete version11.hangingTissue

    const decoded = decodeProject(JSON.stringify(version11))

    expect(decoded.version).toBe(20)
    expect(decoded.hangingTissue.faces).toEqual({
      front: null, back: null, left: null, right: null,
    })
    expect(decoded.hangingTissue.showPulledSheet).toBe(true)
  })

  it('migrates version 12 hanging tissue with the native default depth', () => {
    const current = createInitialProject()
    const version12 = JSON.parse(JSON.stringify(createLegacyFixture(12, getSelectedInstance(current))))
    delete version12.hangingTissue.depth

    const decoded = decodeProject(JSON.stringify(version12))

    expect(decoded.version).toBe(20)
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

  it('round-trips wet tissue artwork, transforms, model state, and paper visibility', () => {
    const project = createInitialProject()
    project.packagingType = 'wet-tissue'
    project.wetTissue.modelState = 'closed'
    project.wetTissue.showTopSheet = false
    project.wetTissue.transforms.lid.rotation = 42
    project.wetTissue.artworkReferenceDimensions.body = { width: 160, height: 205, thickness: 80 }

    expect(decodeProject(encodeProject(project)).wetTissue).toEqual(project.wetTissue)
  })

  it('adds default wet tissue state to version 16 projects created before this packaging type', () => {
    const project = JSON.parse(JSON.stringify(createInitialProject())) as Record<string, unknown>
    delete project.wetTissue

    const decoded = decodeProject(JSON.stringify(project))

    expect(decoded.wetTissue).toEqual(createInitialProject().wetTissue)
  })

  it('round-trips wash tissue artwork, transforms, dimensions, and paper visibility', () => {
    const project = createInitialProject()
    project.packagingType = 'wash-tissue'
    project.washTissue.showTopSheet = false
    project.washTissue.artworkTransform.stretchX = 140
    project.washTissue.width = 180
    project.washTissue.artworkReferenceDimensions = { width: 160, height: 205, thickness: 80 }

    expect(decodeProject(encodeProject(project)).washTissue).toEqual(project.washTissue)
  })

  it('adds default wash tissue state to version 16 projects created before this packaging type', () => {
    const project = JSON.parse(JSON.stringify(createInitialProject())) as Record<string, unknown>
    delete project.washTissue

    const decoded = decodeProject(JSON.stringify(project))

    expect(decoded.washTissue).toEqual(createInitialProject().washTissue)
  })

  it('migrates version 13 artwork references from current hanging tissue dimensions', () => {
    const current = createInitialProject()
    current.hangingTissue.faces.front = {
      id: 'front', name: 'front.png', mimeType: 'image/png', width: 100, height: 100,
      previewUrl: 'data:image/png;base64,AAAA',
    }
    const version13 = JSON.parse(JSON.stringify(createLegacyFixture(13, getSelectedInstance(current))))
    delete version13.hangingTissue.artworkReferenceDimensions

    const decoded = decodeProject(JSON.stringify(version13))

    expect(decoded.version).toBe(20)
    expect(decoded.hangingTissue.artworkReferenceDimensions.front).toEqual({
      width: 160, height: 205, depth: 80,
    })
    expect(decoded.hangingTissue.artworkReferenceDimensions.back).toBeNull()
  })

  it('migrates version 10 inner packaging transforms with default stretch', () => {
    const current = createInitialProject()
    const version10 = JSON.parse(JSON.stringify(createLegacyFixture(10, getSelectedInstance(current))))
    delete version10.innerPackaging2.transforms.front.stretchX
    delete version10.innerPackaging2.transforms.front.stretchY
    delete version10.innerPackaging2.transforms.back.stretchX
    delete version10.innerPackaging2.transforms.back.stretchY

    const decoded = decodeProject(JSON.stringify(version10))

    expect(decoded.version).toBe(20)
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
    const version8 = createLegacyFixture(8, getSelectedInstance(project))
    delete version8.pouchFinish

    const decoded = decodeProject(JSON.stringify(version8))

    expect(decoded.version).toBe(20)
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
    const legacyInstance = createPackageInstance('box', 'legacy')
    legacyInstance.faces.front = {
      id: 'legacy-front', name: 'legacy.png', mimeType: 'image/png', width: 100, height: 100,
      previewUrl: 'data:image/png;base64,AAAA',
    }
    const legacy = createLegacyFixture(1, legacyInstance)
    delete legacy.pouch
    delete legacy.innerPackaging1
    delete legacy.innerPackaging2
    delete legacy.hangingTissue
    delete legacy.faceTissue
    delete legacy.wetTissue
    delete legacy.washTissue
    delete legacy.boxFinish
    delete legacy.pouchFinish

    const decoded = decodeProject(JSON.stringify(legacy))

    expect(decoded.version).toBe(20)
    expect(decoded.packagingType).toBe('box')
    expect(decoded.pouch.faces).toEqual({ front: null, back: null })
    expect(getSelectedInstance(decoded).faces).toEqual(legacy.faces)
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
    const version2 = createLegacyFixture(2, getSelectedInstance(current))
    delete (version2 as Partial<typeof version2>).innerPackaging1

    const decoded = decodeProject(JSON.stringify(version2))

    expect(decoded.version).toBe(20)
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
      ...createLegacyFixture(3, getSelectedInstance(current)),
      innerPackaging1: {
        faces: { front: artwork, back: null },
        width: 160,
        height: 205,
      },
    }

    const decoded = decodeProject(JSON.stringify(version3))

    expect(decoded.version).toBe(20)
    expect(decoded.innerPackaging1.artwork).toEqual(artwork)
  })

  it('migrates version 4 artwork with default transform values', () => {
    const current = createInitialProject()
    const version4 = {
      ...createLegacyFixture(4, getSelectedInstance(current)),
      innerPackaging1: {
        artwork: null,
        width: 160,
        height: 205,
      },
    }

    const decoded = decodeProject(JSON.stringify(version4))

    expect(decoded.version).toBe(20)
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
      ...createLegacyFixture(5, getSelectedInstance(current)),
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

    expect(decoded.version).toBe(20)
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
    const version6 = { ...createLegacyFixture(6, getSelectedInstance(current)), innerPackaging1 }

    const decoded = decodeProject(JSON.stringify(version6))

    expect(decoded.version).toBe(20)
    expect(decoded.innerPackaging1.modelRotation).toBe(0)
  })

  it('migrates version 7 with empty default box finish state', () => {
    const current = createInitialProject()
    const version7 = createLegacyFixture(7, getSelectedInstance(current))
    delete (version7 as Partial<typeof version7>).boxFinish

    const decoded = decodeProject(JSON.stringify(version7))

    expect(decoded.version).toBe(20)
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
    const version9 = createLegacyFixture(9, getSelectedInstance(project))
    delete version9.innerPackaging2

    const decoded = decodeProject(JSON.stringify(version9))

    expect(decoded.version).toBe(20)
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

  it('round-trips two independent package instances through version 20', () => {
    const project = createInitialProject()
    const second = clonePackageForAdd(getSelectedInstance(project), 'box-2')
    second.box.width = 260
    project.instances.push(second)
    project.selectedInstanceId = second.id
    project.layout = 'family'

    const decoded = decodeProject(encodeProject(project))

    expect(decoded.version).toBe(20)
    expect(decoded.instances).toHaveLength(2)
    expect(decoded.instances[0].box.width).toBe(160)
    expect(getSelectedInstance(decoded).id).toBe('box-2')
    expect(getSelectedInstance(decoded).box.width).toBe(260)
  })

  it('migrates a version 17 legacy package into one deterministic package-1 instance', () => {
    const legacy = createLegacyFixture(17, createPackageInstance('wet-tissue', 'legacy'))

    const decoded = decodeProject(JSON.stringify(legacy))

    expect(decoded.version).toBe(20)
    expect(decoded.instances).toHaveLength(1)
    expect(decoded.instances[0].id).toBe('package-1')
    expect(getSelectedInstance(decoded).packagingType).toBe('wet-tissue')
  })

  it('round-trips version 20 pedestal settings', () => {
    const project = createInitialProject()
    project.pedestal = { preset: 'horizontal', color: 'light-yellow', cornerRadiusMm: 18 }

    expect(decodeProject(encodeProject(project)).pedestal).toEqual(project.pedestal)
  })

  it('migrates version 18 projects with pedestals disabled', () => {
    const current = createInitialProject()
    const version18 = JSON.parse(JSON.stringify(current))
    version18.version = 18
    delete version18.pedestal

    const decoded = decodeProject(JSON.stringify(version18))

    expect(decoded.pedestal).toEqual({ preset: 'none', color: 'warm-white', cornerRadiusMm: 8 })
  })

  it('migrates version 19 pedestal settings with the default radius', () => {
    const current = createInitialProject()
    const version19 = JSON.parse(JSON.stringify(current))
    version19.version = 19
    version19.pedestal = { preset: 'steps', color: 'light-pink' }

    expect(decodeProject(JSON.stringify(version19)).pedestal).toEqual({
      preset: 'steps', color: 'light-pink', cornerRadiusMm: 8,
    })
  })

  it.each([-1, 31, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid pedestal radius %s', (value) => {
    const project = createInitialProject()
    project.pedestal.cornerRadiusMm = value

    expect(() => decodeProject(encodeProject(project))).toThrow('不是有效的 BoxLab 项目文件')
  })

  it('rejects unsupported pedestal values', () => {
    const project = createInitialProject()
    ;(project.pedestal as { preset: string }).preset = 'floating'

    expect(() => decodeProject(encodeProject(project))).toThrow('不是有效的 BoxLab 项目文件')
  })
})
