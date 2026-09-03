import { useEffect, useMemo, useState } from 'react'
import {
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three'

import type { ProjectState } from '../app/types'
import { FinishOverlay } from '../finish/FinishOverlay'
import { BOX_MATERIAL_FACE_ORDER, DEFAULT_BOX_ROTATION } from './faceMaterials'
import { createRoundedBoxGeometry } from './roundedBoxGeometry'
import { ArtworkMaterial } from './artworkLighting'

interface PrintedBoxProps {
  faces: ProjectState['faces']
  box: ProjectState['box']
  finish: ProjectState['boxFinish']
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
          <FaceMaterial key={face} index={index} source={faces[face]?.previewUrl ?? null} />
        ))}
      </mesh>
      <FinishOverlay box={box} finish={finish} faces={faces} />
    </group>
  )
}

function FaceMaterial({ index, source }: { index: number; source: string | null }) {
  if (!source) {
    return (
      <meshStandardMaterial
        attach={`material-${index}`}
        color="#f7f9fc"
        roughness={0.58}
        metalness={0.02}
      />
    )
  }

  return <LoadedFaceMaterial index={index} source={source} />
}

function LoadedFaceMaterial({ index, source }: { index: number; source: string }) {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    let active = true
    const loaded = new TextureLoader().load(source, (nextTexture) => {
      nextTexture.colorSpace = SRGBColorSpace
      if (active) setTexture(nextTexture)
    })

    return () => {
      active = false
      loaded.dispose()
    }
  }, [source])

  return <ArtworkMaterial attach={`material-${index}`} texture={texture} />
}
