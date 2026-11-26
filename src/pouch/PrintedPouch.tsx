import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import { Mesh, SRGBColorSpace, TextureLoader, type BufferGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

import type { ArtworkAsset, PouchState } from '../app/types'
import { PouchFinishOverlay } from '../finish/PouchFinishOverlay'
import type { PouchFinishState } from '../finish/finishTypes'
import { ArtworkMaterial } from '../scene/artworkLighting'
import { assetUrl, sampleArtworkBorderColor } from '../scene/assetUrl'
import { fitPouchGeometry, partitionPouchGeometry } from './pouchModelGeometry'

interface PrintedPouchProps {
  pouch: PouchState
  finish: PouchFinishState
}

const FILM_COLOR = '#f7f8fa'
const DEFAULT_SEAL_COLOR = '#f2f4f7'
const POUCH_MODEL_URL = assetUrl('models/wing-root-pouch.gltf')

export function PrintedPouch({ pouch, finish }: PrintedPouchProps) {
  const { width: widthMm, height: heightMm, thickness: thicknessMm, gussetDepth } = pouch
  const { scene } = useGLTF(POUCH_MODEL_URL)
  const [sealColor, setSealColor] = useState(DEFAULT_SEAL_COLOR)
  const scale = 3.2 / heightMm
  const width = widthMm * scale
  const height = heightMm * scale
  const thickness = thicknessMm * scale
  const gusset = gussetDepth * scale

  const borderSampleSrc = pouch.faces.front?.previewUrl ?? pouch.faces.back?.previewUrl ?? null
  useEffect(() => {
    let active = true
    if (!borderSampleSrc) {
      setSealColor(DEFAULT_SEAL_COLOR)
      return () => { active = false }
    }
    void sampleArtworkBorderColor(borderSampleSrc, DEFAULT_SEAL_COLOR).then((hex) => {
      if (active) setSealColor(hex)
    })
    return () => { active = false }
  }, [borderSampleSrc])

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
  const zipperY = height / 2 - sealWidth * 1.45
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
        <meshPhysicalMaterial color={sealColor} roughness={0.58} metalness={0} clearcoat={0.04} />
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
          color={sealColor}
        />
      ) : null}
      {pouch.closure === 'zipper' ? (
        <group>
          <ZipperGroove width={width} y={zipperY} z={thickness * 0.22} color={sealColor} />
          <ZipperGroove width={width} y={zipperY} z={-thickness * 0.22} color={sealColor} />
        </group>
      ) : null}
      {pouch.closure === 'spout' ? (
        <Spout y={height / 2 + spoutRadius * 1.15} radius={spoutRadius} />
      ) : null}
    </group>
  )
}

useGLTF.preload(POUCH_MODEL_URL)

function PanelMaterial({ asset }: { asset: ArtworkAsset | null }) {
  if (!asset) {
    return <meshStandardMaterial color={FILM_COLOR} roughness={0.54} metalness={0.01} />
  }
  return <LoadedPanelMaterial source={asset.previewUrl} />
}

function LoadedPanelMaterial({ source }: { source: string }) {
  const texture = useMemo(() => {
    const loaded = new TextureLoader().load(source)
    loaded.colorSpace = SRGBColorSpace
    loaded.anisotropy = 16
    return loaded
  }, [source])

  useEffect(() => () => texture.dispose(), [texture])

  return <ArtworkMaterial texture={texture} side={2} />
}

/** Subtle flush heat-seal press line instead of a protruding gray pipe. */
function ZipperGroove({ width, y, z, color }: { width: number; y: number; z: number; color: string }) {
  return (
    <group position={[0, y, z]}>
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[Math.max(0.08, width * 0.92), 0.006, 0.012]} />
        <meshStandardMaterial color={color} roughness={0.75} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, -0.008, 0]}>
        <boxGeometry args={[Math.max(0.08, width * 0.92), 0.006, 0.012]} />
        <meshStandardMaterial color={color} roughness={0.75} transparent opacity={0.55} />
      </mesh>
    </group>
  )
}

function SplitTopSeal({
  width,
  height,
  thickness,
  sealWidth,
  gap,
  color,
}: {
  width: number
  height: number
  thickness: number
  sealWidth: number
  gap: number
  color: string
}) {
  const segment = Math.max(0.05, (width - gap) / 2)
  const offset = gap / 2 + segment / 2
  const geometry = useMemo(
    () => new RoundedBoxGeometry(
      segment,
      sealWidth,
      thickness + 0.025,
      6,
      Math.min(sealWidth, thickness) * 0.42,
    ),
    [sealWidth, segment, thickness],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group position={[0, height / 2 - sealWidth / 2, 0]}>
      {[-offset, offset].map((x) => (
        <mesh key={x} position={[x, 0, 0]} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial color={color} roughness={0.54} />
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
        <meshStandardMaterial color="#f4f7fb" roughness={0.38} />
      </mesh>
      <mesh position={[0, radius * 1.65, 0]} castShadow>
        <cylinderGeometry args={[neckRadius * 1.25, neckRadius * 1.25, radius * 0.9, 24]} />
        <meshStandardMaterial color="#e5ebf3" roughness={0.44} />
      </mesh>
    </group>
  )
}
