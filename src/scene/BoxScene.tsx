import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { forwardRef, Suspense, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import type { PackageInstance, ProjectState } from '../app/types'
import {
  applyExportFrameProjection,
  type ExportPreset,
} from '../export/exportFrame'
import { renderTransparentPng, type PngExportSelection } from '../export/transparentPng'
import { PackageInstanceView } from '../composition/PackageInstanceView'
import { PackageModelErrorBoundary } from '../composition/PackageModelErrorBoundary'
import { calculateCompositionLayout, type LayoutBounds } from '../composition/layout'
import { CAMERA_POLAR_LIMITS, CAMERA_POSITIONS } from './cameraLimits'
import type { CameraCommand } from './PreviewControls'
import { StudioEnvironment } from './StudioEnvironment'
import { getStudioLighting } from './studioLighting'
import { fitCompositionCamera } from './fitCompositionCamera'

export interface CameraCommandRequest {
  type: CameraCommand
  nonce: number
}

interface BoxSceneProps {
  project: ProjectState
  command: CameraCommandRequest | null
  exportPreset: ExportPreset
  onSelectInstance?: (id: string) => void
}

export interface BoxSceneHandle {
  exportTransparentPng: (options?: PngExportRequest) => string | null
}

export type PngExportRequest = PngExportSelection

const EXPORT_CAMERA_FOV = 38

function approximateBounds(instance: PackageInstance): LayoutBounds {
  let width: number
  let height: number
  let depth = 80
  if (instance.packagingType === 'box') ({ width, height, depth } = instance.box)
  else if (instance.packagingType === 'pouch') ({ width, height, thickness: depth } = instance.pouch)
  else if (instance.packagingType === 'inner-packaging-1') ({ width, height } = instance.innerPackaging1)
  else if (instance.packagingType === 'inner-packaging-2') ({ width, height } = instance.innerPackaging2)
  else if (instance.packagingType === 'hanging-tissue') ({ width, height, depth } = instance.hangingTissue)
  else if (instance.packagingType === 'wet-tissue') ({ width, height, thickness: depth } = instance.wetTissue)
  else if (instance.packagingType === 'wash-tissue') ({ width, height, thickness: depth } = instance.washTissue)
  else ({ width, height, thickness: depth } = instance.faceTissue)
  const scale = 3.6 / 220
  return {
    id: instance.id,
    min: [-width * scale / 2, -height * scale / 2, -depth * scale / 2],
    max: [width * scale / 2, height * scale / 2, depth * scale / 2],
  }
}

export const BoxScene = forwardRef<BoxSceneHandle, BoxSceneProps>(function BoxScene(
  { project, command, exportPreset, onSelectInstance = () => undefined },
  ref,
) {
  const lighting = getStudioLighting(project.camera.lightingIntensity)
  const [measuredBounds, setMeasuredBounds] = useState<Record<string, LayoutBounds>>({})
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set())
  const handleBounds = useCallback((id: string, bounds: LayoutBounds) => {
    setMeasuredBounds((current) => current[id] === bounds ? current : { ...current, [id]: bounds })
  }, [])
  const layout = useMemo(() => calculateCompositionLayout(
    project.instances.filter((instance) => !failedIds.has(instance.id)).map((instance) => measuredBounds[instance.id] ?? approximateBounds(instance)),
    project.layout,
    project.heroInstanceId,
  ), [failedIds, measuredBounds, project.heroInstanceId, project.instances, project.layout])
  const positions = new Map(layout.items.map((item) => [item.id, item]))
  const span = Math.max(8, layout.bounds.max[0] - layout.bounds.min[0] + 2, layout.bounds.max[2] - layout.bounds.min[2] + 2)
  return (
    <Canvas
      className="box-canvas"
      shadows
      camera={{ position: [6.4, 5.2, 8.8], fov: 38 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={lighting.ambientIntensity} />
      <hemisphereLight args={['#ffffff', '#cad4e2', lighting.hemisphereIntensity]} />
      <directionalLight
        castShadow
        intensity={lighting.keyIntensity}
        position={lighting.keyPosition}
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight intensity={lighting.fillIntensity} position={lighting.fillPosition} />
      <StudioEnvironment intensityScale={lighting.environmentScale} />
      {project.instances.map((instance) => {
        const placement = positions.get(instance.id)
        return placement ? (
          <group key={instance.id}>
            <PackageModelErrorBoundary onError={() => setFailedIds((current) => new Set(current).add(instance.id))}>
              <Suspense fallback={null}>
                <PackageInstanceView
                  instance={instance}
                  position={placement.position}
                  rotationY={placement.rotationY}
                  selected={instance.id === project.selectedInstanceId}
                  onSelect={onSelectInstance}
                  onBounds={handleBounds}
                />
              </Suspense>
            </PackageModelErrorBoundary>
          </group>
        ) : null
      })}
      <group name="product-contact-shadow">
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.26}
          scale={span}
          blur={2.4}
          far={4}
        />
      </group>
      <CameraControls
        autoRotate={project.camera.autoRotate}
        command={command}
        bounds={layout.bounds}
        exportPreset={exportPreset}
      />
      <ExportController ref={ref} />
    </Canvas>
  )
})

const ExportController = forwardRef<BoxSceneHandle>(function ExportController(_, ref) {
  const renderer = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)

  useImperativeHandle(ref, () => ({
    exportTransparentPng: (options = { width: 800, height: 800, includeShadow: false }) => {
      if (!('isPerspectiveCamera' in camera)) return null
      return renderTransparentPng(renderer, scene, camera as PerspectiveCamera, {
        ...options,
        exportFov: EXPORT_CAMERA_FOV,
        shadowGroup: scene.getObjectByName('product-contact-shadow'),
      })
    },
  }), [camera, renderer, scene])

  return null
})

function CameraControls({
  autoRotate,
  command,
  bounds,
  exportPreset,
}: {
  autoRotate: boolean
  command: CameraCommandRequest | null
  bounds: { min: [number, number, number]; max: [number, number, number] }
  exportPreset: ExportPreset
}) {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const exportPresetRef = useRef(exportPreset)

  useEffect(() => {
    exportPresetRef.current = exportPreset
  }, [exportPreset])

  // The preview renders overscan around the fixed export frame. Changing the
  // frame updates projection only; it must never reset the user's orbit view.
  useEffect(() => {
    if (!('isPerspectiveCamera' in camera)) return
    applyExportFrameProjection(
      camera as PerspectiveCamera,
      size.width,
      size.height,
      exportPreset,
      EXPORT_CAMERA_FOV,
    )
  }, [camera, exportPreset, size.height, size.width])

  // Three.js camera objects are intentionally mutated by the scene controller.
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => {
    if (!controls.current || !('isPerspectiveCamera' in camera)) return
    const target = controls.current.target
    const direction: [number, number, number] = [
      target.x - camera.position.x,
      target.y - camera.position.y,
      target.z - camera.position.z,
    ]
    const fit = fitCompositionCamera({
      bounds,
      fov: EXPORT_CAMERA_FOV,
      aspect: exportPresetRef.current.width / exportPresetRef.current.height,
      viewDirection: direction,
    })
    camera.position.set(...fit.position)
    // eslint-disable-next-line react-hooks/immutability
    camera.near = fit.near
    camera.far = fit.far
    camera.updateProjectionMatrix()
    target.set(...fit.target)
    controls.current.update()
  }, [bounds, camera, size.height, size.width])

  // Three.js camera objects are intentionally mutated by the scene controller.
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => {
    if (!command || !controls.current) return
    const target = controls.current.target
    const preset = CAMERA_POSITIONS[command.type]
    const viewDirection: [number, number, number] = command.type === 'front'
      ? [0, 0, -1]
      : [-preset[0], -preset[1], -preset[2]]
    const fit = fitCompositionCamera({
      bounds,
      fov: EXPORT_CAMERA_FOV,
      aspect: exportPresetRef.current.width / exportPresetRef.current.height,
      viewDirection,
    })
    camera.position.set(...fit.position)
    // eslint-disable-next-line react-hooks/immutability
    camera.near = fit.near
    camera.far = fit.far
    camera.updateProjectionMatrix()
    target.set(...fit.target)
    controls.current.update()
  }, [bounds, camera, command, size.height, size.width])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={1.4}
      enableDamping
      minDistance={4.5}
      maxDistance={40}
      minPolarAngle={CAMERA_POLAR_LIMITS.min}
      maxPolarAngle={CAMERA_POLAR_LIMITS.max}
    />
  )
}
