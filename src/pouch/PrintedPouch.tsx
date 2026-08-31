import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { Mesh, SRGBColorSpace, TextureLoader, type BufferGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

import type { ArtworkAsset, PouchState } from '../app/types'
import { PouchFinishOverlay } from '../finish/PouchFinishOverlay'
import type { PouchFinishState } from '../finish/finishTypes'
import { fitPouchGeometry, partitionPouchGeometry } from './pouchModelGeometry'

interface PrintedPouchProps {
  pouch: PouchState
  finish: PouchFinishState
}

const FILM_COLOR = '#f8fafc'
const SEAL_COLOR = '#edf2f7'

export function PrintedPouch({ pouch, finish }: PrintedPouchProps) {
  const { width: widthMm, height: heightMm, thickness: thicknessMm,
    gussetDepth } = pouch
  const { scene } = useGLTF('/models/wing-root-pouch.gltf')
  const scale = 3.2 / heightMm
  const width = widthMm * scale
  const height = heightMm * scale
  const thickness = thicknessMm * scale
  const gusset = gussetDepth * scale
  const sourceGeometry = useMemo(() => {
    scene.updateMatrixWorld(true)
    let sourceMesh: Mesh | undefined
    scene.traverse((object) => {
      if (!sourceMesh && object instanceof Mesh) sourceMesh = object
    })
    if (!sourceMesh) throw new Error('Stand-up pouch model contains no mesh')
    const result: BufferGeometry = sourceMesh.geometry.clone()
    result.applyMatrix4(sourceMesh.matrixWorld)
    return result
  }, [scene])
  const fittedGeometry = useMemo(
    () => fitPouchGeometry(sourceGeometry, {
      width,
      height,
      thickness,
      gussetDepth: gusset,
    }),
    [gusset, height, sourceGeometry, thickness, width],
  )
  const geometry = useMemo(
    () => partitionPouchGeometry(fittedGeometry, 'z'),
    [fittedGeometry],
  )
  const sealWidth = Math.max(width * 0.045, 0.08)
  const zipperY = height / 2 - sealWidth * 1.8
  const spoutRadius = Math.min(0.16, Math.max(0.08, width * 0.05))

  useEffect(
    () => () => {
      sourceGeometry.dispose()
      fittedGeometry.dispose()
      Object.values(geometry).forEach((part) => part.dispose())
    },
    [fittedGeometry, geometry, sourceGeometry],
  )

  return (
    <group>
      <mesh geometry={geometry.front} castShadow receiveShadow>
        <PanelMaterial asset={pouch.faces.front} />
      </mesh>
      <mesh geometry={geometry.back} castShadow receiveShadow>
        <PanelMaterial asset={pouch.faces.back} />
      </mesh>
      <mesh geometry={geometry.structure} castShadow receiveShadow>
        <meshStandardMaterial color={SEAL_COLOR} roughness={0.46} />
      </mesh>
      <PouchFinishOverlay
        geometry={{ front: geometry.front, back: geometry.back }}
        finish={finish}
        faces={pouch.faces}
      />
      {pouch.closure === 'spout' ? (
        <SplitTopSeal
          width={width}
          height={height}
          thickness={thickness}
          sealWidth={sealWidth}
          gap={spoutRadius * 3.2}
        />
      ) : null}
      {pouch.closure === 'zipper' ? (
        <group>
          <ZipperRail width={width} y={zipperY} z={thickness / 2 + 0.018} />
          <ZipperRail width={width} y={zipperY} z={-thickness / 2 - 0.018} />
        </group>
      ) : null}
      {pouch.closure === 'spout' ? (
        <Spout y={height / 2 + spoutRadius * 1.15} radius={spoutRadius} />
      ) : null}
    </group>
  )
}

useGLTF.preload('/models/wing-root-pouch.gltf')

function PanelMaterial({ asset }: { asset: ArtworkAsset | null }) {
  if (!asset) {
    return <meshStandardMaterial color={FILM_COLOR} roughness={0.48} metalness={0.01} />
  }
  return <LoadedPanelMaterial source={asset.previewUrl} />
}

function LoadedPanelMaterial({ source }: { source: string }) {
  const texture = useMemo(() => {
    const loaded = new TextureLoader().load(source)
    loaded.colorSpace = SRGBColorSpace
    return loaded
  }, [source])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <meshStandardMaterial
      map={texture}
      color={texture ? '#ffffff' : FILM_COLOR}
      roughness={0.48}
      metalness={0.01}
      side={2}
    />
  )
}

function ZipperRail({ width, y, z }: { width: number; y: number; z: number }) {
  const radius = 0.022
  return (
    <mesh position={[0, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <capsuleGeometry args={[radius, Math.max(0.05, width - radius * 6), 6, 10]} />
      <meshStandardMaterial color="#d9e1eb" roughness={0.38} />
    </mesh>
  )
}

function SplitTopSeal({
  width,
  height,
  thickness,
  sealWidth,
  gap,
}: {
  width: number
  height: number
  thickness: number
  sealWidth: number
  gap: number
}) {
  const segment = Math.max(0.05, (width - gap) / 2)
  const offset = gap / 2 + segment / 2
  const geometry = useMemo(
    () => new RoundedBoxGeometry(
      segment,
      sealWidth,
      thickness + 0.035,
      6,
      Math.min(sealWidth, thickness) * 0.42,
    ),
    [sealWidth, segment, thickness],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group position={[0, height / 2 - sealWidth / 2, 0]}>
      {[-offset, offset].map((x) => (
        <mesh key={x} position={[x, 0, 0]} geometry={geometry} castShadow>
          <meshStandardMaterial color={SEAL_COLOR} roughness={0.46} />
        </mesh>
      ))}
    </group>
  )
}

function Spout({ y, radius }: { y: number; radius: number }) {
  const neckRadius = Math.max(0.07, radius * 0.72)
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[neckRadius, neckRadius * 1.12, radius * 2.4, 24]} />
        <meshStandardMaterial color="#f4f7fb" roughness={0.34} />
      </mesh>
      <mesh position={[0, radius * 1.65, 0]} castShadow>
        <cylinderGeometry args={[neckRadius * 1.25, neckRadius * 1.25, radius * 0.9, 24]} />
        <meshStandardMaterial color="#e5ebf3" roughness={0.4} />
      </mesh>
    </group>
  )
}
