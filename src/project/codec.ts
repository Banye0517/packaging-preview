import {
  BOX_FACES,
  type ArtworkAsset,
  type ImageMimeType,
  type PouchFace,
  type ProjectState,
} from '../app/types'
import { createDefaultInnerPackaging2, createInitialProject } from '../app/projectReducer'
import {
  DEFAULT_FINISH_PARAMETERS,
  FINISH_KINDS,
  createDefaultBoxFinish,
  createDefaultPouchFinish,
  isValidFinishParameter,
  type FinishMaskAsset,
  type FinishParameterKey,
} from '../finish/finishTypes'

const TABS = new Set(['artwork', 'finish', 'box', 'camera'])
const MIME_TYPES = new Set<ImageMimeType>(['image/png', 'image/jpeg', 'image/webp'])

function isArtworkAsset(value: unknown): value is ArtworkAsset | null {
  if (value === null) return true
  if (!value || typeof value !== 'object') return false
  const asset = value as Partial<ArtworkAsset>
  return (
    typeof asset.id === 'string' &&
    typeof asset.name === 'string' &&
    MIME_TYPES.has(asset.mimeType as ImageMimeType) &&
    typeof asset.width === 'number' &&
    Number.isFinite(asset.width) &&
    asset.width > 0 &&
    typeof asset.height === 'number' &&
    Number.isFinite(asset.height) &&
    asset.height > 0 &&
    typeof asset.previewUrl === 'string' &&
    /^data:image\/(png|jpeg|webp);base64,/.test(asset.previewUrl)
  )
}

interface LegacyProjectState extends Omit<ProjectState, 'version' | 'packagingType' | 'pouch' | 'innerPackaging1' | 'innerPackaging2' | 'boxFinish' | 'pouchFinish'> {
  version: 1
}

interface Version2ProjectState extends Omit<ProjectState, 'version' | 'innerPackaging1' | 'innerPackaging2' | 'boxFinish' | 'pouchFinish'> {
  version: 2
}

interface Version3ProjectState extends Omit<ProjectState, 'version' | 'innerPackaging1' | 'innerPackaging2' | 'boxFinish' | 'pouchFinish'> {
  version: 3
  innerPackaging1: {
    faces: Record<PouchFace, ArtworkAsset | null>
    width: number
    height: number
  }
}

interface Version4ProjectState extends Omit<ProjectState, 'version' | 'innerPackaging1' | 'innerPackaging2' | 'boxFinish' | 'pouchFinish'> {
  version: 4
  innerPackaging1: {
    artwork: ArtworkAsset | null
    width: number
    height: number
  }
}

interface Version5ProjectState extends Omit<ProjectState, 'version' | 'innerPackaging1' | 'innerPackaging2' | 'boxFinish' | 'pouchFinish'> {
  version: 5
  innerPackaging1: Omit<
    ProjectState['innerPackaging1'],
    'artworkRotation' | 'artworkStretchX' | 'artworkStretchY' | 'modelRotation'
  >
}

interface Version6ProjectState extends Omit<ProjectState, 'version' | 'innerPackaging1' | 'innerPackaging2' | 'boxFinish' | 'pouchFinish'> {
  version: 6
  innerPackaging1: Omit<ProjectState['innerPackaging1'], 'modelRotation'>
}

interface Version7ProjectState extends Omit<ProjectState, 'version' | 'innerPackaging2' | 'boxFinish' | 'pouchFinish'> {
  version: 7
}
interface Version8ProjectState extends Omit<ProjectState, 'version' | 'innerPackaging2' | 'pouchFinish'> {
  version: 8
}

interface Version9ProjectState extends Omit<ProjectState, 'version' | 'innerPackaging2'> {
  version: 9
}

function hasSharedProjectFields(project: Partial<Omit<ProjectState, 'version'>>) {
  return (
    typeof project.name === 'string' &&
    TABS.has(project.activeTab ?? '') &&
    !!project.faces &&
    BOX_FACES.every((face) => isArtworkAsset(project.faces![face])) &&
    !!project.box &&
    typeof project.box.width === 'number' &&
    Number.isFinite(project.box.width) &&
    project.box.width > 0 &&
    typeof project.box.height === 'number' &&
    Number.isFinite(project.box.height) &&
    project.box.height > 0 &&
    typeof project.box.depth === 'number' &&
    Number.isFinite(project.box.depth) &&
    project.box.depth > 0 &&
    typeof project.box.radius === 'number' &&
    Number.isFinite(project.box.radius) &&
    project.box.radius >= 0 &&
    !!project.camera &&
    typeof project.camera.autoRotate === 'boolean'
  )
}

function isLegacyProjectState(value: unknown): value is LegacyProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<ProjectState>
  return (value as { version?: unknown }).version === 1 && hasSharedProjectFields(project)
}

function hasPouchFields(project: { pouch?: Partial<ProjectState['pouch']> }) {
  return (
    !!project.pouch &&
    isArtworkAsset(project.pouch.faces?.front) &&
    isArtworkAsset(project.pouch.faces?.back) &&
    [
      project.pouch.width,
      project.pouch.height,
      project.pouch.thickness,
      project.pouch.gussetDepth,
    ].every((dimension) =>
      typeof dimension === 'number' && Number.isFinite(dimension) && dimension > 0
    ) &&
    typeof project.pouch.roundedCorners === 'boolean' &&
    ['none', 'zipper', 'spout'].includes(project.pouch.closure ?? '')
  )
}

function isVersion2ProjectState(value: unknown): value is Version2ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<ProjectState>
  return (
    (value as { version?: unknown }).version === 2 &&
    hasSharedProjectFields(project) &&
    (project.packagingType === 'box' || project.packagingType === 'pouch') &&
    hasPouchFields(project)
  )
}

function isVersion3ProjectState(value: unknown): value is Version3ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version3ProjectState>
  return (
    (value as { version?: unknown }).version === 3 &&
    hasSharedProjectFields(project as Partial<ProjectState>) &&
    ['box', 'pouch', 'inner-packaging-1'].includes(project.packagingType ?? '') &&
    hasPouchFields(project) &&
    !!project.innerPackaging1 &&
    isArtworkAsset(project.innerPackaging1.faces?.front) &&
    isArtworkAsset(project.innerPackaging1.faces?.back) &&
    [project.innerPackaging1.width, project.innerPackaging1.height].every(
      (dimension) =>
        typeof dimension === 'number' && Number.isFinite(dimension) && dimension > 0,
    )
  )
}

function isVersion4ProjectState(value: unknown): value is Version4ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version4ProjectState>
  return (
    (value as { version?: unknown }).version === 4 &&
    hasSharedProjectFields(project as Partial<ProjectState>) &&
    ['box', 'pouch', 'inner-packaging-1'].includes(project.packagingType ?? '') &&
    hasPouchFields(project) &&
    !!project.innerPackaging1 &&
    isArtworkAsset(project.innerPackaging1.artwork) &&
    [project.innerPackaging1.width, project.innerPackaging1.height].every(
      (dimension) =>
        typeof dimension === 'number' && Number.isFinite(dimension) && dimension > 0,
    )
  )
}

function isVersion5ProjectState(value: unknown): value is Version5ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version5ProjectState>
  return (
    (value as { version?: unknown }).version === 5 &&
    hasSharedProjectFields(project as Partial<ProjectState>) &&
    ['box', 'pouch', 'inner-packaging-1'].includes(project.packagingType ?? '') &&
    hasPouchFields(project) &&
    !!project.innerPackaging1 &&
    isArtworkAsset(project.innerPackaging1.artwork) &&
    [project.innerPackaging1.width, project.innerPackaging1.height].every(
      (dimension) =>
        typeof dimension === 'number' && Number.isFinite(dimension) && dimension > 0,
    ) &&
    typeof project.innerPackaging1.artworkScale === 'number' &&
    project.innerPackaging1.artworkScale >= 50 &&
    project.innerPackaging1.artworkScale <= 300 &&
    [
      project.innerPackaging1.artworkOffsetX,
      project.innerPackaging1.artworkOffsetY,
    ].every((offset) =>
      typeof offset === 'number' && Number.isFinite(offset) && offset >= -100 && offset <= 100
    )
  )
}

function hasVersion6InnerPackagingFields(
  project: {
    innerPackaging1?: Partial<
      Omit<ProjectState['innerPackaging1'], 'modelRotation'>
    >
  },
) {
  return (
    !!project.innerPackaging1 &&
    isArtworkAsset(project.innerPackaging1.artwork) &&
    [project.innerPackaging1.width, project.innerPackaging1.height].every(
      (dimension) =>
        typeof dimension === 'number' && Number.isFinite(dimension) && dimension > 0,
    ) &&
    typeof project.innerPackaging1.artworkScale === 'number' &&
    project.innerPackaging1.artworkScale >= 50 &&
    project.innerPackaging1.artworkScale <= 300 &&
    [
      project.innerPackaging1.artworkOffsetX,
      project.innerPackaging1.artworkOffsetY,
    ].every((offset) =>
      typeof offset === 'number' && Number.isFinite(offset) && offset >= -100 && offset <= 100
    ) &&
    typeof project.innerPackaging1.artworkRotation === 'number' &&
    project.innerPackaging1.artworkRotation >= -180 &&
    project.innerPackaging1.artworkRotation <= 180 &&
    [
      project.innerPackaging1.artworkStretchX,
      project.innerPackaging1.artworkStretchY,
    ].every((stretch) =>
      typeof stretch === 'number' && Number.isFinite(stretch) && stretch >= 50 && stretch <= 300
    )
  )
}

function isVersion6ProjectState(value: unknown): value is Version6ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version6ProjectState>
  return (
    project.version === 6 &&
    hasSharedProjectFields(project as Partial<ProjectState>) &&
    ['box', 'pouch', 'inner-packaging-1'].includes(project.packagingType ?? '') &&
    hasPouchFields(project) &&
    hasVersion6InnerPackagingFields(project)
  )
}

function isVersion7ProjectState(value: unknown): value is Version7ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version7ProjectState>
  return (
    project.version === 7 &&
    hasSharedProjectFields(project as Partial<ProjectState>) &&
    ['box', 'pouch', 'inner-packaging-1'].includes(project.packagingType ?? '') &&
    hasPouchFields(project) &&
    hasVersion6InnerPackagingFields(project) &&
    [0, 90, 180].includes(project.innerPackaging1?.modelRotation ?? -1)
  )
}

function hasFinishFields<Face extends string>(
  finish: ProjectState['boxFinish'] | ProjectState['pouchFinish'] | undefined,
  faces: readonly Face[],
) {
  if (!finish || !FINISH_KINDS.includes(finish.selectedKind)) return false
  if (!faces.includes(finish.selectedFace as Face)) return false
  return FINISH_KINDS.every((kind) => {
    const layer = finish.layers?.[kind]
    if (!layer || typeof layer.enabled !== 'boolean') return false
    if (!layer.parameters) return false
    const expectedKeys = Object.keys(DEFAULT_FINISH_PARAMETERS[kind]) as FinishParameterKey[]
    const actualKeys = Object.keys(layer.parameters) as FinishParameterKey[]
    if (actualKeys.length !== expectedKeys.length ||
      !expectedKeys.every((key) => isValidFinishParameter(kind, key, layer.parameters[key] ?? Number.NaN))) return false
    const maskKeys = Object.keys(layer.masks)
    if (maskKeys.length !== faces.length || !faces.every((face) => maskKeys.includes(face))) return false
    const masks = layer.masks as Record<string, FinishMaskAsset | null>
    return faces.every((face) => {
      const mask = masks[face]
      if (mask === null) return true
      if (!mask || !isArtworkAsset(mask.asset)) return false
      const { scale, offsetX, offsetY, rotation } = mask.transform ?? {}
      return [scale, offsetX, offsetY, rotation].every((value) =>
        typeof value === 'number' && Number.isFinite(value)
      ) && scale >= 50 && scale <= 300 &&
        offsetX >= -100 && offsetX <= 100 &&
        offsetY >= -100 && offsetY <= 100 &&
        rotation >= -180 && rotation <= 180
    })
  })
}

function hasBoxFinishFields(project: Partial<Omit<ProjectState, 'version'>>) {
  return hasFinishFields(project.boxFinish, BOX_FACES)
}

function isVersion8ProjectState(value: unknown): value is Version8ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version8ProjectState>
  return (
    project.version === 8 &&
    hasSharedProjectFields(project) &&
    ['box', 'pouch', 'inner-packaging-1'].includes(project.packagingType ?? '') &&
    hasPouchFields(project) &&
    hasVersion6InnerPackagingFields(project) &&
    [0, 90, 180].includes(project.innerPackaging1?.modelRotation ?? -1) &&
    hasBoxFinishFields(project)
  )
}

function isVersion9ProjectState(value: unknown): value is Version9ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version9ProjectState>
  return project.version === 9 &&
    isVersion8ProjectState({ ...project, version: 8 }) &&
    hasFinishFields(project.pouchFinish, ['front', 'back'] as const)
}

function hasInnerPackaging2Fields(project: Partial<ProjectState>) {
  const inner = project.innerPackaging2
  if (!inner || !['front', 'back'].includes(inner.selectedFace)) return false
  const faces = ['front', 'back'] as const
  const faceKeys = Object.keys(inner.faces ?? {})
  const transformKeys = Object.keys(inner.transforms ?? {})
  if (faceKeys.length !== faces.length || transformKeys.length !== faces.length ||
    !faces.every((face) => faceKeys.includes(face) && transformKeys.includes(face))) return false
  if (!faces.every((face) => isArtworkAsset(inner.faces[face]))) return false
  if (![inner.width, inner.height].every((value) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0)) return false
  if (![0, 90, 180].includes(inner.modelRotation)) return false
  return faces.every((face) => {
    const transform = inner.transforms[face]
    return !!transform &&
      typeof transform.scale === 'number' && Number.isFinite(transform.scale) &&
      transform.scale >= 50 && transform.scale <= 300 &&
      typeof transform.offsetX === 'number' && Number.isFinite(transform.offsetX) &&
      transform.offsetX >= -100 && transform.offsetX <= 100 &&
      typeof transform.offsetY === 'number' && Number.isFinite(transform.offsetY) &&
      transform.offsetY >= -100 && transform.offsetY <= 100 &&
      typeof transform.rotation === 'number' && Number.isFinite(transform.rotation) &&
      transform.rotation >= -180 && transform.rotation <= 180
  })
}

function isProjectState(value: unknown): value is ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<ProjectState>
  return project.version === 10 &&
    isVersion9ProjectState({ ...project, version: 9 }) &&
    hasInnerPackaging2Fields(project)
}

export function encodeProject(project: ProjectState): string {
  return JSON.stringify(project, null, 2)
}

export function decodeProject(source: string): ProjectState {
  try {
    const value: unknown = JSON.parse(source)
    if (isProjectState(value)) return value
    if (isVersion9ProjectState(value)) {
      return { ...value, version: 10, innerPackaging2: createDefaultInnerPackaging2() }
    }
    if (isVersion8ProjectState(value)) {
      return {
        ...value,
        version: 10,
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
      }
    }
    if (isVersion7ProjectState(value)) {
      return {
        ...value,
        version: 10,
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
      }
    }
    if (isVersion6ProjectState(value)) {
      return {
        ...value,
        version: 10,
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        innerPackaging1: {
          ...value.innerPackaging1,
          modelRotation: 0,
        },
      }
    }
    if (isVersion5ProjectState(value)) {
      return {
        ...value,
        version: 10,
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        innerPackaging1: {
          ...value.innerPackaging1,
          artworkRotation: 0,
          artworkStretchX: 100,
          artworkStretchY: 100,
          modelRotation: 0,
        },
      }
    }
    if (isVersion4ProjectState(value)) {
      return {
        ...value,
        version: 10,
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        innerPackaging1: {
          ...value.innerPackaging1,
          artworkScale: 100,
          artworkOffsetX: 0,
          artworkOffsetY: 0,
          artworkRotation: 0,
          artworkStretchX: 100,
          artworkStretchY: 100,
          modelRotation: 0,
        },
      }
    }
    if (isVersion3ProjectState(value)) {
      const initial = createInitialProject()
      return {
        ...value,
        version: 10,
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        innerPackaging1: {
          artwork:
            value.innerPackaging1.faces.front ??
            value.innerPackaging1.faces.back,
          width: value.innerPackaging1.width,
          height: value.innerPackaging1.height,
          artworkScale: initial.innerPackaging1.artworkScale,
          artworkOffsetX: initial.innerPackaging1.artworkOffsetX,
          artworkOffsetY: initial.innerPackaging1.artworkOffsetY,
          artworkRotation: initial.innerPackaging1.artworkRotation,
          artworkStretchX: initial.innerPackaging1.artworkStretchX,
          artworkStretchY: initial.innerPackaging1.artworkStretchY,
          modelRotation: initial.innerPackaging1.modelRotation,
        },
      }
    }
    if (isVersion2ProjectState(value)) {
      const initial = createInitialProject()
      return {
        ...value,
        version: 10,
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        innerPackaging1: initial.innerPackaging1,
      }
    }
    if (isLegacyProjectState(value)) {
      const initial = createInitialProject()
      return {
        ...initial,
        name: value.name,
        activeTab: value.activeTab,
        faces: value.faces,
        box: value.box,
        camera: value.camera,
      }
    }
  } catch {
    // Use one user-facing error for malformed and incompatible files.
  }
  throw new Error('不是有效的 BoxLab 项目文件')
}
