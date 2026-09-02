import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import {
  Box3,
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
  type Group,
  type Material,
  type Object3D,
  type Texture,
} from 'three'

import type { WetTissueArtworkSlot, WetTissueState } from '../app/types'
import { createArtworkMaterial } from '../scene/artworkMaterial'
import {
  WET_TISSUE_BODY_MESH_NAME,
  WET_TISSUE_CLOSED_ROOT_NAME,
  WET_TISSUE_LID_ART_MESH_NAME,
  WET_TISSUE_MODEL_URL,
  WET_TISSUE_OPEN_ROOT_NAME,
  WET_TISSUE_PAPER_MESH_NAME,
  findWetTissueMesh,
  findWetTissueNode,
  isWetTissueMesh,
} from './wetTissueModel'
import { drawWetTissueAtlas } from './wetTissueTexture'

const DEFAULT_DIMENSIONS = { width: 160, height: 205, thickness: 80 }
const BASE_MATERIAL_OPTIONS = { color: '#f8fafc', roughness: 0.48, metalness: 0.01 }
const LOCAL_GROUND_Y = -1.67

function useLoadedImage(source: string | undefined) {
  const [loadedState, setLoadedState] = useState<{ source: string; image: HTMLImageElement } | null>(null)

  useEffect(() => {
    if (!source) return
    const image = new Image()
    let active = true
    image.onload = () => { if (active) setLoadedState({ source, image }) }
    image.src = source
    return () => { active = false }
  }, [source])

  if (!loadedState || loadedState.source !== source) return null
  return loadedState.image
}

function createArtworkTexture(
  image: HTMLImageElement,
  slot: WetTissueArtworkSlot,
  value: WetTissueState,
) {
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return null
  drawWetTissueAtlas(
    context,
    size,
    image,
    value.transforms[slot],
    { width: value.width, height: value.height, thickness: value.thickness },
    value.artworkReferenceDimensions[slot] ?? {
      width: value.width, height: value.height, thickness: value.thickness,
    },
    slot,
  )
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.flipY = false
  return texture
}

function createBaseMaterial() {
  return new MeshStandardMaterial({ ...BASE_MATERIAL_OPTIONS, side: DoubleSide })
}

function cloneMaterial(value: Material | Material[]) {
  if (Array.isArray(value)) return value.map(() => createBaseMaterial())
  return createBaseMaterial()
}

function normalizeModel(root: Object3D, body: Mesh) {
  root.updateMatrixWorld(true)
  body.updateMatrixWorld(true)
  const bodyBounds = new Box3().setFromObject(body)
  const offset = new Vector3(
    -bodyBounds.getCenter(new Vector3()).x,
    -bodyBounds.min.y,
    -bodyBounds.getCenter(new Vector3()).z,
  )
  const normalized = root.clone(true)
  normalized.position.add(offset)
  return {
    root: normalized,
    modelScale: 3.2 / bodyBounds.getSize(new Vector3()).y,
  }
}

function createModel(
  scene: Group,
  value: WetTissueState,
  bodyTexture: Texture | null,
  lidTexture: Texture | null,
) {
  const rootName = value.modelState === 'open'
    ? WET_TISSUE_OPEN_ROOT_NAME
    : WET_TISSUE_CLOSED_ROOT_NAME
  const sourceRoot = findWetTissueNode(scene, rootName)
  if (!sourceRoot) throw new Error(`Wet tissue model root is missing: ${rootName}`)
  const sourceBody = findWetTissueMesh(sourceRoot, WET_TISSUE_BODY_MESH_NAME)
  if (!isWetTissueMesh(sourceBody)) throw new Error('Wet tissue body mesh is missing')
  const { root, modelScale } = normalizeModel(sourceRoot, sourceBody)
  root.traverse((node) => {
    if (!isWetTissueMesh(node)) return
    node.material = cloneMaterial(node.material)
  })
  const bodyMesh = findWetTissueMesh(root, WET_TISSUE_BODY_MESH_NAME)
  const lidMesh = findWetTissueMesh(root, WET_TISSUE_LID_ART_MESH_NAME)
  const paperMesh = findWetTissueMesh(root, WET_TISSUE_PAPER_MESH_NAME)
  if (bodyMesh && bodyTexture) bodyMesh.material = createArtworkMaterial(bodyTexture, DoubleSide)
  if (lidMesh && lidTexture) lidMesh.material = createArtworkMaterial(lidTexture, DoubleSide)
  if (paperMesh) paperMesh.visible = value.modelState === 'open' && value.showTopSheet
  return { root, modelScale }
}

export function PrintedWetTissue({ value }: { value: WetTissueState }) {
  const { scene } = useGLTF(WET_TISSUE_MODEL_URL)
  const bodyImage = useLoadedImage(value.artworks.body?.previewUrl)
  const lidImage = useLoadedImage(value.artworks.lid?.previewUrl)
  const bodyTexture = useMemo(() => bodyImage ? createArtworkTexture(bodyImage, 'body', value) : null, [bodyImage, value])
  const lidTexture = useMemo(() => lidImage ? createArtworkTexture(lidImage, 'lid', value) : null, [lidImage, value])
  const model = useMemo(
    () => createModel(scene, value, bodyTexture, lidTexture),
    [bodyTexture, lidTexture, scene, value],
  )

  useEffect(() => () => bodyTexture?.dispose(), [bodyTexture])
  useEffect(() => () => lidTexture?.dispose(), [lidTexture])
  useEffect(() => () => {
    model.root.traverse((node) => {
      if (isWetTissueMesh(node)) {
        if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose())
        else node.material.dispose()
      }
    })
  }, [model])

  return (
    <group
      data-testid="printed-wet-tissue"
      position={[0, LOCAL_GROUND_Y, 0]}
      rotation={[0, 0, value.modelRotation * Math.PI / 180]}
      scale={model.modelScale}
    >
      <group scale={[value.width / DEFAULT_DIMENSIONS.width, value.height / DEFAULT_DIMENSIONS.height, value.thickness / DEFAULT_DIMENSIONS.thickness]}>
        <primitive object={model.root} />
      </group>
    </group>
  )
}

useGLTF.preload(WET_TISSUE_MODEL_URL)
