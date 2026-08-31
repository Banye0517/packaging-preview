import type { MeshPhysicalMaterialParameters } from 'three'

import { BOX_MATERIAL_FACE_ORDER } from '../scene/faceMaterials'
import {
  FINISH_KINDS,
  type BoxFinishState,
  type FinishKind,
  type FinishLayerState,
} from './finishTypes'

export function getActiveFinishFaces(finish: BoxFinishState) {
  return FINISH_KINDS.flatMap((kind) => {
    const layer = finish.layers[kind]
    if (!layer.enabled) return []
    return BOX_MATERIAL_FACE_ORDER.flatMap((face) =>
      layer.masks[face] ? [{ kind, face }] : [],
    )
  })
}

export function getFinishMaterialProps(
  kind: FinishKind,
  parameters: FinishLayerState['parameters'],
): MeshPhysicalMaterialParameters {
  const grain = (parameters.grain ?? 0) / 100
  const roughness = Math.min(1, (parameters.roughness ?? 0.2) + grain * 0.16)
  const bumpScale = (parameters.normalStrength ?? 0) / 100 * 0.035
  if (kind === 'gold-foil') return {
    color: '#ffffff', metalness: 0.72, roughness,
    envMapIntensity: 2, clearcoat: 0.82, clearcoatRoughness: 0.04,
    emissive: '#9b5a08', emissiveIntensity: 0.18, bumpScale,
  }
  if (kind === 'silver-foil') return {
    color: '#ffffff', metalness: 0.76, roughness,
    envMapIntensity: 2.2, clearcoat: 0.86, clearcoatRoughness: 0.035,
    emissive: '#aeb8c6', emissiveIntensity: 0.12, bumpScale,
  }
  if (kind === 'holographic') return {
    color: '#ffffff', metalness: 0.05, roughness, opacity: 1,
    emissive: '#ffffff', emissiveIntensity: 0.08,
    iridescence: (parameters.iridescence ?? 100) / 100 * 0.22,
    iridescenceIOR: 1.8,
    iridescenceThicknessRange: [180, 620],
  }
  if (kind === 'spot-uv') return {
    color: '#ffffff', metalness: 0, roughness,
    clearcoat: (parameters.gloss ?? 100) / 100,
    clearcoatRoughness: roughness,
  }
  return { color: '#f4f0e7', metalness: 0.02, roughness }
}

export function finishUsesBaseArtwork(kind: FinishKind) {
  return kind === 'spot-uv' || kind === 'emboss-deboss'
}
