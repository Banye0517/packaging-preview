import { useGLTF } from '@react-three/drei'
import { useMemo, useEffect, useState } from 'react'
import {
  Box3,
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
  type BufferGeometry,
  type Group,
  type Material,
} from 'three'

import type { FaceTissueState } from '../app/types'
import { createArtworkMaterial } from '../scene/artworkMaterial'
import {
  calculateTopSheetAnchor,
  deformFaceTissueGeometry,
  type FaceTissueSourceBounds,
} from './faceTissueDeformation'
import {
  FACE_TISSUE_BODY_ROOT_NAME,
  FACE_TISSUE_MODEL_URL,
  FACE_TISSUE_PRINTABLE_MESH_NAME,
  FACE_TISSUE_SIDE_MESH_NAME,
  FACE_TISSUE_TOP_SHEET_NAME,
  findFaceTissueNode,
  findFaceTissueMesh,
  isFaceTissueMesh,
} from './faceTissueModel'
import { drawFaceTissueAtlas } from './faceTissueTexture'

const DEFAULT_DIMENSIONS = { width: 160, height: 205, thickness: 80 }
const LOCAL_GROUND_Y = -1.87
const BASE_MATERIAL_OPTIONS = { color: '#f8fafc', roughness: 0.48, metalness: 0.01 }

interface FaceTissueModelData {
  bodyGeometry: BufferGeometry
  sideGeometry: BufferGeometry
  topSheetGeometry: BufferGeometry
  sourceBounds: FaceTissueSourceBounds
}

function useLoadedImage(source: string | undefined) {
  const [loadedState, setLoadedState] = useState<{
    source: string
    image: HTMLImageElement
  } | null>(null)

  useEffect(() => {
    if (!source) return
    const image = new Image()
    let active = true
    image.onload = () => {
      if (active) setLoadedState({ source, image })
    }
    image.src = source
    return () => { active = false }
  }, [source])

  if (!loadedState || loadedState.source !== source) return null
  return loadedState.image
}

function geometryBounds(geometry: BufferGeometry) {
  geometry.computeBoundingBox()
  if (!geometry.boundingBox) throw new Error('Face tissue geometry has no bounds')
  return geometry.boundingBox.clone()
}

function cloneWorldGeometry(mesh: Mesh, offset: Vector3) {
  const geometry = mesh.geometry.clone()
  geometry.applyMatrix4(mesh.matrixWorld)
  geometry.translate(offset.x, offset.y, offset.z)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

function boundsToSourceBounds(bounds: Box3): FaceTissueSourceBounds {
  return {
    minX: bounds.min.x,
    maxX: bounds.max.x,
    minY: bounds.min.y,
    maxY: bounds.max.y,
    minZ: bounds.min.z,
    maxZ: bounds.max.z,
  }
}

function createModelData(scene: Group): FaceTissueModelData {
  scene.updateMatrixWorld(true)
  const bodyRoot = findFaceTissueNode(scene, FACE_TISSUE_BODY_ROOT_NAME)
  const body = findFaceTissueMesh(scene, FACE_TISSUE_PRINTABLE_MESH_NAME)
  const side = findFaceTissueMesh(scene, FACE_TISSUE_SIDE_MESH_NAME)
  const topSheet = findFaceTissueMesh(scene, FACE_TISSUE_TOP_SHEET_NAME)
  if (!isFaceTissueMesh(body) || !isFaceTissueMesh(side) || !isFaceTissueMesh(topSheet)) {
    throw new Error('Face tissue model nodes are incomplete')
  }
  if (!bodyRoot) throw new Error('Face tissue model body root is missing')

  const bodyRaw = body.geometry.clone()
  bodyRaw.applyMatrix4(body.matrixWorld)
  const bodyRawBounds = geometryBounds(bodyRaw)
  const offset = new Vector3(
    -bodyRawBounds.getCenter(new Vector3()).x,
    -bodyRawBounds.min.y,
    -bodyRawBounds.getCenter(new Vector3()).z,
  )
  const bodyGeometry = cloneWorldGeometry(body, offset)
  const sideGeometry = cloneWorldGeometry(side, offset)
  const topSheetGeometry = cloneWorldGeometry(topSheet, offset)
  bodyRaw.dispose()

  const bodyBounds = geometryBounds(bodyGeometry)
  const sideBounds = geometryBounds(sideGeometry)
  bodyBounds.union(sideBounds)
  return {
    bodyGeometry,
    sideGeometry,
    topSheetGeometry,
    sourceBounds: boundsToSourceBounds(bodyBounds),
  }
}

function createArtworkTexture(
  image: HTMLImageElement,
  transform: FaceTissueState['artworkTransform'],
  currentDimensions: Pick<FaceTissueState, 'width' | 'height' | 'thickness'>,
  referenceDimensions: FaceTissueState['artworkReferenceDimensions'],
) {
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return null
  drawFaceTissueAtlas(
    context,
    size,
    image,
    transform,
    currentDimensions,
    referenceDimensions ?? currentDimensions,
  )
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.flipY = false
  return texture
}

function createBaseMaterial() {
  return new MeshStandardMaterial({ ...BASE_MATERIAL_OPTIONS, side: DoubleSide })
}

export function PrintedFaceTissue({ value }: { value: FaceTissueState }) {
  const { scene } = useGLTF(FACE_TISSUE_MODEL_URL)
  const model = useMemo(() => createModelData(scene), [scene])
  const image = useLoadedImage(value.artwork?.previewUrl)
  const texture = useMemo(
    () => image ? createArtworkTexture(
      image,
      value.artworkTransform,
      { width: value.width, height: value.height, thickness: value.thickness },
      value.artworkReferenceDimensions,
    ) : null,
    [image, value.artworkReferenceDimensions, value.artworkTransform, value.height, value.thickness, value.width],
  )
  const bodyMaterial = useMemo<Material>(
    () => texture ? createArtworkMaterial(texture, DoubleSide) : createBaseMaterial(),
    [texture],
  )
  const sideMaterial = useMemo(() => createBaseMaterial(), [])
  const topSheetMaterial = useMemo(() => createBaseMaterial(), [])
  const targetBodyBounds = useMemo(() => ({
    minY: model.sourceBounds.minY,
    maxY: model.sourceBounds.minY +
      (model.sourceBounds.maxY - model.sourceBounds.minY) * value.height / DEFAULT_DIMENSIONS.height,
  }), [model.sourceBounds.maxY, model.sourceBounds.minY, value.height])
  const deformedBody = useMemo(() => deformFaceTissueGeometry(model.bodyGeometry, {
    sourceBounds: model.sourceBounds,
    width: (model.sourceBounds.maxX - model.sourceBounds.minX) * value.width / DEFAULT_DIMENSIONS.width,
    height: (model.sourceBounds.maxY - model.sourceBounds.minY) * value.height / DEFAULT_DIMENSIONS.height,
    thickness: (model.sourceBounds.maxZ - model.sourceBounds.minZ) * value.thickness / DEFAULT_DIMENSIONS.thickness,
    radius: value.radius * (model.sourceBounds.maxY - model.sourceBounds.minY) / DEFAULT_DIMENSIONS.height,
  }), [model.bodyGeometry, model.sourceBounds, value.height, value.radius, value.thickness, value.width])
  const deformedSide = useMemo(() => deformFaceTissueGeometry(model.sideGeometry, {
    sourceBounds: model.sourceBounds,
    width: (model.sourceBounds.maxX - model.sourceBounds.minX) * value.width / DEFAULT_DIMENSIONS.width,
    height: (model.sourceBounds.maxY - model.sourceBounds.minY) * value.height / DEFAULT_DIMENSIONS.height,
    thickness: (model.sourceBounds.maxZ - model.sourceBounds.minZ) * value.thickness / DEFAULT_DIMENSIONS.thickness,
    radius: value.radius * (model.sourceBounds.maxY - model.sourceBounds.minY) / DEFAULT_DIMENSIONS.height,
  }), [model.sideGeometry, model.sourceBounds, value.height, value.radius, value.thickness, value.width])
  const topSheetAnchor = calculateTopSheetAnchor(
    { minY: model.sourceBounds.minY, maxY: model.sourceBounds.maxY },
    targetBodyBounds,
  )
  const baseScale = 3.2 / (model.sourceBounds.maxY - model.sourceBounds.minY)

  useEffect(() => () => model.bodyGeometry.dispose(), [model.bodyGeometry])
  useEffect(() => () => model.sideGeometry.dispose(), [model.sideGeometry])
  useEffect(() => () => model.topSheetGeometry.dispose(), [model.topSheetGeometry])
  useEffect(() => () => deformedBody.dispose(), [deformedBody])
  useEffect(() => () => deformedSide.dispose(), [deformedSide])
  useEffect(() => () => texture?.dispose(), [texture])
  useEffect(() => () => bodyMaterial.dispose(), [bodyMaterial])
  useEffect(() => () => sideMaterial.dispose(), [sideMaterial])
  useEffect(() => () => topSheetMaterial.dispose(), [topSheetMaterial])

  return (
    <group
      data-testid="printed-face-tissue"
      position={[0, LOCAL_GROUND_Y, 0]}
      rotation={[0, 0, value.modelRotation * Math.PI / 180]}
      scale={baseScale}
    >
      <mesh geometry={deformedBody} material={bodyMaterial} castShadow receiveShadow />
      <mesh geometry={deformedSide} material={sideMaterial} castShadow receiveShadow />
      <mesh
        geometry={model.topSheetGeometry}
        material={topSheetMaterial}
        position={[0, topSheetAnchor.y, 0]}
        visible={value.showTopSheet}
        castShadow
        receiveShadow
      />
    </group>
  )
}

useGLTF.preload(FACE_TISSUE_MODEL_URL)
