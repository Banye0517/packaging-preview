import { createDefaultBoxFinish, createDefaultPouchFinish } from '../finish/finishTypes'
import { BOX_FACES, HANGING_TISSUE_FACES, type ArtworkTransform, type FaceTissueState, type PackageInstance, type PackagingType } from './types'

const PACKAGE_LABELS: Record<PackagingType, string> = {
  box: '六面盒型',
  pouch: '自立袋',
  'inner-packaging-1': '内包装1',
  'inner-packaging-2': '内包装2',
  'hanging-tissue': '悬挂抽纸',
  'face-tissue': '面纸',
  'wet-tissue': '湿纸巾',
  'wash-tissue': '洗脸巾',
}

/** Clears user-provided artwork and finish masks while preserving all structure settings. */
export function clearPackageAssets(instance: PackageInstance): PackageInstance {
  Object.keys(instance.faces).forEach((face) => {
    instance.faces[face as keyof typeof instance.faces] = null
  })
  for (const face of ['front', 'back'] as const) {
    instance.pouch.faces[face] = null
  }
  instance.innerPackaging1.artwork = null
  Object.keys(instance.innerPackaging2.faces).forEach((face) => {
    instance.innerPackaging2.faces[face as keyof typeof instance.innerPackaging2.faces] = null
  })
  Object.keys(instance.hangingTissue.faces).forEach((face) => {
    const key = face as keyof typeof instance.hangingTissue.faces
    instance.hangingTissue.faces[key] = null
    instance.hangingTissue.artworkReferenceDimensions[key] = null
  })
  instance.faceTissue.artwork = null
  instance.faceTissue.artworkReferenceDimensions = null
  Object.keys(instance.wetTissue.artworks).forEach((slot) => {
    const key = slot as keyof typeof instance.wetTissue.artworks
    instance.wetTissue.artworks[key] = null
    instance.wetTissue.artworkReferenceDimensions[key] = null
  })
  instance.washTissue.artwork = null
  instance.washTissue.artworkReferenceDimensions = null
  for (const finish of [instance.boxFinish, instance.pouchFinish]) {
    for (const layer of Object.values(finish.layers)) {
      for (const face of Object.keys(layer.masks) as Array<keyof typeof layer.masks>) {
        layer.masks[face] = null
      }
    }
  }
  return instance
}

export function createPackageInstance(packagingType: PackagingType, id: string): PackageInstance {
  const artworkTransform = (): ArtworkTransform => ({ scale: 100, offsetX: 0, offsetY: 0, rotation: 0, stretchX: 100, stretchY: 100 })
  const faceTissue = (): FaceTissueState => ({
    artwork: null, width: 160, height: 205, thickness: 80, radius: 0,
    artworkReferenceDimensions: null, artworkTransform: artworkTransform(), modelRotation: 0, showTopSheet: true,
  })
  const instance: PackageInstance = {
    id,
    packagingType,
    manualTransform: null,
    faces: Object.fromEntries(BOX_FACES.map((face) => [face, null])) as PackageInstance['faces'],
    box: { width: 160, height: 220, depth: 70, radius: 4 },
    pouch: { faces: { front: null, back: null }, width: 160, height: 240, thickness: 16, gussetDepth: 70, roundedCorners: true, closure: 'none' },
    innerPackaging1: { artwork: null, width: 160, height: 205, artworkScale: 100, artworkOffsetX: 0, artworkOffsetY: 0, artworkRotation: 0, artworkStretchX: 100, artworkStretchY: 100, modelRotation: 0 },
    innerPackaging2: {
      faces: { front: null, back: null },
      transforms: { front: artworkTransform(), back: artworkTransform() }, selectedFace: 'front', width: 160, height: 205, modelRotation: 0,
    },
    hangingTissue: {
      faces: Object.fromEntries(HANGING_TISSUE_FACES.map((face) => [face, null])) as PackageInstance['hangingTissue']['faces'],
      artworkReferenceDimensions: Object.fromEntries(HANGING_TISSUE_FACES.map((face) => [face, null])) as PackageInstance['hangingTissue']['artworkReferenceDimensions'],
      transforms: Object.fromEntries(HANGING_TISSUE_FACES.map((face) => [face, artworkTransform()])) as PackageInstance['hangingTissue']['transforms'],
      selectedFace: 'front', width: 160, height: 205, depth: 80, modelRotation: 0, showPulledSheet: true,
    },
    faceTissue: faceTissue(),
    wetTissue: {
      artworks: { body: null, lid: null }, artworkReferenceDimensions: { body: null, lid: null },
      transforms: { body: artworkTransform(), lid: artworkTransform() }, selectedArtwork: 'body', width: 160, height: 205, thickness: 80, modelState: 'open', modelRotation: 0, showTopSheet: true,
    },
    washTissue: faceTissue(),
    boxFinish: createDefaultBoxFinish(),
    pouchFinish: createDefaultPouchFinish(),
  }
  return clearPackageAssets(instance)
}

export function clonePackageForAdd(source: PackageInstance, id: string): PackageInstance {
  const copy = structuredClone(source)
  copy.id = id
  copy.manualTransform = null
  return clearPackageAssets(copy)
}

export function getPackageLabel(packagingType: PackagingType, occurrence: number): string {
  return `${PACKAGE_LABELS[packagingType]} ${occurrence}`
}
