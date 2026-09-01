import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CanvasTexture,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  type BufferGeometry,
} from 'three'

import type { InnerPackaging2State } from '../app/types'
import { fitPouchGeometry } from '../pouch/pouchModelGeometry'
import { applyTextureMap } from '../scene/textureMaterial'
import {
  drawInnerPackaging2Atlas,
  extractInnerPackaging2UvRegions,
  type InnerPackaging2UvRegions,
} from './innerPackaging2Texture'

export const INNER_PACKAGING_2_MODEL_URL = '/models/inner-packaging-2.gltf'

function useLoadedImage(source: string | undefined) {
  const [loadedState, setLoadedState] = useState<{
    source: string
    image: HTMLImageElement
  } | null>(null)
  useEffect(() => {
    if (!source) return
    const loaded = new Image()
    let active = true
    loaded.onload = () => {
      if (active) setLoadedState({ source, image: loaded })
    }
    loaded.src = source
    return () => {
      active = false
    }
  }, [source])
  if (!loadedState || loadedState.source !== source) return null
  return loadedState.image
}

export function PrintedInnerPackaging2({ value }: { value: InnerPackaging2State }) {
  const { scene } = useGLTF(INNER_PACKAGING_2_MODEL_URL)
  const scale = 3.2 / value.height
  const width = value.width * scale
  const height = value.height * scale
  const sourceGeometry = useMemo(() => {
    scene.updateMatrixWorld(true)
    let sourceMesh: Mesh | undefined
    scene.traverse((object) => {
      if (!sourceMesh && object instanceof Mesh) sourceMesh = object
    })
    if (!sourceMesh) throw new Error('Inner packaging 2 model contains no mesh')
    const result: BufferGeometry = sourceMesh.geometry.clone()
    if (!result.getAttribute('uv')) {
      result.dispose()
      throw new Error('Inner packaging 2 model contains no UVs')
    }
    result.applyMatrix4(sourceMesh.matrixWorld)
    result.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2))
    return result
  }, [scene])
  const fittedGeometry = useMemo(
    () => fitPouchGeometry(sourceGeometry, {
      width,
      height,
      thickness: height,
      gussetDepth: height,
    }),
    [height, sourceGeometry, width],
  )
  const uvRegions = useMemo(
    () => extractInnerPackaging2UvRegions(sourceGeometry),
    [sourceGeometry],
  )
  useEffect(() => () => sourceGeometry.dispose(), [sourceGeometry])
  useEffect(() => () => fittedGeometry.dispose(), [fittedGeometry])

  return (
    <group rotation={[0, 0, value.modelRotation * Math.PI / 180]}>
      <mesh geometry={fittedGeometry} castShadow receiveShadow>
        <InnerPackaging2Material value={value} uvRegions={uvRegions} />
      </mesh>
    </group>
  )
}

function InnerPackaging2Material({
  value,
  uvRegions,
}: {
  value: InnerPackaging2State
  uvRegions: InnerPackaging2UvRegions
}) {
  const frontImage = useLoadedImage(value.faces.front?.previewUrl)
  const backImage = useLoadedImage(value.faces.back?.previewUrl)
  const materialRef = useRef<MeshBasicMaterial>(null)
  const texture = useMemo(() => {
    if (!frontImage && !backImage) return null
    const size = 1024
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) return null
    drawInnerPackaging2Atlas(context, size, {
      ...(frontImage ? { front: { image: frontImage, transform: value.transforms.front } } : {}),
      ...(backImage ? { back: { image: backImage, transform: value.transforms.back } } : {}),
    }, uvRegions)
    const next = new CanvasTexture(canvas)
    next.colorSpace = SRGBColorSpace
    next.flipY = false
    return next
  }, [backImage, frontImage, uvRegions, value.transforms.back, value.transforms.front])

  useEffect(() => () => texture?.dispose(), [texture])
  useEffect(() => {
    if (materialRef.current) applyTextureMap(materialRef.current, texture)
  }, [texture])

  if (!frontImage && !backImage) {
    return (
      <meshStandardMaterial
        color="#f8fafc"
        roughness={0.48}
        metalness={0.01}
        side={2}
      />
    )
  }

  return (
    <meshBasicMaterial
      ref={materialRef}
      map={texture}
      color="#ffffff"
      toneMapped={false}
      side={2}
    />
  )
}

useGLTF.preload(INNER_PACKAGING_2_MODEL_URL)
