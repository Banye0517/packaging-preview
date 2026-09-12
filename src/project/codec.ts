import {
  BOX_FACES,
  type ArtworkAsset,
  type ImageMimeType,
  type PackageInstance,
  type PouchFace,
  type ProjectState,
} from '../app/types'
import {
  createDefaultHangingTissue,
  createDefaultInnerPackaging2,
  createDefaultFaceTissue,
  createDefaultWetTissue,
  createDefaultWashTissue,
} from '../app/projectReducer'
import { createPackageInstance } from '../app/packageFactory'
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

interface Version17ProjectState extends Omit<PackageInstance, 'id' | 'manualTransform'> {
  version: 17
  name: string
  activeTab: ProjectState['activeTab']
  camera: ProjectState['camera']
}

interface LegacyProjectState extends Omit<Version17ProjectState, 'version' | 'packagingType' | 'pouch' | 'innerPackaging1' | 'innerPackaging2' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue' | 'boxFinish' | 'pouchFinish'> {
  version: 1
}

interface Version2ProjectState extends Omit<Version17ProjectState, 'version' | 'innerPackaging1' | 'innerPackaging2' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue' | 'boxFinish' | 'pouchFinish'> {
  version: 2
}

interface Version3ProjectState extends Omit<Version17ProjectState, 'version' | 'innerPackaging1' | 'innerPackaging2' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue' | 'boxFinish' | 'pouchFinish'> {
  version: 3
  innerPackaging1: {
    faces: Record<PouchFace, ArtworkAsset | null>
    width: number
    height: number
  }
}

interface Version4ProjectState extends Omit<Version17ProjectState, 'version' | 'innerPackaging1' | 'innerPackaging2' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue' | 'boxFinish' | 'pouchFinish'> {
  version: 4
  innerPackaging1: {
    artwork: ArtworkAsset | null
    width: number
    height: number
  }
}

interface Version5ProjectState extends Omit<Version17ProjectState, 'version' | 'innerPackaging1' | 'innerPackaging2' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue' | 'boxFinish' | 'pouchFinish'> {
  version: 5
  innerPackaging1: Omit<
    Version17ProjectState['innerPackaging1'],
    'artworkRotation' | 'artworkStretchX' | 'artworkStretchY' | 'modelRotation'
  >
}

interface Version6ProjectState extends Omit<Version17ProjectState, 'version' | 'innerPackaging1' | 'innerPackaging2' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue' | 'boxFinish' | 'pouchFinish'> {
  version: 6
  innerPackaging1: Omit<Version17ProjectState['innerPackaging1'], 'modelRotation'>
}

interface Version7ProjectState extends Omit<Version17ProjectState, 'version' | 'innerPackaging2' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue' | 'boxFinish' | 'pouchFinish'> {
  version: 7
}
interface Version8ProjectState extends Omit<Version17ProjectState, 'version' | 'innerPackaging2' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue' | 'pouchFinish'> {
  version: 8
}

interface Version9ProjectState extends Omit<Version17ProjectState, 'version' | 'innerPackaging2' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue'> {
  version: 9
}

interface Version16ProjectState extends Omit<Version17ProjectState, 'version' | 'camera'> {
  version: 16
  camera: { autoRotate: boolean }
}

function hasSharedProjectFields(project: Partial<Omit<Version17ProjectState, 'version'>>) {
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
  const project = value as Partial<Version17ProjectState>
  return (value as { version?: unknown }).version === 1 && hasSharedProjectFields(project)
}

function hasPouchFields(project: { pouch?: Partial<Version17ProjectState['pouch']> }) {
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
  const project = value as Partial<Version17ProjectState>
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
    hasSharedProjectFields(project as Partial<Version17ProjectState>) &&
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
    hasSharedProjectFields(project as Partial<Version17ProjectState>) &&
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
    hasSharedProjectFields(project as Partial<Version17ProjectState>) &&
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
      Omit<Version17ProjectState['innerPackaging1'], 'modelRotation'>
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
    hasSharedProjectFields(project as Partial<Version17ProjectState>) &&
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
    hasSharedProjectFields(project as Partial<Version17ProjectState>) &&
    ['box', 'pouch', 'inner-packaging-1'].includes(project.packagingType ?? '') &&
    hasPouchFields(project) &&
    hasVersion6InnerPackagingFields(project) &&
    [0, 90, 180].includes(project.innerPackaging1?.modelRotation ?? -1)
  )
}

function hasFinishFields<Face extends string>(
  finish: Version17ProjectState['boxFinish'] | Version17ProjectState['pouchFinish'] | undefined,
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

function hasBoxFinishFields(project: Partial<Omit<Version17ProjectState, 'version'>>) {
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

function hasInnerPackaging2Fields(
  project: Partial<Version17ProjectState>,
  requireStretch = true,
) {
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
    const hasBaseTransform = !!transform &&
      typeof transform.scale === 'number' && Number.isFinite(transform.scale) &&
      transform.scale >= 50 && transform.scale <= 300 &&
      typeof transform.offsetX === 'number' && Number.isFinite(transform.offsetX) &&
      transform.offsetX >= -100 && transform.offsetX <= 100 &&
      typeof transform.offsetY === 'number' && Number.isFinite(transform.offsetY) &&
      transform.offsetY >= -100 && transform.offsetY <= 100 &&
      typeof transform.rotation === 'number' && Number.isFinite(transform.rotation) &&
      transform.rotation >= -180 && transform.rotation <= 180
    if (!hasBaseTransform) return false
    if (!requireStretch) return true
    return [transform.stretchX, transform.stretchY].every((stretch) =>
      typeof stretch === 'number' && Number.isFinite(stretch) &&
      stretch >= 50 && stretch <= 300
    )
  })
}

function hasHangingTissueFields(
  project: Partial<Version17ProjectState>,
  requireDepth = true,
  requireReferences = true,
) {
  const tissue = project.hangingTissue
  const faces = ['front', 'back', 'left', 'right'] as const
  if (!tissue || !faces.includes(tissue.selectedFace)) return false
  if (Object.keys(tissue.faces ?? {}).length !== faces.length ||
    Object.keys(tissue.transforms ?? {}).length !== faces.length ||
    !faces.every((face) => isArtworkAsset(tissue.faces[face]) && !!tissue.transforms[face])) return false
  const dimensions = requireDepth ? [tissue.width, tissue.height, tissue.depth] : [tissue.width, tissue.height]
  if (!dimensions.every((value) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0) ||
    ![0, 90, 180].includes(tissue.modelRotation) ||
    typeof tissue.showPulledSheet !== 'boolean') return false
  if (requireReferences) {
    const references = tissue.artworkReferenceDimensions
    if (!references || Object.keys(references).length !== faces.length ||
      !faces.every((face) => {
        const reference = references[face]
        return reference === null || [reference.width, reference.height, reference.depth].every(
          (value) => typeof value === 'number' && Number.isFinite(value) && value > 0,
        )
      })) return false
  }
  return faces.every((face) => {
    const transform = tissue.transforms[face]
    return transform.scale >= 50 && transform.scale <= 300 &&
      transform.offsetX >= -100 && transform.offsetX <= 100 &&
      transform.offsetY >= -100 && transform.offsetY <= 100 &&
      transform.rotation >= -180 && transform.rotation <= 180 &&
      transform.stretchX >= 50 && transform.stretchX <= 300 &&
      transform.stretchY >= 50 && transform.stretchY <= 300
  })
}

type Version11ProjectState = Omit<Version17ProjectState, 'version' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue'> & { version: 11 }

type Version12ProjectState = Omit<Version17ProjectState, 'version' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue'> & {
  version: 12
  hangingTissue: Omit<Version17ProjectState['hangingTissue'], 'depth' | 'artworkReferenceDimensions'>
}

type Version13ProjectState = Omit<Version17ProjectState, 'version' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue'> & {
  version: 13
  hangingTissue: Omit<Version17ProjectState['hangingTissue'], 'artworkReferenceDimensions'>
}

type Version14ProjectState = Omit<Version17ProjectState, 'version' | 'hangingTissue' | 'faceTissue' | 'wetTissue' | 'washTissue'> & {
  version: 14
  hangingTissue: Version17ProjectState['hangingTissue']
}

type Version15ProjectState = Omit<Version17ProjectState, 'version' | 'faceTissue' | 'washTissue'> & {
  version: 15
}

function isVersion11ProjectState(value: unknown): value is Version11ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version11ProjectState>
  return project.version === 11 &&
    isVersion9ProjectState({ ...project, version: 9 } as Version9ProjectState) &&
    hasInnerPackaging2Fields(project as Partial<Version17ProjectState>)
}

function isVersion12ProjectState(value: unknown): value is Version12ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version12ProjectState>
  return project.version === 12 &&
    isVersion11ProjectState({ ...project, version: 11 }) &&
    hasHangingTissueFields(project as Partial<Version17ProjectState>, false, false)
}

function isVersion13ProjectState(value: unknown): value is Version13ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version13ProjectState>
  return project.version === 13 &&
    isVersion12ProjectState({ ...project, version: 12 }) &&
    hasHangingTissueFields(project as Partial<Version17ProjectState>, true, false)
}

function isVersion14ProjectState(value: unknown): value is Version14ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version14ProjectState>
  return project.version === 14 &&
    isVersion13ProjectState({ ...project, version: 13 }) &&
    hasHangingTissueFields(project as Partial<Version17ProjectState>, true, true)
}

function hasFaceTissueFields(project: Partial<Version17ProjectState>) {
  const faceTissue = project.faceTissue as (Partial<Version17ProjectState['faceTissue']> & {
    radius?: unknown
    artworkReferenceDimensions?: unknown
  }) | undefined
  if (!faceTissue || !isArtworkAsset(faceTissue.artwork)) return false
  if (![faceTissue.width, faceTissue.height, faceTissue.thickness].every((value) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0,
  )) return false
  if (![0, 90, 180].includes(faceTissue.modelRotation ?? -1) ||
    typeof faceTissue.showTopSheet !== 'boolean') return false
  if (faceTissue.radius !== undefined &&
    (typeof faceTissue.radius !== 'number' || !Number.isFinite(faceTissue.radius) ||
      faceTissue.radius < 0 || faceTissue.radius > 40)) return false
  if (faceTissue.artworkReferenceDimensions !== undefined &&
    faceTissue.artworkReferenceDimensions !== null) {
    const reference = faceTissue.artworkReferenceDimensions as unknown as Record<string, unknown>
    if (![reference.width, reference.height, reference.thickness].every((value) =>
      typeof value === 'number' && Number.isFinite(value) && value > 0,
    )) return false
  }
  const transform = faceTissue.artworkTransform
  return !!transform &&
    transform.scale >= 50 && transform.scale <= 300 &&
    transform.offsetX >= -100 && transform.offsetX <= 100 &&
    transform.offsetY >= -100 && transform.offsetY <= 100 &&
    transform.rotation >= -180 && transform.rotation <= 180 &&
    transform.stretchX >= 50 && transform.stretchX <= 300 &&
    transform.stretchY >= 50 && transform.stretchY <= 300 &&
    [transform.scale, transform.offsetX, transform.offsetY, transform.rotation,
      transform.stretchX, transform.stretchY].every((value) =>
      typeof value === 'number' && Number.isFinite(value),
    )
}

function isVersion15ProjectState(value: unknown): value is Version15ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version15ProjectState>
  return project.version === 15 &&
    isVersion14ProjectState({ ...project, version: 14 })
}

function hasWetTissueFields(project: Partial<Version17ProjectState>) {
  const tissue = project.wetTissue
  const slots = ['body', 'lid'] as const
  if (!tissue || !slots.includes(tissue.selectedArtwork) ||
    Object.keys(tissue.artworks ?? {}).length !== slots.length ||
    Object.keys(tissue.transforms ?? {}).length !== slots.length ||
    Object.keys(tissue.artworkReferenceDimensions ?? {}).length !== slots.length ||
    !slots.every((slot) => isArtworkAsset(tissue.artworks[slot]) && !!tissue.transforms[slot])) return false
  if (![tissue.width, tissue.height, tissue.thickness].every((value) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0) ||
    !['open', 'closed'].includes(tissue.modelState) ||
    ![0, 90, 180].includes(tissue.modelRotation) ||
    typeof tissue.showTopSheet !== 'boolean') return false
  if (!slots.every((slot) => {
    const reference = tissue.artworkReferenceDimensions[slot]
    return reference === null || [reference.width, reference.height, reference.thickness].every((value) =>
      typeof value === 'number' && Number.isFinite(value) && value > 0)
  })) return false
  return slots.every((slot) => {
    const transform = tissue.transforms[slot]
    return [transform.scale, transform.offsetX, transform.offsetY, transform.rotation,
      transform.stretchX, transform.stretchY].every((value) => typeof value === 'number' && Number.isFinite(value)) &&
      transform.scale >= 50 && transform.scale <= 300 &&
      transform.offsetX >= -100 && transform.offsetX <= 100 &&
      transform.offsetY >= -100 && transform.offsetY <= 100 &&
      transform.rotation >= -180 && transform.rotation <= 180 &&
      transform.stretchX >= 50 && transform.stretchX <= 300 &&
      transform.stretchY >= 50 && transform.stretchY <= 300
  })
}

function hasWashTissueFields(project: Partial<Version17ProjectState>) {
  const tissue = project.washTissue
  if (!tissue || !isArtworkAsset(tissue.artwork)) return false
  if (![tissue.width, tissue.height, tissue.thickness].every((value) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0)) return false
  if (![0, 90, 180].includes(tissue.modelRotation) || typeof tissue.showTopSheet !== 'boolean') return false
  const reference = tissue.artworkReferenceDimensions
  if (reference !== null && ![reference.width, reference.height, reference.thickness].every((value) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0)) return false
  const transform = tissue.artworkTransform
  return !!transform &&
    [transform.scale, transform.offsetX, transform.offsetY, transform.rotation,
      transform.stretchX, transform.stretchY].every((value) => typeof value === 'number' && Number.isFinite(value)) &&
    transform.scale >= 50 && transform.scale <= 300 &&
    transform.offsetX >= -100 && transform.offsetX <= 100 &&
    transform.offsetY >= -100 && transform.offsetY <= 100 &&
    transform.rotation >= -180 && transform.rotation <= 180 &&
    transform.stretchX >= 50 && transform.stretchX <= 300 &&
    transform.stretchY >= 50 && transform.stretchY <= 300
}

function isVersion17ProjectState(value: unknown): value is Version17ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Version17ProjectState>
  return project.version === 17 &&
    hasSharedProjectFields(project) &&
    typeof project.camera?.lightingIntensity === 'number' &&
    Number.isFinite(project.camera.lightingIntensity) &&
    project.camera.lightingIntensity >= -100 &&
    project.camera.lightingIntensity <= 100 &&
    ['box', 'pouch', 'inner-packaging-1', 'inner-packaging-2', 'hanging-tissue', 'face-tissue', 'wet-tissue', 'wash-tissue'].includes(project.packagingType ?? '') &&
    hasPouchFields(project) &&
    hasVersion6InnerPackagingFields(project) &&
    hasInnerPackaging2Fields(project) &&
    hasHangingTissueFields(project) &&
    hasFaceTissueFields(project) &&
    hasBoxFinishFields(project) &&
    hasFinishFields(project.pouchFinish, ['front', 'back'] as const) &&
    (project.wetTissue === undefined || hasWetTissueFields(project)) &&
    (project.washTissue === undefined || hasWashTissueFields(project))
}

function isProjectState(value: unknown): value is ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<ProjectState>
  if (project.version !== 18 || typeof project.name !== 'string' || !TABS.has(project.activeTab ?? '')) return false
  if (!Array.isArray(project.instances) || project.instances.length < 1 || project.instances.length > 6) return false
  if (!['hero', 'family', 'cluster', 'grid'].includes(project.layout ?? '')) return false
  if (typeof project.selectedInstanceId !== 'string' || !project.instances.some((item) => item.id === project.selectedInstanceId)) return false
  if (project.heroInstanceId !== null && !project.instances.some((item) => item.id === project.heroInstanceId)) return false
  if (new Set(project.instances.map((item) => item.id)).size !== project.instances.length) return false
  if (typeof project.camera?.autoRotate !== 'boolean' || typeof project.camera.lightingIntensity !== 'number' ||
      !Number.isFinite(project.camera.lightingIntensity) || project.camera.lightingIntensity < -100 || project.camera.lightingIntensity > 100) return false
  return project.instances.every((instance) => {
    if (!instance || typeof instance.id !== 'string' || instance.id.length === 0 || instance.manualTransform !== null) return false
    return isVersion17ProjectState({
      ...instance,
      version: 17,
      name: project.name!,
      activeTab: project.activeTab!,
      camera: project.camera!,
    })
  })
}

function isVersion16ProjectState(value: unknown): value is Version16ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Version16ProjectState
  return project.version === 16 &&
    isVersion17ProjectState({
      ...project,
      version: 17,
      camera: { ...project.camera, lightingIntensity: 0 },
    })
}

function addHangingTissueArtworkReferences(
  tissue: Version13ProjectState['hangingTissue'],
): Version17ProjectState['hangingTissue'] {
  const dimensions = { width: tissue.width, height: tissue.height, depth: tissue.depth }
  return {
    ...tissue,
    artworkReferenceDimensions: {
      front: tissue.faces.front ? { ...dimensions } : null,
      back: tissue.faces.back ? { ...dimensions } : null,
      left: tissue.faces.left ? { ...dimensions } : null,
      right: tissue.faces.right ? { ...dimensions } : null,
    },
  }
}

function isVersion10ProjectState(value: unknown) {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Omit<Version17ProjectState, 'version'>> & { version?: number }
  return project.version === 10 &&
    isVersion9ProjectState({ ...project, version: 9 }) &&
    hasInnerPackaging2Fields(project as Partial<Version17ProjectState>, false)
}

function addInnerPackaging2Stretch(value: Record<string, unknown>): Version17ProjectState {
  const project = value as unknown as Omit<Version17ProjectState, 'version'> & { version: 10 }
  return {
    ...project,
    version: 17,
    camera: { ...project.camera, lightingIntensity: 0 },
    innerPackaging2: {
      ...project.innerPackaging2,
      transforms: {
        front: { ...project.innerPackaging2.transforms.front, stretchX: 100, stretchY: 100 },
        back: { ...project.innerPackaging2.transforms.back, stretchX: 100, stretchY: 100 },
      },
    },
    hangingTissue: createDefaultHangingTissue(),
    faceTissue: createDefaultFaceTissue(),
    wetTissue: createDefaultWetTissue(),
    washTissue: createDefaultWashTissue(),
  }
}

export function encodeProject(project: ProjectState): string {
  return JSON.stringify(project, null, 2)
}

function decodeLegacyProjectValue(value: unknown): Version17ProjectState | null {
    if (isVersion17ProjectState(value)) {
      const hangingTissue = { ...value.hangingTissue } as Version17ProjectState['hangingTissue'] & { radius?: unknown }
      delete hangingTissue.radius
      const faceTissue = {
        ...value.faceTissue,
        radius: value.faceTissue.radius ?? 0,
        artworkReferenceDimensions: value.faceTissue.artworkReferenceDimensions ?? (
          value.faceTissue.artwork ? {
            width: value.faceTissue.width,
            height: value.faceTissue.height,
            thickness: value.faceTissue.thickness,
          } : null
        ),
      }
      return {
        ...value,
        hangingTissue,
        faceTissue,
        wetTissue: value.wetTissue ?? createDefaultWetTissue(),
        washTissue: value.washTissue ?? createDefaultWashTissue(),
      }
    }
    if (isVersion16ProjectState(value)) {
      return {
        ...value,
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        wetTissue: value.wetTissue ?? createDefaultWetTissue(),
        washTissue: value.washTissue ?? createDefaultWashTissue(),
      }
    }
    if (isVersion15ProjectState(value)) {
      const hangingTissue = { ...value.hangingTissue } as Version17ProjectState['hangingTissue'] & { radius?: unknown }
      delete hangingTissue.radius
      return {
        ...value,
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        hangingTissue,
        faceTissue: createDefaultFaceTissue(),
        wetTissue: createDefaultWetTissue(),
        washTissue: createDefaultWashTissue(),
      }
    }
    if (isVersion14ProjectState(value)) {
      return {
        ...value,
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        hangingTissue: value.hangingTissue,
        faceTissue: createDefaultFaceTissue(),
        wetTissue: createDefaultWetTissue(),
        washTissue: createDefaultWashTissue(),
      }
    }
    if (isVersion13ProjectState(value)) {
      return {
        ...value,
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        hangingTissue: addHangingTissueArtworkReferences(value.hangingTissue),
        faceTissue: createDefaultFaceTissue(),
        wetTissue: createDefaultWetTissue(),
        washTissue: createDefaultWashTissue(),
      }
    }
    if (isVersion12ProjectState(value)) {
      const hangingTissue = { ...value.hangingTissue, depth: 80 }
      return {
        ...value,
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        hangingTissue: addHangingTissueArtworkReferences(hangingTissue),
        faceTissue: createDefaultFaceTissue(),
        wetTissue: createDefaultWetTissue(),
        washTissue: createDefaultWashTissue(),
      }
    }
    if (isVersion11ProjectState(value)) {
      return { ...value, version: 17, camera: { ...value.camera, lightingIntensity: 0 }, hangingTissue: createDefaultHangingTissue(), faceTissue: createDefaultFaceTissue(), wetTissue: createDefaultWetTissue(), washTissue: createDefaultWashTissue() }
    }
    if (isVersion10ProjectState(value)) {
      return addInnerPackaging2Stretch(value as Record<string, unknown>)
    }
    if (isVersion9ProjectState(value)) {
      return { ...value, version: 17, camera: { ...value.camera, lightingIntensity: 0 }, innerPackaging2: createDefaultInnerPackaging2(), hangingTissue: createDefaultHangingTissue(), faceTissue: createDefaultFaceTissue(), wetTissue: createDefaultWetTissue(), washTissue: createDefaultWashTissue() }
    }
    if (isVersion8ProjectState(value)) {
      return {
        ...value,
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        hangingTissue: createDefaultHangingTissue(),
        faceTissue: createDefaultFaceTissue(),
        wetTissue: createDefaultWetTissue(),
        washTissue: createDefaultWashTissue(),
      }
    }
    if (isVersion7ProjectState(value)) {
      return {
        ...value,
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        hangingTissue: createDefaultHangingTissue(),
        faceTissue: createDefaultFaceTissue(),
        wetTissue: createDefaultWetTissue(),
        washTissue: createDefaultWashTissue(),
      }
    }
    if (isVersion6ProjectState(value)) {
      return {
        ...value,
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        hangingTissue: createDefaultHangingTissue(),
        faceTissue: createDefaultFaceTissue(),
        wetTissue: createDefaultWetTissue(),
        washTissue: createDefaultWashTissue(),
        innerPackaging1: {
          ...value.innerPackaging1,
          modelRotation: 0,
        },
      }
    }
    if (isVersion5ProjectState(value)) {
      return {
        ...value,
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        hangingTissue: createDefaultHangingTissue(),
        faceTissue: createDefaultFaceTissue(),
        wetTissue: createDefaultWetTissue(),
        washTissue: createDefaultWashTissue(),
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
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        hangingTissue: createDefaultHangingTissue(),
        faceTissue: createDefaultFaceTissue(),
        wetTissue: createDefaultWetTissue(),
        washTissue: createDefaultWashTissue(),
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
      const initial = createPackageInstance('box', 'legacy-default')
      return {
        ...value,
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        hangingTissue: createDefaultHangingTissue(),
        faceTissue: createDefaultFaceTissue(),
        wetTissue: createDefaultWetTissue(),
        washTissue: createDefaultWashTissue(),
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
      const initial = createPackageInstance('box', 'legacy-default')
      return {
        ...value,
        version: 17,
        camera: { ...value.camera, lightingIntensity: 0 },
        boxFinish: createDefaultBoxFinish(),
        pouchFinish: createDefaultPouchFinish(),
        innerPackaging2: createDefaultInnerPackaging2(),
        hangingTissue: createDefaultHangingTissue(),
        faceTissue: createDefaultFaceTissue(),
        wetTissue: createDefaultWetTissue(),
        washTissue: createDefaultWashTissue(),
        innerPackaging1: initial.innerPackaging1,
      }
    }
    if (isLegacyProjectState(value)) {
      const initial = createPackageInstance('box', 'legacy-default')
      return {
        version: 17,
        name: value.name,
        activeTab: value.activeTab,
        packagingType: initial.packagingType,
        faces: value.faces,
        box: value.box,
        pouch: initial.pouch,
        innerPackaging1: initial.innerPackaging1,
        innerPackaging2: initial.innerPackaging2,
        hangingTissue: initial.hangingTissue,
        faceTissue: initial.faceTissue,
        wetTissue: initial.wetTissue,
        washTissue: initial.washTissue,
        boxFinish: initial.boxFinish,
        pouchFinish: initial.pouchFinish,
        camera: { ...value.camera, lightingIntensity: 0 },
      }
    }
    return null
}

function migrateVersion17(project: Version17ProjectState): ProjectState {
  const { version: _version, name, activeTab, camera, ...packageFields } = project
  return {
    version: 18,
    name,
    activeTab,
    instances: [{
      id: 'package-1',
      manualTransform: null,
      ...packageFields,
    }],
    selectedInstanceId: 'package-1',
    layout: 'family',
    heroInstanceId: null,
    camera,
  }
}

export function decodeProject(source: string): ProjectState {
  try {
    const value: unknown = JSON.parse(source)
    if (isProjectState(value)) return value
    const legacy = decodeLegacyProjectValue(value)
    if (legacy) return migrateVersion17(legacy)
  } catch {
    // Use one user-facing error for malformed and incompatible files.
  }
  throw new Error('不是有效的 BoxLab 项目文件')
}
