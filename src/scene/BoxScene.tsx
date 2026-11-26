import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { forwardRef, Suspense, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import {
  Color,
  DirectionalLight,
  NeutralToneMapping,
  Vector2,
  type PerspectiveCamera,
} from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import type { PackageInstance, ProjectState, StageBackground } from '../app/types'
import {
  applyExportFrameProjection,
  type ExportPreset,
} from '../export/exportFrame'
import { renderTransparentPng, type PngExportSelection } from '../export/transparentPng'
import { PackageInstanceView } from '../composition/PackageInstanceView'
import { PackageModelErrorBoundary } from '../composition/PackageModelErrorBoundary'
import type { LayoutBounds } from '../composition/layout'
import { calculatePedestalLayout } from '../pedestal/pedestalLayout'
import { PedestalStage } from '../pedestal/PedestalStage'
import { CAMERA_POLAR_LIMITS, CAMERA_POSITIONS } from './cameraLimits'
import type { CameraCommand } from './PreviewControls'
import { StudioEnvironment } from './StudioEnvironment'
import { getStudioLighting } from './studioLighting'
import { fitCompositionCamera } from './fitCompositionCamera'

export type ExtendedCameraCommand = CameraCommand | 'hero-gallery'

export interface CameraCommandRequest {
  type: ExtendedCameraCommand
  nonce: number
}

export const STAGE_BG_HEX: Record<StageBackground, string> = {
  studio: '#eaecf0',
  'pure-white': '#ffffff',
  'warm-sand': '#f2eee6',
  'dark-noir': '#141517',
}

interface BoxSceneProps {
  project: ProjectState
  command: CameraCommandRequest | null
  exportPreset: ExportPreset
  stageBg?: StageBackground
  onSelectInstance?: (id: string) => void
  onPedestalFallback?: (message: string | null) => void
}

export interface TurntableVideoResult {
  blob: Blob
  ext: 'mp4' | 'webm'
}

export interface BoxSceneHandle {
  exportTransparentPng: (options?: PngExportRequest) => string | null
  exportPosterPng: (options: { width: number; height: number; bgHex: string }) => string | null
  exportTurntableVideo: (options: { width: number; height: number; bgHex: string }) => Promise<TurntableVideoResult | null>
}

export type PngExportRequest = PngExportSelection

const EXPORT_CAMERA_FOV = 36

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
  { project, command, exportPreset, stageBg = 'studio', onSelectInstance = () => undefined, onPedestalFallback = () => undefined },
  ref,
) {
  const lighting = getStudioLighting(project.camera.lightingIntensity)
  const [measuredBounds, setMeasuredBounds] = useState<Record<string, LayoutBounds>>({})
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set())
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const handleBounds = useCallback((id: string, bounds: LayoutBounds) => {
    setMeasuredBounds((current) => current[id] === bounds ? current : { ...current, [id]: bounds })
  }, [])
  const layout = useMemo(() => calculatePedestalLayout(
    project.instances.filter((instance) => !failedIds.has(instance.id)).map((instance) => measuredBounds[instance.id] ?? approximateBounds(instance)),
    project.layout,
    project.heroInstanceId,
    project.pedestal.preset,
  ), [failedIds, measuredBounds, project.heroInstanceId, project.instances, project.layout, project.pedestal.preset])
  const positions = new Map(layout.items.map((item) => [item.id, item]))
  useEffect(() => {
    onPedestalFallback(layout.fallbackReason)
  }, [layout.fallbackReason, onPedestalFallback])
  const span = Math.max(8, layout.bounds.max[0] - layout.bounds.min[0] + 2, layout.bounds.max[2] - layout.bounds.min[2] + 2)
  const isGalleryStage = project.pedestal.preset === 'gallery'

  return (
    <Canvas
      className="box-canvas"
      shadows
      camera={{ position: [5.4, 3.8, 9.2], fov: EXPORT_CAMERA_FOV }}
      gl={{
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        toneMapping: NeutralToneMapping,
        toneMappingExposure: 1.0,
      }}
    >
      <ambientLight intensity={lighting.ambientIntensity} />
      <hemisphereLight args={['#ffffff', '#d8dee9', lighting.hemisphereIntensity]} />
      <directionalLight
        castShadow
        intensity={lighting.keyIntensity}
        position={lighting.keyPosition}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.5}
        shadow-camera-far={32}
        shadow-bias={-0.0003}
        shadow-normalBias={0.015}
      />
      <directionalLight intensity={lighting.fillIntensity} position={lighting.fillPosition} />
      <CameraHeadlight intensity={lighting.cameraFillIntensity} />
      <StudioEnvironment intensityScale={lighting.environmentScale} />
      <PedestalStage blocks={layout.pedestals} color={project.pedestal.color} cornerRadiusMm={project.pedestal.cornerRadiusMm} />
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
      <group name="product-contact-shadow" visible={!isGalleryStage}>
        <ContactShadows
          position={[0, 0.002, 0]}
          opacity={stageBg === 'dark-noir' ? 0.45 : 0.22}
          scale={span}
          blur={2.4}
          far={4}
        />
      </group>
      <CameraControls
        controlsRef={controlsRef}
        autoRotate={project.camera.autoRotate}
        command={command}
        bounds={layout.bounds}
        exportPreset={exportPreset}
        isGalleryStage={isGalleryStage}
      />
      <ExportController ref={ref} controlsRef={controlsRef} />
    </Canvas>
  )
})

/** Gentle soft fill light aligned with the camera so rotating 180° to inspect back labels stays evenly lit. */
function CameraHeadlight({ intensity }: { intensity: number }) {
  const lightRef = useRef<DirectionalLight>(null)
  useFrame(({ camera }) => {
    if (lightRef.current) {
      lightRef.current.position.copy(camera.position)
    }
  })
  return <directionalLight ref={lightRef} intensity={intensity} />
}

const ExportController = forwardRef<
  BoxSceneHandle,
  { controlsRef: React.RefObject<OrbitControlsImpl | null> }
>(function ExportController({ controlsRef }, ref) {
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
    exportPosterPng: ({ width, height, bgHex }) => {
      if (!('isPerspectiveCamera' in camera)) return null
      const pCam = camera as PerspectiveCamera
      const prevSize = renderer.getSize(new Vector2())
      const prevRatio = renderer.getPixelRatio()
      const prevBg = scene.background
      const prevAspect = pCam.aspect
      const prevFov = pCam.fov
      const prevProj = pCam.projectionMatrix.clone()
      const prevProjInv = pCam.projectionMatrixInverse.clone()

      renderer.setPixelRatio(1)
      renderer.setSize(width, height, false)
      scene.background = new Color(bgHex)
      pCam.aspect = width / height
      pCam.fov = EXPORT_CAMERA_FOV
      pCam.updateProjectionMatrix()
      try {
        renderer.render(scene, pCam)
        return renderer.domElement.toDataURL('image/png')
      } finally {
        scene.background = prevBg
        pCam.aspect = prevAspect
        pCam.fov = prevFov
        pCam.projectionMatrix.copy(prevProj)
        pCam.projectionMatrixInverse.copy(prevProjInv)
        renderer.setPixelRatio(prevRatio)
        renderer.setSize(prevSize.x, prevSize.y, false)
        renderer.render(scene, pCam)
      }
    },
    exportTurntableVideo: async ({ width, height, bgHex }) => {
      if (!('isPerspectiveCamera' in camera) || typeof MediaRecorder === 'undefined') return null
      const pCam = camera as PerspectiveCamera
      // Cap video side at 1280px for smooth fast encoding
      const maxDim = 1280
      const scale = Math.min(1, maxDim / Math.max(width, height))
      const vw = Math.round((width * scale) / 2) * 2
      const vh = Math.round((height * scale) / 2) * 2

      const offCanvas = document.createElement('canvas')
      offCanvas.width = vw
      offCanvas.height = vh
      const ctx = offCanvas.getContext('2d')
      if (!ctx) return null

      const mimeCandidates = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ]
      const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
      const stream = offCanvas.captureStream(30)
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 6_000_000 } : undefined)
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      const donePromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }))
      })

      const prevSize = renderer.getSize(new Vector2())
      const prevRatio = renderer.getPixelRatio()
      const prevBg = scene.background
      const prevAspect = pCam.aspect
      const prevFov = pCam.fov
      const prevProj = pCam.projectionMatrix.clone()
      const prevProjInv = pCam.projectionMatrixInverse.clone()
      const startPos = pCam.position.clone()
      const target = controlsRef.current ? controlsRef.current.target.clone() : new Color(0, 0, 0) as never
      const cx = controlsRef.current?.target.x ?? 0
      const cy = controlsRef.current?.target.y ?? 0
      const cz = controlsRef.current?.target.z ?? 0
      const dx = startPos.x - cx
      const dz = startPos.z - cz
      const radius = Math.hypot(dx, dz)
      const baseAngle = Math.atan2(dx, dz)

      renderer.setPixelRatio(1)
      renderer.setSize(vw, vh, false)
      scene.background = new Color(bgHex)
      pCam.aspect = vw / vh
      pCam.fov = EXPORT_CAMERA_FOV
      pCam.updateProjectionMatrix()

      recorder.start()
      const totalFrames = 135 // 4.5s at 30fps
      try {
        for (let i = 0; i < totalFrames; i += 1) {
          const theta = baseAngle + (i / totalFrames) * Math.PI * 2
          pCam.position.set(cx + Math.sin(theta) * radius, startPos.y, cz + Math.cos(theta) * radius)
          pCam.lookAt(cx, cy, cz)
          renderer.render(scene, pCam)
          ctx.drawImage(renderer.domElement, 0, 0, vw, vh)
          await new Promise((r) => setTimeout(r, 33))
        }
      } finally {
        pCam.position.copy(startPos)
        if (controlsRef.current && target) pCam.lookAt(controlsRef.current.target)
        scene.background = prevBg
        pCam.aspect = prevAspect
        pCam.fov = prevFov
        pCam.projectionMatrix.copy(prevProj)
        pCam.projectionMatrixInverse.copy(prevProjInv)
        renderer.setPixelRatio(prevRatio)
        renderer.setSize(prevSize.x, prevSize.y, false)
        renderer.render(scene, pCam)
      }
      recorder.stop()
      const blob = await donePromise
      const ext = (recorder.mimeType || mimeType).includes('mp4') ? 'mp4' : 'webm'
      return { blob, ext }
    },
  }), [camera, controlsRef, renderer, scene])

  return null
})

function CameraControls({
  controlsRef,
  autoRotate,
  command,
  bounds,
  exportPreset,
  isGalleryStage,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  autoRotate: boolean
  command: CameraCommandRequest | null
  bounds: { min: [number, number, number]; max: [number, number, number] }
  exportPreset: ExportPreset
  isGalleryStage: boolean
}) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const exportPresetRef = useRef(exportPreset)

  useEffect(() => {
    exportPresetRef.current = exportPreset
  }, [exportPreset])

  // Three.js camera objects are intentionally mutated by the scene controller.
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => {
    if (!controlsRef.current || !('isPerspectiveCamera' in camera)) return
    const target = controlsRef.current.target
    const direction: [number, number, number] = isGalleryStage
      ? [-0.06, -0.16, -1]
      : [
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
    const zoomScale = isGalleryStage ? 0.74 : 1
    const targetYOffset = isGalleryStage ? 0.28 : 0
    const adjTarget: [number, number, number] = [fit.target[0], fit.target[1] + targetYOffset, fit.target[2]]
    const dx = fit.position[0] - fit.target[0]
    const dy = fit.position[1] - fit.target[1]
    const dz = fit.position[2] - fit.target[2]
    camera.position.set(
      adjTarget[0] + dx * zoomScale,
      adjTarget[1] + dy * zoomScale,
      adjTarget[2] + dz * zoomScale,
    )
    // eslint-disable-next-line react-hooks/immutability
    camera.near = fit.near
    camera.far = fit.far + 60
    camera.updateProjectionMatrix()
    target.set(...adjTarget)
    controlsRef.current.update()
  }, [bounds, camera, controlsRef, isGalleryStage, size.height, size.width])

  // Three.js camera objects are intentionally mutated by the scene controller.
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => {
    if (!command || !controlsRef.current) return
    const target = controlsRef.current.target
    let viewDirection: [number, number, number]
    if (command.type === 'front') {
      viewDirection = [0, 0, -1]
    } else if (command.type === 'hero-gallery') {
      viewDirection = [-0.05, -0.15, -1]
    } else {
      const preset = CAMERA_POSITIONS[command.type]
      viewDirection = [-preset[0], -preset[1], -preset[2]]
    }
    const fit = fitCompositionCamera({
      bounds,
      fov: EXPORT_CAMERA_FOV,
      aspect: exportPresetRef.current.width / exportPresetRef.current.height,
      viewDirection,
    })
    const zoomScale = isGalleryStage && command.type !== 'reset' ? 0.74 : 1
    const targetYOffset = isGalleryStage && command.type !== 'reset' ? 0.28 : 0
    const adjTarget: [number, number, number] = [fit.target[0], fit.target[1] + targetYOffset, fit.target[2]]
    const dx = fit.position[0] - fit.target[0]
    const dy = fit.position[1] - fit.target[1]
    const dz = fit.position[2] - fit.target[2]
    camera.position.set(
      adjTarget[0] + dx * zoomScale,
      adjTarget[1] + dy * zoomScale,
      adjTarget[2] + dz * zoomScale,
    )
    // eslint-disable-next-line react-hooks/immutability
    camera.near = fit.near
    camera.far = fit.far + 60
    camera.updateProjectionMatrix()
    target.set(...adjTarget)
    controlsRef.current.update()
  }, [bounds, camera, command, controlsRef, isGalleryStage, size.height, size.width])

  useEffect(() => {
    if (!('isPerspectiveCamera' in camera)) return
    applyExportFrameProjection(
      camera as PerspectiveCamera,
      size.width,
      size.height,
      exportPreset,
      EXPORT_CAMERA_FOV,
    )
  }, [bounds, camera, command?.nonce, exportPreset, size.height, size.width])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={1.4}
      enableDamping
      minDistance={3.2}
      maxDistance={42}
      minPolarAngle={CAMERA_POLAR_LIMITS.min}
      maxPolarAngle={CAMERA_POLAR_LIMITS.max}
    />
  )
}
