import { useLayoutEffect, useRef, useState } from 'react'
import { Box3, Group, Matrix4, Mesh } from 'three'

import type { PackageInstance } from '../app/types'
import { PrintedFaceTissue } from '../faceTissue/PrintedFaceTissue'
import { PrintedHangingTissue } from '../hangingTissue/PrintedHangingTissue'
import { PrintedInnerPackaging1 } from '../innerPackaging/PrintedInnerPackaging1'
import { PrintedInnerPackaging2 } from '../innerPackaging/PrintedInnerPackaging2'
import { PrintedPouch } from '../pouch/PrintedPouch'
import { PrintedBox } from '../scene/PrintedBox'
import { PrintedWashTissue } from '../washTissue/PrintedWashTissue'
import { PrintedWetTissue } from '../wetTissue/PrintedWetTissue'
import type { LayoutBounds } from './layout'

export function PackageInstanceView({
  instance,
  position,
  rotationY,
  selected,
  onSelect,
  onBounds,
}: {
  instance: PackageInstance
  position: [number, number, number]
  rotationY: number
  selected: boolean
  onSelect: (id: string) => void
  onBounds: (id: string, bounds: LayoutBounds) => void
}) {
  const contentRef = useRef<Group>(null)
  const previous = useRef('')
  const [displayScale, setDisplayScale] = useState<[number, number, number]>([1, 1, 1])

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    content.updateWorldMatrix(true, true)
    const inverseRoot = content.matrixWorld.clone().invert()
    const box = new Box3()
    content.traverse((object) => {
      if (!(object instanceof Mesh) || !object.geometry) return
      object.geometry.computeBoundingBox()
      if (!object.geometry.boundingBox) return
      const relativeMatrix = new Matrix4().multiplyMatrices(inverseRoot, object.matrixWorld)
      box.union(object.geometry.boundingBox.clone().applyMatrix4(relativeMatrix))
    })
    if (box.isEmpty()) return
    const scale = getPhysicalScale(instance)
    setDisplayScale((current) => scale.every((value, index) => Math.abs(value - current[index]) < 0.001) ? current : scale)
    const bounds: LayoutBounds = {
      id: instance.id,
      min: [box.min.x * scale[0], box.min.y * scale[1], box.min.z * scale[2]],
      max: [box.max.x * scale[0], box.max.y * scale[1], box.max.z * scale[2]],
    }
    const signature = [...bounds.min, ...bounds.max].map((value) => value.toFixed(3)).join(':')
    if (signature !== previous.current) {
      previous.current = signature
      onBounds(instance.id, bounds)
    }
  }, [instance, onBounds])

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect(instance.id)
      }}
      userData={{ packageId: instance.id, selected }}
    >
      <group ref={contentRef} scale={displayScale}>{renderPackage(instance)}</group>
    </group>
  )
}

function getPhysicalScale(instance: PackageInstance): [number, number, number] {
  const sharedUnit = 3.6 / 220
  const internallyNormalized = ['box', 'pouch', 'inner-packaging-1', 'inner-packaging-2'].includes(instance.packagingType)
  if (internallyNormalized) {
    const height = instance.packagingType === 'box' ? instance.box.height
      : instance.packagingType === 'pouch' ? instance.pouch.height
        : instance.packagingType === 'inner-packaging-1' ? instance.innerPackaging1.height
          : instance.innerPackaging2.height
    const nativeHeight = instance.packagingType === 'box' ? 3.6 : 3.2
    const scale = height * sharedUnit / nativeHeight
    return [scale, scale, scale]
  }
  const scale = sharedUnit / (3.2 / 205)
  return [scale, scale, scale]
}

function renderPackage(instance: PackageInstance) {
  switch (instance.packagingType) {
    case 'box': return <PrintedBox faces={instance.faces} box={instance.box} finish={instance.boxFinish} />
    case 'pouch': return <PrintedPouch pouch={instance.pouch} finish={instance.pouchFinish} />
    case 'inner-packaging-1': return <PrintedInnerPackaging1 value={instance.innerPackaging1} />
    case 'inner-packaging-2': return <PrintedInnerPackaging2 value={instance.innerPackaging2} />
    case 'hanging-tissue': return <PrintedHangingTissue value={instance.hangingTissue} />
    case 'face-tissue': return <PrintedFaceTissue value={instance.faceTissue} />
    case 'wet-tissue': return <PrintedWetTissue value={instance.wetTissue} />
    case 'wash-tissue': return <PrintedWashTissue value={instance.washTissue} />
  }
}
