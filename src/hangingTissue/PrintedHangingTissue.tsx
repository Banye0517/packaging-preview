import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box3,
  CanvasTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three'

import type { HangingTissueState } from '../app/types'
import { applyTextureMap } from '../scene/textureMaterial'
import { deformHangingTissueGeometry } from './hangingTissueDeformation'
import {
  drawHangingTissueAtlas,
  extractHangingTissueFaceGeometrySet,
  extractHangingTissueUvRegions,
} from './hangingTissueTexture'
import {
  calculateHangingTissuePlacement,
  findModelNode,
  HANGING_TISSUE_ARTWORK_MATERIAL,
  HANGING_TISSUE_BODY_ROOT_NAME,
  HANGING_TISSUE_MODEL_URL,
  HANGING_TISSUE_PRINTABLE_MESH_NAMES,
  HANGING_TISSUE_PULLED_SHEET_NAME,
  isPrintableBodyMesh,
} from './hangingTissueModel'

const FACES = ['front', 'back', 'left', 'right'] as const
const LOCAL_GROUND_Y = -1.87
const BODY_MIN_Y = 0.03241796791553497
const BODY_MAX_Y = 29
const CONNECTOR_MAX_Y = 33

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

function createModel(scene: Group) {
  const bodyRoot = findModelNode(scene, HANGING_TISSUE_BODY_ROOT_NAME)?.clone(true)
  const pulledSheet = findModelNode(scene, HANGING_TISSUE_PULLED_SHEET_NAME)?.clone(true)
  if (!bodyRoot || !pulledSheet) throw new Error('Hanging tissue model nodes are incomplete')
  const model = new Group()
  model.add(bodyRoot, pulledSheet)
  const printableBodies = HANGING_TISSUE_PRINTABLE_MESH_NAMES.map((name) => {
    const printableBody = findModelNode(bodyRoot, name)
    if (!isPrintableBodyMesh(printableBody) || !printableBody.parent) {
      throw new Error('Hanging tissue model contains no printable body mesh')
    }
    const geometrySet = extractHangingTissueFaceGeometrySet(printableBody.geometry)
    const uvRegions = extractHangingTissueUvRegions(printableBody.geometry)
    const faceMeshes = Object.fromEntries(FACES.map((face) => {
      const faceMesh = printableBody.clone()
      faceMesh.geometry = geometrySet.faces[face]
      printableBody.parent!.add(faceMesh)
      return [face, faceMesh]
    })) as Record<(typeof FACES)[number], Mesh>
    const remainderMesh = printableBody.clone()
    remainderMesh.geometry = geometrySet.remainder
    printableBody.parent!.add(remainderMesh)
    printableBody.visible = false
    return { faceMeshes, remainderMesh, uvRegions, sourceGeometrySet: geometrySet }
  })
  return { model, printableBodies, pulledSheet }
}

export function PrintedHangingTissue({ value }: { value: HangingTissueState }) {
  const { scene } = useGLTF(HANGING_TISSUE_MODEL_URL)
  const { model, printableBodies, pulledSheet } = useMemo(() => createModel(scene), [scene])
  const printableBodiesRef = useRef(printableBodies)
  const pulledSheetRef = useRef(pulledSheet)
  const placement = useMemo(
    () => calculateHangingTissuePlacement(new Box3().setFromObject(model)),
    [model],
  )
  const frontImage = useLoadedImage(value.faces.front?.previewUrl)
  const backImage = useLoadedImage(value.faces.back?.previewUrl)
  const leftImage = useLoadedImage(value.faces.left?.previewUrl)
  const rightImage = useLoadedImage(value.faces.right?.previewUrl)
  const images = useMemo(() => ({
    front: frontImage, back: backImage, left: leftImage, right: rightImage,
  }), [backImage, frontImage, leftImage, rightImage])
  const deformedGeometrySets = useMemo(() => printableBodies.map(({ sourceGeometrySet }) => {
    const options = {
      bodyMinY: BODY_MIN_Y,
      bodyMaxY: BODY_MAX_Y,
      connectorMaxY: CONNECTOR_MAX_Y,
      widthScale: value.width / 160,
      heightScale: value.height / 205,
      depthScale: value.depth / 80,
    }
    return {
      faces: Object.fromEntries(FACES.map((face) => [
        face,
        deformHangingTissueGeometry(sourceGeometrySet.faces[face], options),
      ])),
      remainder: deformHangingTissueGeometry(sourceGeometrySet.remainder, options),
    }
  }), [printableBodies, value.depth, value.height, value.width])
  const textures = useMemo(() => printableBodies.map(({ uvRegions }) => {
      if (!FACES.some((face) => images[face])) return null
      const canvas = document.createElement('canvas')
      canvas.width = 2048
      canvas.height = 2048
      const context = canvas.getContext('2d')
      if (!context) return null
      const currentDimensions = { width: value.width, height: value.height, depth: value.depth }
      drawHangingTissueAtlas(context, 2048, Object.fromEntries(FACES.flatMap((face) => {
        const image = images[face]
        return image ? [[face, {
          image,
          transform: value.transforms[face],
          currentDimensions,
          referenceDimensions: value.artworkReferenceDimensions[face] ?? currentDimensions,
        }]] : []
      })), uvRegions)
      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.flipY = false
      return texture
    }), [images, printableBodies, value.artworkReferenceDimensions, value.depth, value.height, value.transforms, value.width])

  useEffect(() => () => textures.forEach((texture) => texture?.dispose()), [textures])
  useEffect(() => {
    printableBodiesRef.current.forEach(({ faceMeshes, remainderMesh }, index) => {
      FACES.forEach((face) => { faceMeshes[face].geometry = deformedGeometrySets[index].faces[face] })
      remainderMesh.geometry = deformedGeometrySets[index].remainder
    })
    return () => deformedGeometrySets.forEach(({ faces, remainder }) => {
      FACES.forEach((face) => faces[face].dispose())
      remainder.dispose()
    })
  }, [deformedGeometrySets])
  useEffect(() => {
    pulledSheetRef.current.visible = value.showPulledSheet
  }, [value.showPulledSheet])
  useEffect(() => {
    const materials = printableBodiesRef.current.flatMap(({ faceMeshes }, index) => FACES.map((face) => {
      const material = new MeshStandardMaterial({
        ...HANGING_TISSUE_ARTWORK_MATERIAL,
      })
      applyTextureMap(material, textures[index])
      material.emissiveMap = textures[index]
      material.needsUpdate = true
      faceMeshes[face].material = material
      return material
    }))
    const remainderMaterials = printableBodiesRef.current.map(({ remainderMesh }) => {
      const material = new MeshStandardMaterial({ color: '#f8fafc', roughness: 0.48, metalness: 0.01 })
      remainderMesh.material = material
      return material
    })
    return () => [...materials, ...remainderMaterials].forEach((material) => material.dispose())
  }, [textures])

  const baseScale = placement.size.y > 0 ? 3.2 / placement.size.y : 1
  return (
    <group
      data-testid="printed-hanging-tissue"
      position={[0, LOCAL_GROUND_Y, 0]}
      rotation={[0, 0, value.modelRotation * Math.PI / 180]}
      scale={baseScale}
    >
      <primitive object={model} position={placement.modelOffset} />
    </group>
  )
}

useGLTF.preload(HANGING_TISSUE_MODEL_URL)
