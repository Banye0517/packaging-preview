export const BOX_FACES = [
  'top',
  'left',
  'front',
  'right',
  'back',
  'bottom',
] as const

export type BoxFace = (typeof BOX_FACES)[number]
export type PouchFace = 'front' | 'back'
export const HANGING_TISSUE_FACES = ['front', 'back', 'left', 'right'] as const
export type HangingTissueFace = (typeof HANGING_TISSUE_FACES)[number]
export type PackagingType = 'box' | 'pouch' | 'inner-packaging-1' | 'inner-packaging-2' | 'hanging-tissue' | 'face-tissue' | 'wet-tissue' | 'wash-tissue'
export type CompositionLayout = 'hero' | 'family' | 'cluster' | 'grid'
export type PouchClosure = 'none' | 'zipper' | 'spout'
export type InnerPackagingModelRotation = 0 | 90 | 180
export type ImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp'

export interface ArtworkAsset {
  id: string
  name: string
  mimeType: ImageMimeType
  width: number
  height: number
  previewUrl: string
}

export interface PouchState {
  faces: Record<PouchFace, ArtworkAsset | null>
  width: number
  height: number
  thickness: number
  gussetDepth: number
  roundedCorners: boolean
  closure: PouchClosure
}

export interface InnerPackaging1State {
  artwork: ArtworkAsset | null
  width: number
  height: number
  artworkScale: number
  artworkOffsetX: number
  artworkOffsetY: number
  artworkRotation: number
  artworkStretchX: number
  artworkStretchY: number
  modelRotation: InnerPackagingModelRotation
}

export interface ArtworkTransform {
  scale: number
  offsetX: number
  offsetY: number
  rotation: number
  stretchX: number
  stretchY: number
}

export interface InnerPackaging2State {
  faces: Record<PouchFace, ArtworkAsset | null>
  transforms: Record<PouchFace, ArtworkTransform>
  selectedFace: PouchFace
  width: number
  height: number
  modelRotation: InnerPackagingModelRotation
}

export interface HangingTissueDimensions {
  width: number
  height: number
  depth: number
}

export interface HangingTissueState {
  faces: Record<HangingTissueFace, ArtworkAsset | null>
  artworkReferenceDimensions: Record<HangingTissueFace, HangingTissueDimensions | null>
  transforms: Record<HangingTissueFace, ArtworkTransform>
  selectedFace: HangingTissueFace
  width: number
  height: number
  depth: number
  modelRotation: InnerPackagingModelRotation
  showPulledSheet: boolean
}

export interface FaceTissueDimensions {
  width: number
  height: number
  thickness: number
}

export interface FaceTissueState {
  artwork: ArtworkAsset | null
  width: number
  height: number
  thickness: number
  radius: number
  artworkReferenceDimensions: FaceTissueDimensions | null
  artworkTransform: ArtworkTransform
  modelRotation: InnerPackagingModelRotation
  showTopSheet: boolean
}

export type WetTissueArtworkSlot = 'body' | 'lid'
export type WetTissueModelState = 'open' | 'closed'

export interface WetTissueDimensions {
  width: number
  height: number
  thickness: number
}

export interface WetTissueState {
  artworks: Record<WetTissueArtworkSlot, ArtworkAsset | null>
  artworkReferenceDimensions: Record<WetTissueArtworkSlot, WetTissueDimensions | null>
  transforms: Record<WetTissueArtworkSlot, ArtworkTransform>
  selectedArtwork: WetTissueArtworkSlot
  width: number
  height: number
  thickness: number
  modelState: WetTissueModelState
  modelRotation: InnerPackagingModelRotation
  showTopSheet: boolean
}

export interface PackageInstance {
  id: string
  packagingType: PackagingType
  manualTransform: null
  faces: Record<BoxFace, ArtworkAsset | null>
  box: {
    width: number
    height: number
    depth: number
    radius: number
  }
  pouch: PouchState
  innerPackaging1: InnerPackaging1State
  innerPackaging2: InnerPackaging2State
  hangingTissue: HangingTissueState
  faceTissue: FaceTissueState
  wetTissue: WetTissueState
  washTissue: FaceTissueState
  boxFinish: import('../finish/finishTypes').BoxFinishState
  pouchFinish: import('../finish/finishTypes').PouchFinishState
}

export interface ProjectState {
  version: 18
  name: string
  activeTab: 'artwork' | 'finish' | 'box' | 'camera'
  instances: PackageInstance[]
  selectedInstanceId: string
  layout: CompositionLayout
  heroInstanceId: string | null
  camera: {
    autoRotate: boolean
    lightingIntensity: number
  }
}
