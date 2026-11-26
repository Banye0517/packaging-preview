import { useEffect, useMemo } from 'react'
import {
  SRGBColorSpace,
  TextureLoader,
} from 'three'

import type { PackageInstance } from '../app/types'
import { FinishOverlay } from '../finish/FinishOverlay'
import { BOX_MATERIAL_FACE_ORDER, DEFAULT_BOX_ROTATION } from './faceMaterials'
import { createRoundedBoxGeometry } from './roundedBoxGeometry'
import { ArtworkMaterial } from './artworkLighting'

interface PrintedBoxProps {
  faces: PackageInstance['faces']
  box: PackageInstance['box']
  finish: PackageInstance['boxFinish']
}

export function PrintedBox({ faces, box, finish }: PrintedBoxProps) {
  const { width, height, depth, radius } = box
  const geometry = useMemo(
    () => createRoundedBoxGeometry({ width, height, depth, radius }),
    [depth, height, radius, width],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <group rotation={DEFAULT_BOX_ROTATION}>
      <mesh castShadow receiveShadow>
        <primitive attach="geometry" object={geometry} />
        {BOX_MATERIAL_FACE_ORDER.map((face, index) => (
          <FaceMaterial key={`${face}-${faces[face]?.id ?? 'empty'}`} index={index} source={faces[face]?.previewUrl ?? null} />
        ))}
      </mesh>
      <FinishOverlay box={box} finish={finish} faces={faces} />
    </group>
  )
}

function FaceMaterial({ index, source }: { index: number; source: string | null }) {
  if (!source) {
    return (
      <meshPhysicalMaterial
        attach={`material-${index}`}
        color="#f6f7fa"
        roughness={0.58}
        metalness={0}
        clearcoat={0.04}
        envMapIntensity={0.4}
      />
    )
  }

  return <LoadedFaceMaterial index={index} source={source} />
}

function LoadedFaceMaterial({ index, source }: { index: number; source: string }) {
  const texture = useMemo(() => {
    const loaded = new TextureLoader().load(source)
    loaded.colorSpace = SRGBColorSpace
    loaded.anisotropy = 16
    return loaded
  }, [source])

  useEffect(() => () => texture.dispose(), [texture])

  return <ArtworkMaterial attach={`material-${index}`} texture={texture} />
}
