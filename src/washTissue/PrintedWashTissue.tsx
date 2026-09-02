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

import type { FaceTissueState } from '../app/types'
import { createArtworkMaterial } from '../scene/artworkMaterial'
import {
  WASH_TISSUE_BODY_MESH_NAME,
  WASH_TISSUE_BODY_ROOT_NAME,
  WASH_TISSUE_MODEL_URL,
  WASH_TISSUE_TOP_SHEET_NAME,
  findWashTissueMesh,
  findWashTissueNode,
  isWashTissueMesh,
} from './washTissueModel'
import { drawWashTissueAtlas } from './washTissueTexture'

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
  value: FaceTissueState,
) {
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = Math.round(size * image.height / image.width)
  const context = canvas.getContext('2d')
  if (!context) return null
  drawWashTissueAtlas(
    context,
    size,
    image,
    value.artworkTransform,
    { width: value.width, height: value.height, thickness: value.thickness },
    value.artworkReferenceDimensions ?? DEFAULT_DIMENSIONS,
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

function createModel(scene: Group, value: FaceTissueState, texture: Texture | null) {
  const sourceRoot = findWashTissueNode(scene, WASH_TISSUE_BODY_ROOT_NAME)
  if (!sourceRoot) throw new Error('Wash tissue model root is missing')
  const sourceBody = findWashTissueMesh(sourceRoot, WASH_TISSUE_BODY_MESH_NAME)
  if (!isWashTissueMesh(sourceBody)) throw new Error('Wash tissue body mesh is missing')
  const { root, modelScale } = normalizeModel(sourceRoot, sourceBody)

  root.traverse((node) => {
    if (isWashTissueMesh(node)) node.material = cloneMaterial(node.material)
  })
  const bodyMesh = findWashTissueMesh(root, WASH_TISSUE_BODY_MESH_NAME)
  const paperMesh = findWashTissueMesh(root, WASH_TISSUE_TOP_SHEET_NAME)
  if (bodyMesh && texture) bodyMesh.material = createArtworkMaterial(texture, DoubleSide)
  if (paperMesh) paperMesh.visible = value.showTopSheet
  return { root, modelScale }
}

export function PrintedWashTissue({ value }: { value: FaceTissueState }) {
  const { scene } = useGLTF(WASH_TISSUE_MODEL_URL)
  const image = useLoadedImage(value.artwork?.previewUrl)
  const texture = useMemo(() => image ? createArtworkTexture(image, value) : null, [image, value])
  const model = useMemo(() => createModel(scene, value, texture), [scene, texture, value])

  useEffect(() => () => texture?.dispose(), [texture])
  useEffect(() => () => {
    model.root.traverse((node) => {
      if (isWashTissueMesh(node)) {
        if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose())
        else node.material.dispose()
      }
    })
  }, [model])

  return (
    <group
      data-testid="printed-wash-tissue"
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

useGLTF.preload(WASH_TISSUE_MODEL_URL)
