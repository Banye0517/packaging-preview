import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import {
  CanvasTexture,
  Matrix4,
  Mesh,
  SRGBColorSpace,
  type BufferGeometry,
} from 'three'

import type { ArtworkAsset, InnerPackaging1State } from '../app/types'
import { fitPouchGeometry } from '../pouch/pouchModelGeometry'
import { ArtworkMaterial } from '../scene/artworkLighting'

const MODEL_URL = '/models/inner-packaging-1.gltf'
const FILM_COLOR = '#f8fafc'

export function PrintedInnerPackaging1({ value }: { value: InnerPackaging1State }) {
  const { scene } = useGLTF(MODEL_URL)
  const scale = 3.2 / value.height
  const width = value.width * scale
  const height = value.height * scale
  const sourceGeometry = useMemo(() => {
    scene.updateMatrixWorld(true)
    let sourceMesh: Mesh | undefined
    scene.traverse((object) => {
      if (
        !sourceMesh &&
        object instanceof Mesh &&
        object.name === '青豌豆' &&
        object.parent?.name !== '大概尺寸'
      ) sourceMesh = object
    })
    if (!sourceMesh) throw new Error('Inner packaging model contains no main mesh')
    const result: BufferGeometry = sourceMesh.geometry.clone()
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
  useEffect(() => () => sourceGeometry.dispose(), [sourceGeometry])
  useEffect(() => () => fittedGeometry.dispose(), [fittedGeometry])

  return (
    <group rotation={[0, Math.PI, 0]}>
      <group rotation={[0, 0, value.modelRotation * Math.PI / 180]}>
        <mesh geometry={fittedGeometry} castShadow receiveShadow={false}>
          <PanelMaterial asset={value.artwork} transform={value} />
        </mesh>
      </group>
    </group>
  )
}

useGLTF.preload(MODEL_URL)

function PanelMaterial({
  asset,
  transform,
}: {
  asset: ArtworkAsset | null
  transform: Pick<
    InnerPackaging1State,
    | 'artworkScale'
    | 'artworkOffsetX'
    | 'artworkOffsetY'
    | 'artworkRotation'
    | 'artworkStretchX'
    | 'artworkStretchY'
  >
}) {
  if (!asset) {
    return <meshStandardMaterial color={FILM_COLOR} roughness={0.48} metalness={0.01} />
  }
  return <LoadedPanelMaterial source={asset.previewUrl} transform={transform} />
}

function LoadedPanelMaterial({
  source,
  transform,
}: {
  source: string
  transform: Pick<
    InnerPackaging1State,
    | 'artworkScale'
    | 'artworkOffsetX'
    | 'artworkOffsetY'
    | 'artworkRotation'
    | 'artworkStretchX'
    | 'artworkStretchY'
  >
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const loaded = new Image()
    let active = true
    loaded.onload = () => {
      if (active) setImage(loaded)
    }
    loaded.src = source
    return () => {
      active = false
      setImage(null)
    }
  }, [source])

  const texture = useMemo(() => {
    if (!image) return null
    const size = 1024
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) return null
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, size, size)
    const scale = transform.artworkScale / 100
    const drawWidth = size * scale * transform.artworkStretchX / 100
    const drawHeight = size * scale * transform.artworkStretchY / 100
    context.save()
    context.translate(
      size / 2 + transform.artworkOffsetX / 100 * size,
      size / 2 - transform.artworkOffsetY / 100 * size,
    )
    context.rotate(transform.artworkRotation * Math.PI / 180)
    context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
    context.restore()
    const loaded = new CanvasTexture(canvas)
    loaded.colorSpace = SRGBColorSpace
    loaded.flipY = false
    return loaded
  }, [
    image,
    transform.artworkOffsetX,
    transform.artworkOffsetY,
    transform.artworkRotation,
    transform.artworkScale,
    transform.artworkStretchX,
    transform.artworkStretchY,
  ])

  useEffect(() => () => texture?.dispose(), [texture])
  return (
    <ArtworkMaterial
      texture={texture}
      side={2}
      roughness={0.92}
      clearcoat={0}
    />
  )
}
