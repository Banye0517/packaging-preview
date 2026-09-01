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
export type PackagingType = 'box' | 'pouch' | 'inner-packaging-1' | 'inner-packaging-2' | 'hanging-tissue'
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

export interface ProjectState {
  version: 15
  name: string
  activeTab: 'artwork' | 'finish' | 'box' | 'camera'
  packagingType: PackagingType
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
  boxFinish: import('../finish/finishTypes').BoxFinishState
  pouchFinish: import('../finish/finishTypes').PouchFinishState
  camera: {
    autoRotate: boolean
  }
}
