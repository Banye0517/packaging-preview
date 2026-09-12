import { useEffect, useMemo, useState } from 'react'
import { SRGBColorSpace, TextureLoader, type Texture } from 'three'

import type { BoxFace, PackageInstance } from '../app/types'
import { BOX_MATERIAL_FACE_ORDER } from '../scene/faceMaterials'
import { createRoundedBoxGeometry } from '../scene/roundedBoxGeometry'
import { createHolographicFilmTexture, createMetalFilmTexture, loadInvertedFinishMask } from './finishTexture'
import { finishUsesBaseArtwork, getFinishMaterialProps } from './finishMaterial'
import {
  FINISH_KINDS,
  type BoxFinishState,
  type FinishKind,
  type FinishLayerState,
} from './finishTypes'

export function FinishOverlay({ box, finish, faces }: {
  box: PackageInstance['box']
  finish: BoxFinishState
  faces: PackageInstance['faces']
}) {
  const { width, height, depth, radius } = box
  const geometry = useMemo(
    () => createRoundedBoxGeometry({ width, height, depth, radius }),
    [depth, height, radius, width],
  )
  useEffect(() => () => geometry.dispose(), [geometry])

  return <>
    {FINISH_KINDS.map((kind, layerIndex) => {
      const layer = finish.layers[kind]
      if (!layer.enabled || !Object.values(layer.masks).some(Boolean)) return null
      const scale = 1 + (layerIndex + 1) * 0.00035
      return <mesh key={kind} geometry={geometry} scale={scale} renderOrder={10 + layerIndex}>
        {BOX_MATERIAL_FACE_ORDER.map((face, materialIndex) => {
          const mask = layer.masks[face]
          return mask ? <FinishSurfaceMaterial key={face} index={materialIndex} kind={kind} parameters={layer.parameters}
            source={mask.asset.previewUrl} transform={mask.transform}
            baseSource={faces[face]?.previewUrl ?? null} /> :
            <meshBasicMaterial key={face} attach={`material-${materialIndex}`} transparent opacity={0} colorWrite={false} depthWrite={false} />
        })}
      </mesh>
    })}
  </>
}

export function FinishSurfaceMaterial({ index, kind, parameters, source, transform, baseSource }: {
  index?: number
  kind: FinishKind
  parameters: FinishLayerState['parameters']
  source: string
  transform: NonNullable<FinishLayerState['masks'][BoxFace]>['transform']
  baseSource: string | null
}) {
  const [mask, setMask] = useState<Texture | null>(null)
  const [baseTexture, setBaseTexture] = useState<Texture | null>(null)
  const finishTexture = useMemo(
    () => kind === 'holographic' ? createHolographicFilmTexture() :
      kind === 'gold-foil' || kind === 'silver-foil' ? createMetalFilmTexture(kind) : null,
    [kind],
  )
  useEffect(() => () => finishTexture?.dispose(), [finishTexture])
  useEffect(() => {
    let active = true
    let generated: Texture | null = null
    const sourceTexture = loadInvertedFinishMask(source, transform, (texture) => {
      generated = texture
      if (active) setMask(texture)
    })
    return () => {
      active = false
      sourceTexture.dispose()
      generated?.dispose()
    }
  }, [source, transform])

  useEffect(() => {
    if (!baseSource || !finishUsesBaseArtwork(kind)) {
      return
    }
    let active = true
    const texture = new TextureLoader().load(baseSource, (loaded) => {
      loaded.colorSpace = SRGBColorSpace
      if (active) setBaseTexture(loaded)
    })
    return () => {
      active = false
      texture.dispose()
    }
  }, [baseSource, kind])

  if (!mask || (baseSource && finishUsesBaseArtwork(kind) && !baseTexture)) {
    return <meshBasicMaterial attach={index === undefined ? 'material' : `material-${index}`} transparent opacity={0} colorWrite={false} depthWrite={false} />
  }

  const props = getFinishMaterialProps(kind, parameters)
  const relief = (parameters.relief ?? 0) * 0.015
  return <meshPhysicalMaterial attach={index === undefined ? 'material' : `material-${index}`} {...props}
    map={finishTexture ??
      (baseSource && finishUsesBaseArtwork(kind) ? baseTexture : null)}
    emissiveMap={kind === 'holographic' ? finishTexture : null}
    alphaMap={mask} bumpMap={mask} bumpScale={(props.bumpScale ?? 0) + relief}
    transparent alphaTest={0.01} depthWrite={false} polygonOffset polygonOffsetFactor={-1}
    toneMapped />
}
