import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
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
  extractHangingTissueUvRegions,
} from './hangingTissueTexture'

export const HANGING_TISSUE_MODEL_URL = '/models/hanging-tissue.gltf'
const OPEN_ROOT_NAME = '悬挂抽纸开'
const PRINTABLE_BODY_NAME = '悬挂抽纸155-材质.2'
const PULLED_SHEET_NAME = '纸.1'

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
  const printableBody = model.getObjectByName(PRINTABLE_BODY_NAME)
  if (!(printableBody instanceof Mesh)) {
    throw new Error('Hanging tissue model contains no printable body mesh')
  }
  const pulledSheet = model.getObjectByName(PULLED_SHEET_NAME)
  if (!pulledSheet) throw new Error('Hanging tissue model contains no pulled-sheet node')
  return { model, printableBody, pulledSheet }
}

export function PrintedHangingTissue({ value }: { value: HangingTissueState }) {
  const { scene } = useGLTF(HANGING_TISSUE_MODEL_URL)
  const { model, printableBody, pulledSheet } = useMemo(() => createOpenModel(scene), [scene])
  const size = useMemo(() => new Box3().setFromObject(model).getSize(new Vector3()), [model])
  const frontImage = useLoadedImage(value.faces.front?.previewUrl)
  const backImage = useLoadedImage(value.faces.back?.previewUrl)
  const leftImage = useLoadedImage(value.faces.left?.previewUrl)
  const rightImage = useLoadedImage(value.faces.right?.previewUrl)
  const texture = useMemo(() => {
    if (!frontImage && !backImage && !leftImage && !rightImage) return null
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const context = canvas.getContext('2d')
    if (!context) return null
    drawHangingTissueAtlas(context, 1024, {
      ...(frontImage ? { front: { image: frontImage, transform: value.transforms.front } } : {}),
      ...(backImage ? { back: { image: backImage, transform: value.transforms.back } } : {}),
      ...(leftImage ? { left: { image: leftImage, transform: value.transforms.left } } : {}),
      ...(rightImage ? { right: { image: rightImage, transform: value.transforms.right } } : {}),
    }, extractHangingTissueUvRegions(printableBody.geometry))
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    result.flipY = false
    return result
  }, [backImage, frontImage, leftImage, printableBody.geometry, rightImage, value.transforms])

  useEffect(() => () => texture?.dispose(), [texture])
  useEffect(() => {
    pulledSheet.visible = value.showPulledSheet
  }, [pulledSheet, value.showPulledSheet])
  useEffect(() => {
    const material = new MeshStandardMaterial({ color: '#f8fafc', roughness: 0.48, metalness: 0.01 })
    applyTextureMap(material, texture)
    printableBody.material = material
    return () => material.dispose()
  }, [printableBody, texture])

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
