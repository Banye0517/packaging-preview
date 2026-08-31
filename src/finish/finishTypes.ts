import { BOX_FACES, type ArtworkAsset, type BoxFace, type PouchFace } from '../app/types'

export const FINISH_KINDS = [
  'gold-foil',
  'silver-foil',
  'holographic',
  'spot-uv',
  'emboss-deboss',
] as const

export type FinishKind = (typeof FINISH_KINDS)[number]
export type FinishParameterKey = 'roughness' | 'grain' | 'normalStrength' | 'iridescence' | 'gloss' | 'relief'
export type FinishTransformKey = 'scale' | 'offsetX' | 'offsetY' | 'rotation'

export interface FinishMaskTransform {
  scale: number
  offsetX: number
  offsetY: number
  rotation: number
}

export interface FinishMaskAsset {
  asset: ArtworkAsset
  transform: FinishMaskTransform
}

export interface FinishLayerState<Face extends string = BoxFace> {
  enabled: boolean
  parameters: Partial<Record<FinishParameterKey, number>>
  masks: Record<Face, FinishMaskAsset | null>
}

export interface FinishState<Face extends string> {
  selectedKind: FinishKind
  selectedFace: Face
  layers: Record<FinishKind, FinishLayerState<Face>>
}
export type BoxFinishState = FinishState<BoxFace>
export type PouchFinishState = FinishState<PouchFace>

export const DEFAULT_FINISH_TRANSFORM: FinishMaskTransform = {
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
}

export const DEFAULT_FINISH_PARAMETERS: Record<FinishKind, FinishLayerState['parameters']> = {
  'gold-foil': { roughness: 0.08, grain: 2, normalStrength: 100, relief: 1 },
  'silver-foil': { roughness: 0.08, grain: 2, normalStrength: 100, relief: 1 },
  holographic: { roughness: 0.11, iridescence: 100, relief: 2.95 },
  'spot-uv': { roughness: 0.06, gloss: 100, relief: 0 },
  'emboss-deboss': { roughness: 0.34, relief: 2 },
}

export const FINISH_PARAMETER_RANGES: Record<FinishKind, Partial<Record<FinishParameterKey, { min: number; max: number }>>> = {
  'gold-foil': { roughness: { min: 0, max: 1 }, grain: { min: 0, max: 100 }, normalStrength: { min: 0, max: 100 }, relief: { min: -5, max: 5 } },
  'silver-foil': { roughness: { min: 0, max: 1 }, grain: { min: 0, max: 100 }, normalStrength: { min: 0, max: 100 }, relief: { min: -5, max: 5 } },
  holographic: { roughness: { min: 0, max: 1 }, iridescence: { min: 0, max: 100 }, relief: { min: -5, max: 5 } },
  'spot-uv': { roughness: { min: 0, max: 1 }, gloss: { min: 0, max: 100 }, relief: { min: -5, max: 5 } },
  'emboss-deboss': { roughness: { min: 0, max: 1 }, relief: { min: -5, max: 5 } },
}

export function isValidFinishParameter(kind: FinishKind, key: FinishParameterKey, value: number) {
  const range = FINISH_PARAMETER_RANGES[kind][key]
  return Boolean(range && Number.isFinite(value) && value >= range.min && value <= range.max)
}

function createEmptyMasks<Face extends string>(faces: readonly Face[]): Record<Face, FinishMaskAsset | null> {
  return Object.fromEntries(faces.map((face) => [face, null])) as Record<Face, FinishMaskAsset | null>
}

function createDefaultFinish<Face extends string>(faces: readonly Face[], selectedFace: Face): FinishState<Face> {
  return {
    selectedKind: 'gold-foil',
    selectedFace,
    layers: Object.fromEntries(FINISH_KINDS.map((kind) => [kind, {
      enabled: true,
      parameters: { ...DEFAULT_FINISH_PARAMETERS[kind] },
      masks: createEmptyMasks(faces),
    }])) as FinishState<Face>['layers'],
  }
}

export function createDefaultBoxFinish(): BoxFinishState { return createDefaultFinish(BOX_FACES, 'front') }
export function createDefaultPouchFinish(): PouchFinishState { return createDefaultFinish(['front', 'back'] as const, 'front') }
