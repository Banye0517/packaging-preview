import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box3,
  CanvasTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three'

import type { HangingTissueState } from '../app/types'
import { applyTextureMap } from '../scene/textureMaterial'
import {
  drawHangingTissueAtlas,
  extractHangingTissueFaceGeometrySet,
} from './hangingTissueTexture'
import {
  findModelNode,
  HANGING_TISSUE_MODEL_URL,
  isPrintableBodyMesh,
} from './hangingTissueModel'

const OPEN_ROOT_NAME = '悬挂抽纸开'
const PRINTABLE_BODY_NAMES = ['悬挂抽纸155-材质.2', '悬挂抽纸155-悬挂纸巾']
const PULLED_SHEET_NAME = '纸.1'
const FACES = ['front', 'back', 'left', 'right'] as const

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

function createOpenModel(scene: Group) {
  const root = scene.getObjectByName(OPEN_ROOT_NAME)
  if (!root) throw new Error('Hanging tissue model contains no open hierarchy')
  const model = root.clone(true)
  const printableBodies = PRINTABLE_BODY_NAMES.map((name) => {
    const printableBody = findModelNode(model, name)
    if (!isPrintableBodyMesh(printableBody) || !printableBody.parent) {
      throw new Error('Hanging tissue model contains no printable body mesh')
    }
    const geometrySet = extractHangingTissueFaceGeometrySet(printableBody.geometry)
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
    return { faceMeshes, remainderMesh }
  })
  const pulledSheet = findModelNode(model, PULLED_SHEET_NAME)
  if (!pulledSheet) throw new Error('Hanging tissue model contains no pulled-sheet node')
  return { model, printableBodies, pulledSheet }
}

export function PrintedHangingTissue({ value }: { value: HangingTissueState }) {
  const { scene } = useGLTF(HANGING_TISSUE_MODEL_URL)
  const { model, printableBodies, pulledSheet } = useMemo(() => createOpenModel(scene), [scene])
  const printableBodiesRef = useRef(printableBodies)
  const pulledSheetRef = useRef(pulledSheet)
  const size = useMemo(() => new Box3().setFromObject(model).getSize(new Vector3()), [model])
  const frontImage = useLoadedImage(value.faces.front?.previewUrl)
  const backImage = useLoadedImage(value.faces.back?.previewUrl)
  const leftImage = useLoadedImage(value.faces.left?.previewUrl)
  const rightImage = useLoadedImage(value.faces.right?.previewUrl)
  const images = useMemo(() => ({
    front: frontImage, back: backImage, left: leftImage, right: rightImage,
  }), [backImage, frontImage, leftImage, rightImage])
  const textureSets = useMemo(() => printableBodies.map(() =>
    Object.fromEntries(FACES.map((face) => {
      const image = images[face]
      if (!image) return [face, null]
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      const context = canvas.getContext('2d')
      if (!context) return [face, null]
      drawHangingTissueAtlas(context, 1024, { [face]: { image, transform: value.transforms[face] } }, {
        front: { minU: 0, maxU: 1, minV: 0, maxV: 1 },
        back: { minU: 0, maxU: 1, minV: 0, maxV: 1 },
        left: { minU: 0, maxU: 1, minV: 0, maxV: 1 },
        right: { minU: 0, maxU: 1, minV: 0, maxV: 1 },
      })
      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.flipY = false
      return [face, texture]
    })) as Record<(typeof FACES)[number], CanvasTexture | null>,
  ), [images, printableBodies, value.transforms])

  useEffect(() => () => textureSets.flatMap((set) => FACES.map((face) => set[face])).forEach((texture) => texture?.dispose()), [textureSets])
  useEffect(() => {
    pulledSheetRef.current.visible = value.showPulledSheet
  }, [value.showPulledSheet])
  useEffect(() => {
    const materials = printableBodiesRef.current.flatMap(({ faceMeshes }, index) => FACES.map((face) => {
      const material = new MeshStandardMaterial({ color: '#f8fafc', roughness: 0.48, metalness: 0.01 })
      applyTextureMap(material, textureSets[index][face])
      faceMeshes[face].material = material
      return material
    }))
    const remainderMaterials = printableBodiesRef.current.map(({ remainderMesh }) => {
      const material = new MeshStandardMaterial({ color: '#f8fafc', roughness: 0.48, metalness: 0.01 })
      remainderMesh.material = material
      return material
    })
    return () => [...materials, ...remainderMaterials].forEach((material) => material.dispose())
  }, [textureSets])

  const baseScale = size.y > 0 ? 3.2 / size.y : 1
  return (
    <group
      data-testid="printed-hanging-tissue"
      rotation={[0, 0, value.modelRotation * Math.PI / 180]}
      scale={[baseScale * value.width / 160, baseScale * value.height / 205, baseScale * value.width / 160]}
    >
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload(HANGING_TISSUE_MODEL_URL)
