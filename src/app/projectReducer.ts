import {
  BOX_FACES,
  type ArtworkAsset,
  type ArtworkTransform,
  type BoxFace,
  type HangingTissueFace,
  type PackagingType,
  type InnerPackagingModelRotation,
  type PouchClosure,
  type PouchFace,
  type ProjectState,
} from './types'
import {
  DEFAULT_FINISH_PARAMETERS,
  DEFAULT_FINISH_TRANSFORM,
  createDefaultBoxFinish,
  createDefaultPouchFinish,
  isValidFinishParameter,
  type FinishKind,
  type FinishParameterKey,
  type FinishTransformKey,
} from '../finish/finishTypes'

export type ProjectAction =
  | { type: 'face/set'; face: BoxFace; asset: ArtworkAsset }
  | { type: 'face/remove'; face: BoxFace }
  | { type: 'box/set'; key: keyof ProjectState['box']; value: number }
  | { type: 'packaging/type'; value: PackagingType }
  | { type: 'pouch/face-set'; face: PouchFace; asset: ArtworkAsset }
  | { type: 'pouch/face-remove'; face: PouchFace }
  | {
      type: 'pouch/set'
      key: 'width' | 'height' | 'thickness' | 'gussetDepth'
      value: number
    }
  | { type: 'pouch/set'; key: 'roundedCorners'; value: boolean }
  | { type: 'pouch/set'; key: 'closure'; value: PouchClosure }
  | { type: 'inner-packaging-1/artwork-set'; asset: ArtworkAsset }
  | { type: 'inner-packaging-1/artwork-remove' }
  | {
      type: 'inner-packaging-1/transform-set'
      key:
        | 'artworkScale'
        | 'artworkOffsetX'
        | 'artworkOffsetY'
        | 'artworkRotation'
        | 'artworkStretchX'
        | 'artworkStretchY'
      value: number
    }
  | { type: 'inner-packaging-1/transform-reset' }
  | {
      type: 'inner-packaging-1/rotation-set'
      value: InnerPackagingModelRotation | number
    }
  | {
      type: 'inner-packaging-1/set'
      key: 'width' | 'height'
      value: number
    }
  | { type: 'inner-packaging-2/face-set'; face: PouchFace; asset: ArtworkAsset }
  | { type: 'inner-packaging-2/face-remove'; face: PouchFace }
  | { type: 'inner-packaging-2/select-face'; face: PouchFace }
  | {
      type: 'inner-packaging-2/transform-set'
      face: PouchFace
      key: keyof ArtworkTransform
      value: number
    }
  | { type: 'inner-packaging-2/transform-reset'; face: PouchFace }
  | {
      type: 'inner-packaging-2/rotation-set'
      value: InnerPackagingModelRotation | number
    }
  | {
      type: 'inner-packaging-2/set'
      key: 'width' | 'height'
      value: number
    }
  | {
      type: 'hanging-tissue/face-set'
      face: HangingTissueFace
      asset: ArtworkAsset
      referenceDimensions: ProjectState['hangingTissue']['artworkReferenceDimensions'][HangingTissueFace]
    }
  | { type: 'hanging-tissue/face-remove'; face: HangingTissueFace }
  | { type: 'hanging-tissue/select-face'; face: HangingTissueFace }
  | { type: 'hanging-tissue/transform-set'; face: HangingTissueFace; key: keyof ArtworkTransform; value: number }
  | { type: 'hanging-tissue/transform-reset'; face: HangingTissueFace }
  | { type: 'hanging-tissue/rotation-set'; value: InnerPackagingModelRotation | number }
  | { type: 'hanging-tissue/set'; key: 'width' | 'height' | 'depth'; value: number }
  | { type: 'hanging-tissue/set-pulled-sheet'; value: boolean }
  | { type: 'camera/autoRotate'; value: boolean }
  | { type: 'box-finish/select-kind'; kind: FinishKind }
  | { type: 'box-finish/select-face'; face: BoxFace }
  | { type: 'box-finish/enabled-set'; kind: FinishKind; value: boolean }
  | { type: 'box-finish/parameter-set'; kind: FinishKind; key: FinishParameterKey; value: number }
  | { type: 'box-finish/parameter-reset'; kind: FinishKind }
  | { type: 'box-finish/mask-set'; kind: FinishKind; face: BoxFace; asset: ArtworkAsset }
  | { type: 'box-finish/mask-remove'; kind: FinishKind; face: BoxFace }
  | { type: 'box-finish/masks-clear'; kind: FinishKind }
  | { type: 'box-finish/mask-transform-set'; kind: FinishKind; face: BoxFace; key: FinishTransformKey; value: number }
  | { type: 'box-finish/mask-transform-reset'; kind: FinishKind; face: BoxFace }
  | { type: 'pouch-finish/select-kind'; kind: FinishKind }
  | { type: 'pouch-finish/select-face'; face: PouchFace }
  | { type: 'pouch-finish/enabled-set'; kind: FinishKind; value: boolean }
  | { type: 'pouch-finish/parameter-set'; kind: FinishKind; key: FinishParameterKey; value: number }
  | { type: 'pouch-finish/parameter-reset'; kind: FinishKind }
  | { type: 'pouch-finish/mask-set'; kind: FinishKind; face: PouchFace; asset: ArtworkAsset }
  | { type: 'pouch-finish/mask-remove'; kind: FinishKind; face: PouchFace }
  | { type: 'pouch-finish/masks-clear'; kind: FinishKind }
  | { type: 'pouch-finish/mask-transform-set'; kind: FinishKind; face: PouchFace; key: FinishTransformKey; value: number }
  | { type: 'pouch-finish/mask-transform-reset'; kind: FinishKind; face: PouchFace }

function createEmptyFaces(): ProjectState['faces'] {
  return Object.fromEntries(BOX_FACES.map((face) => [face, null])) as ProjectState['faces']
}

const DEFAULT_ARTWORK_TRANSFORM: ArtworkTransform = {
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  stretchX: 100,
  stretchY: 100,
}

export function createDefaultInnerPackaging2(): ProjectState['innerPackaging2'] {
  return {
    faces: { front: null, back: null },
    transforms: {
      front: { ...DEFAULT_ARTWORK_TRANSFORM },
      back: { ...DEFAULT_ARTWORK_TRANSFORM },
    },
    selectedFace: 'front',
    width: 160,
    height: 205,
    modelRotation: 0,
  }
}

export function createDefaultHangingTissue(): ProjectState['hangingTissue'] {
  return {
    faces: { front: null, back: null, left: null, right: null },
    artworkReferenceDimensions: { front: null, back: null, left: null, right: null },
    transforms: {
      front: { ...DEFAULT_ARTWORK_TRANSFORM },
      back: { ...DEFAULT_ARTWORK_TRANSFORM },
      left: { ...DEFAULT_ARTWORK_TRANSFORM },
      right: { ...DEFAULT_ARTWORK_TRANSFORM },
    },
    selectedFace: 'front',
    width: 160,
    height: 205,
    depth: 80,
    modelRotation: 0,
    showPulledSheet: true,
  }
}

export function createInitialProject(): ProjectState {
  return {
    version: 14,
    name: '未命名包装',
    activeTab: 'artwork',
    packagingType: 'box',
    faces: createEmptyFaces(),
    box: { width: 160, height: 220, depth: 70, radius: 4 },
    pouch: {
      faces: { front: null, back: null },
      width: 160,
      height: 240,
      thickness: 16,
      gussetDepth: 70,
      roundedCorners: true,
      closure: 'none',
    },
    innerPackaging1: {
      artwork: null,
      width: 160,
      height: 205,
      artworkScale: 100,
      artworkOffsetX: 0,
      artworkOffsetY: 0,
      artworkRotation: 0,
      artworkStretchX: 100,
      artworkStretchY: 100,
      modelRotation: 0,
    },
    innerPackaging2: createDefaultInnerPackaging2(),
    hangingTissue: createDefaultHangingTissue(),
    boxFinish: createDefaultBoxFinish(),
    pouchFinish: createDefaultPouchFinish(),
    camera: { autoRotate: false },
  }
}

export function projectReducer(
  state: ProjectState,
  action: ProjectAction,
): ProjectState {
  switch (action.type) {
    case 'face/set':
      return {
        ...state,
        faces: { ...state.faces, [action.face]: action.asset },
      }
    case 'face/remove':
      return {
        ...state,
        faces: { ...state.faces, [action.face]: null },
      }
    case 'box/set':
      return Number.isFinite(action.value)
        ? { ...state, box: { ...state.box, [action.key]: action.value } }
        : state
    case 'packaging/type':
      return { ...state, packagingType: action.value }
    case 'pouch/face-set':
      return {
        ...state,
        pouch: {
          ...state.pouch,
          faces: { ...state.pouch.faces, [action.face]: action.asset },
        },
      }
    case 'pouch/face-remove':
      return {
        ...state,
        pouch: {
          ...state.pouch,
          faces: { ...state.pouch.faces, [action.face]: null },
        },
      }
    case 'pouch/set':
      if (typeof action.value === 'number' &&
        (!Number.isFinite(action.value) || action.value <= 0)) return state
      return { ...state, pouch: { ...state.pouch, [action.key]: action.value } }
    case 'inner-packaging-1/artwork-set':
      return {
        ...state,
        innerPackaging1: {
          ...state.innerPackaging1,
          artwork: action.asset,
        },
      }
    case 'inner-packaging-1/artwork-remove':
      return {
        ...state,
        innerPackaging1: {
          ...state.innerPackaging1,
          artwork: null,
        },
      }
    case 'inner-packaging-1/transform-set': {
      const isPercentScale = [
        'artworkScale',
        'artworkStretchX',
        'artworkStretchY',
      ].includes(action.key)
      const isRotation = action.key === 'artworkRotation'
      const min = isPercentScale ? 50 : isRotation ? -180 : -100
      const max = isPercentScale ? 300 : isRotation ? 180 : 100
      if (!Number.isFinite(action.value) || action.value < min || action.value > max) {
        return state
      }
      return {
        ...state,
        innerPackaging1: {
          ...state.innerPackaging1,
          [action.key]: action.value,
        },
      }
    }
    case 'inner-packaging-1/transform-reset':
      return {
        ...state,
        innerPackaging1: {
          ...state.innerPackaging1,
          artworkScale: 100,
          artworkOffsetX: 0,
          artworkOffsetY: 0,
          artworkRotation: 0,
          artworkStretchX: 100,
          artworkStretchY: 100,
        },
      }
    case 'inner-packaging-1/rotation-set':
      if (![0, 90, 180].includes(action.value)) return state
      return {
        ...state,
        innerPackaging1: {
          ...state.innerPackaging1,
          modelRotation: action.value as InnerPackagingModelRotation,
        },
      }
    case 'inner-packaging-1/set':
      if (!Number.isFinite(action.value) || action.value <= 0) return state
      return {
        ...state,
        innerPackaging1: { ...state.innerPackaging1, [action.key]: action.value },
      }
    case 'inner-packaging-2/face-set':
      return {
        ...state,
        innerPackaging2: {
          ...state.innerPackaging2,
          faces: { ...state.innerPackaging2.faces, [action.face]: action.asset },
          selectedFace: action.face,
        },
      }
    case 'inner-packaging-2/face-remove':
      return {
        ...state,
        innerPackaging2: {
          ...state.innerPackaging2,
          faces: { ...state.innerPackaging2.faces, [action.face]: null },
        },
      }
    case 'inner-packaging-2/select-face':
      return {
        ...state,
        innerPackaging2: { ...state.innerPackaging2, selectedFace: action.face },
      }
    case 'inner-packaging-2/transform-set': {
      const isScale = ['scale', 'stretchX', 'stretchY'].includes(action.key)
      const isRotation = action.key === 'rotation'
      const min = isScale ? 50 : isRotation ? -180 : -100
      const max = isScale ? 300 : isRotation ? 180 : 100
      if (!Number.isFinite(action.value) || action.value < min || action.value > max) {
        return state
      }
      return {
        ...state,
        innerPackaging2: {
          ...state.innerPackaging2,
          transforms: {
            ...state.innerPackaging2.transforms,
            [action.face]: {
              ...state.innerPackaging2.transforms[action.face],
              [action.key]: action.value,
            },
          },
        },
      }
    }
    case 'inner-packaging-2/transform-reset':
      return {
        ...state,
        innerPackaging2: {
          ...state.innerPackaging2,
          transforms: {
            ...state.innerPackaging2.transforms,
            [action.face]: { ...DEFAULT_ARTWORK_TRANSFORM },
          },
        },
      }
    case 'inner-packaging-2/rotation-set':
      if (![0, 90, 180].includes(action.value)) return state
      return {
        ...state,
        innerPackaging2: {
          ...state.innerPackaging2,
          modelRotation: action.value as InnerPackagingModelRotation,
        },
      }
    case 'inner-packaging-2/set':
      if (!Number.isFinite(action.value) || action.value <= 0) return state
      return {
        ...state,
        innerPackaging2: {
          ...state.innerPackaging2,
          [action.key]: action.value,
        },
      }
    case 'hanging-tissue/face-set':
      return {
        ...state,
        hangingTissue: {
          ...state.hangingTissue,
          faces: { ...state.hangingTissue.faces, [action.face]: action.asset },
          artworkReferenceDimensions: {
            ...state.hangingTissue.artworkReferenceDimensions,
            [action.face]: action.referenceDimensions,
          },
          selectedFace: action.face,
        },
      }
    case 'hanging-tissue/face-remove':
      return {
        ...state,
        hangingTissue: {
          ...state.hangingTissue,
          faces: { ...state.hangingTissue.faces, [action.face]: null },
          artworkReferenceDimensions: {
            ...state.hangingTissue.artworkReferenceDimensions,
            [action.face]: null,
          },
        },
      }
    case 'hanging-tissue/select-face':
      return { ...state, hangingTissue: { ...state.hangingTissue, selectedFace: action.face } }
    case 'hanging-tissue/transform-set': {
      const isScale = ['scale', 'stretchX', 'stretchY'].includes(action.key)
      const isRotation = action.key === 'rotation'
      const min = isScale ? 50 : isRotation ? -180 : -100
      const max = isScale ? 300 : isRotation ? 180 : 100
      if (!Number.isFinite(action.value) || action.value < min || action.value > max) return state
      return {
        ...state,
        hangingTissue: {
          ...state.hangingTissue,
          transforms: {
            ...state.hangingTissue.transforms,
            [action.face]: { ...state.hangingTissue.transforms[action.face], [action.key]: action.value },
          },
        },
      }
    }
    case 'hanging-tissue/transform-reset':
      return {
        ...state,
        hangingTissue: {
          ...state.hangingTissue,
          transforms: { ...state.hangingTissue.transforms, [action.face]: { ...DEFAULT_ARTWORK_TRANSFORM } },
        },
      }
    case 'hanging-tissue/rotation-set':
      if (![0, 90, 180].includes(action.value)) return state
      return {
        ...state,
        hangingTissue: {
          ...state.hangingTissue,
          modelRotation: action.value as InnerPackagingModelRotation,
        },
      }
    case 'hanging-tissue/set':
      if (!Number.isFinite(action.value) || action.value < 30 || action.value > 1000) return state
      return { ...state, hangingTissue: { ...state.hangingTissue, [action.key]: action.value } }
    case 'hanging-tissue/set-pulled-sheet':
      return { ...state, hangingTissue: { ...state.hangingTissue, showPulledSheet: action.value } }
    case 'camera/autoRotate':
      return { ...state, camera: { ...state.camera, autoRotate: action.value } }
    case 'box-finish/select-kind':
      return { ...state, boxFinish: { ...state.boxFinish, selectedKind: action.kind } }
    case 'box-finish/select-face':
      return { ...state, boxFinish: { ...state.boxFinish, selectedFace: action.face } }
    case 'box-finish/enabled-set':
      return updateFinishLayer(state, action.kind, { enabled: action.value })
    case 'box-finish/parameter-set':
      if (!isValidFinishParameter(action.kind, action.key, action.value)) return state
      return updateFinishLayer(state, action.kind, {
        parameters: {
          ...state.boxFinish.layers[action.kind].parameters,
          [action.key]: action.value,
        },
      })
    case 'box-finish/parameter-reset':
      return updateFinishLayer(state, action.kind, {
        parameters: { ...DEFAULT_FINISH_PARAMETERS[action.kind] },
      })
    case 'box-finish/mask-set':
      return updateFinishLayer(state, action.kind, {
        masks: {
          ...state.boxFinish.layers[action.kind].masks,
          [action.face]: { asset: action.asset, transform: { ...DEFAULT_FINISH_TRANSFORM } },
        },
      })
    case 'box-finish/mask-remove':
      return updateFinishLayer(state, action.kind, {
        masks: { ...state.boxFinish.layers[action.kind].masks, [action.face]: null },
      })
    case 'box-finish/masks-clear':
      return updateFinishLayer(state, action.kind, {
        masks: Object.fromEntries(BOX_FACES.map((face) => [face, null])) as ProjectState['boxFinish']['layers'][FinishKind]['masks'],
      })
    case 'box-finish/mask-transform-set': {
      const mask = state.boxFinish.layers[action.kind].masks[action.face]
      if (!mask) return state
      const isScale = action.key === 'scale'
      const isRotation = action.key === 'rotation'
      const min = isScale ? 50 : isRotation ? -180 : -100
      const max = isScale ? 300 : isRotation ? 180 : 100
      if (!Number.isFinite(action.value) || action.value < min || action.value > max) return state
      return updateFinishLayer(state, action.kind, {
        masks: {
          ...state.boxFinish.layers[action.kind].masks,
          [action.face]: {
            ...mask,
            transform: { ...mask.transform, [action.key]: action.value },
          },
        },
      })
    }
    case 'box-finish/mask-transform-reset': {
      const mask = state.boxFinish.layers[action.kind].masks[action.face]
      if (!mask) return state
      return updateFinishLayer(state, action.kind, {
        masks: {
          ...state.boxFinish.layers[action.kind].masks,
          [action.face]: { ...mask, transform: { ...DEFAULT_FINISH_TRANSFORM } },
        },
      })
    }
    case 'pouch-finish/select-kind':
      return { ...state, pouchFinish: { ...state.pouchFinish, selectedKind: action.kind } }
    case 'pouch-finish/select-face':
      return { ...state, pouchFinish: { ...state.pouchFinish, selectedFace: action.face } }
    case 'pouch-finish/enabled-set':
      return updatePouchFinishLayer(state, action.kind, { enabled: action.value })
    case 'pouch-finish/parameter-set':
      if (!isValidFinishParameter(action.kind, action.key, action.value)) return state
      return updatePouchFinishLayer(state, action.kind, {
        parameters: {
          ...state.pouchFinish.layers[action.kind].parameters,
          [action.key]: action.value,
        },
      })
    case 'pouch-finish/parameter-reset':
      return updatePouchFinishLayer(state, action.kind, {
        parameters: { ...DEFAULT_FINISH_PARAMETERS[action.kind] },
      })
    case 'pouch-finish/mask-set':
      return updatePouchFinishLayer(state, action.kind, {
        masks: {
          ...state.pouchFinish.layers[action.kind].masks,
          [action.face]: { asset: action.asset, transform: { ...DEFAULT_FINISH_TRANSFORM } },
        },
      })
    case 'pouch-finish/mask-remove':
      return updatePouchFinishLayer(state, action.kind, {
        masks: { ...state.pouchFinish.layers[action.kind].masks, [action.face]: null },
      })
    case 'pouch-finish/masks-clear':
      return updatePouchFinishLayer(state, action.kind, {
        masks: { front: null, back: null },
      })
    case 'pouch-finish/mask-transform-set': {
      const mask = state.pouchFinish.layers[action.kind].masks[action.face]
      if (!mask) return state
      const isScale = action.key === 'scale'
      const isRotation = action.key === 'rotation'
      const min = isScale ? 50 : isRotation ? -180 : -100
      const max = isScale ? 300 : isRotation ? 180 : 100
      if (!Number.isFinite(action.value) || action.value < min || action.value > max) return state
      return updatePouchFinishLayer(state, action.kind, {
        masks: {
          ...state.pouchFinish.layers[action.kind].masks,
          [action.face]: {
            ...mask,
            transform: { ...mask.transform, [action.key]: action.value },
          },
        },
      })
    }
    case 'pouch-finish/mask-transform-reset': {
      const mask = state.pouchFinish.layers[action.kind].masks[action.face]
      if (!mask) return state
      return updatePouchFinishLayer(state, action.kind, {
        masks: {
          ...state.pouchFinish.layers[action.kind].masks,
          [action.face]: { ...mask, transform: { ...DEFAULT_FINISH_TRANSFORM } },
        },
      })
    }
  }
}

function updateFinishLayer(
  state: ProjectState,
  kind: FinishKind,
  patch: Partial<ProjectState['boxFinish']['layers'][FinishKind]>,
): ProjectState {
  return {
    ...state,
    boxFinish: {
      ...state.boxFinish,
      layers: {
        ...state.boxFinish.layers,
        [kind]: { ...state.boxFinish.layers[kind], ...patch },
      },
    },
  }
}

function updatePouchFinishLayer(
  state: ProjectState,
  kind: FinishKind,
  patch: Partial<ProjectState['pouchFinish']['layers'][FinishKind]>,
): ProjectState {
  return {
    ...state,
    pouchFinish: {
      ...state.pouchFinish,
      layers: {
        ...state.pouchFinish.layers,
        [kind]: { ...state.pouchFinish.layers[kind], ...patch },
      },
    },
  }
}
