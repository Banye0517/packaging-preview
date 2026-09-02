import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import type { ProjectState } from '../app/types'
import { renderTransparentPng, type PngExportSize } from '../export/transparentPng'
import { PrintedInnerPackaging1 } from '../innerPackaging/PrintedInnerPackaging1'
import { PrintedInnerPackaging2 } from '../innerPackaging/PrintedInnerPackaging2'
import { PrintedHangingTissue } from '../hangingTissue/PrintedHangingTissue'
import { PrintedFaceTissue } from '../faceTissue/PrintedFaceTissue'
import { PrintedWetTissue } from '../wetTissue/PrintedWetTissue'
import { PrintedPouch } from '../pouch/PrintedPouch'
import { PrintedBox } from './PrintedBox'
import { CAMERA_POLAR_LIMITS, CAMERA_POSITIONS } from './cameraLimits'
import type { CameraCommand } from './PreviewControls'
import { StudioEnvironment } from './StudioEnvironment'

export interface CameraCommandRequest {
  type: CameraCommand
  nonce: number
}

interface BoxSceneProps {
  project: ProjectState
  command: CameraCommandRequest | null
}

export interface BoxSceneHandle {
  exportTransparentPng: (options?: PngExportRequest) => string | null
}

export interface PngExportRequest {
  size: PngExportSize
  includeShadow: boolean
}

export const BoxScene = forwardRef<BoxSceneHandle, BoxSceneProps>(function BoxScene(
  { project, command },
  ref,
) {
  return (
    <Canvas
      className="box-canvas"
      shadows
      camera={{ position: [6.4, 5.2, 8.8], fov: 38 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={0.65} />
      <hemisphereLight args={['#ffffff', '#cad4e2', 1.1]} />
      <directionalLight
        castShadow
        intensity={2.2}
        position={[4, 7, 6]}
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight intensity={0.8} position={[-5, 2, -3]} />
      <StudioEnvironment />
      <group position={[0, 0.2, 0]}>
        {project.packagingType === 'box' ? (
          <PrintedBox faces={project.faces} box={project.box} finish={project.boxFinish} />
        ) : project.packagingType === 'pouch' ? (
          <PrintedPouch pouch={project.pouch} finish={project.pouchFinish} />
        ) : project.packagingType === 'inner-packaging-1' ? (
          <PrintedInnerPackaging1 value={project.innerPackaging1} />
        ) : project.packagingType === 'inner-packaging-2' ? (
          <PrintedInnerPackaging2 value={project.innerPackaging2} />
        ) : project.packagingType === 'hanging-tissue' ? (
          <PrintedHangingTissue value={project.hangingTissue} />
        ) : project.packagingType === 'wet-tissue' ? (
          <PrintedWetTissue value={project.wetTissue} />
        ) : (
          <PrintedFaceTissue value={project.faceTissue} />
        )}
      </group>
      <group name="product-contact-shadow">
        <ContactShadows
          position={[0, -1.67, 0]}
          opacity={0.26}
          scale={8}
          blur={2.4}
          far={4}
        />
      </group>
      <CameraControls autoRotate={project.camera.autoRotate} command={command} />
      <ExportController ref={ref} />
    </Canvas>
  )
})

const ExportController = forwardRef<BoxSceneHandle>(function ExportController(_, ref) {
  const renderer = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)

  useImperativeHandle(ref, () => ({
    exportTransparentPng: (options = { size: 3000, includeShadow: false }) => {
      if (!('isPerspectiveCamera' in camera)) return null
      return renderTransparentPng(renderer, scene, camera as PerspectiveCamera, {
        ...options,
        shadowGroup: scene.getObjectByName('product-contact-shadow'),
      })
    },
  }), [camera, renderer, scene])

  return null
})

function CameraControls({
  autoRotate,
  command,
}: {
  autoRotate: boolean
  command: CameraCommandRequest | null
}) {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    if (!command || !controls.current) return
    const target = controls.current.target

    const position = CAMERA_POSITIONS[command.type]
    camera.position.set(position[0], position[1], position[2])
    target.set(0, 0.2, 0)
    controls.current.update()
  }, [camera, command])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={1.4}
      enableDamping
      minDistance={4.5}
      maxDistance={15}
      minPolarAngle={CAMERA_POLAR_LIMITS.min}
      maxPolarAngle={CAMERA_POLAR_LIMITS.max}
    />
  )
}
