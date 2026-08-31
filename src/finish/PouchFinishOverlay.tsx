import type { BufferGeometry } from 'three'

import type { ArtworkAsset, PouchFace } from '../app/types'
import { FinishSurfaceMaterial } from './FinishOverlay'
import { FINISH_KINDS, type FinishKind, type PouchFinishState } from './finishTypes'
import { getActivePouchFinishFaces } from './pouchFinishFaces'

export function PouchFinishOverlay({ geometry, finish, faces }: {
  geometry: Record<PouchFace, BufferGeometry>
  finish: PouchFinishState
  faces: Record<PouchFace, ArtworkAsset | null>
}) {
  return <>
    {getActivePouchFinishFaces(finish).map(({ kind, face }, index) => {
      const layer = finish.layers[kind]
      const mask = layer.masks[face]
      if (!mask) return null
      return <mesh
        key={`${kind}-${face}`}
        geometry={geometry[face]}
        renderOrder={20 + index}
        scale={1 + (FINISH_KINDS.indexOf(kind as FinishKind) + 1) * 0.00035}
      >
        <FinishSurfaceMaterial
          kind={kind}
          parameters={layer.parameters}
          source={mask.asset.previewUrl}
          transform={mask.transform}
          baseSource={faces[face]?.previewUrl ?? null}
        />
      </mesh>
    })}
  </>
}
