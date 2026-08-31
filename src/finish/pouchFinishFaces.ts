import { FINISH_KINDS, type PouchFinishState } from './finishTypes'

const POUCH_FINISH_FACES = ['front', 'back'] as const

export function getActivePouchFinishFaces(finish: PouchFinishState) {
  return FINISH_KINDS.flatMap((kind) => {
    const layer = finish.layers[kind]
    if (!layer.enabled) return []
    return POUCH_FINISH_FACES.flatMap((face) =>
      layer.masks[face] ? [{ kind, face }] : [],
    )
  })
}
