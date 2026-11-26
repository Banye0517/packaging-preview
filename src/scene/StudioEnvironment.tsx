import { Environment, Lightformer } from '@react-three/drei'

export function StudioEnvironment({ intensityScale = 1 }: { intensityScale?: number }) {
  return (
    <Environment resolution={128}>
      <Lightformer intensity={1.35 * intensityScale} position={[-4, 5, 4]} rotation={[0, Math.PI / 5, 0]} scale={[7, 4, 1]} />
      <Lightformer intensity={0.65 * intensityScale} position={[5, 2, 2]} rotation={[0, -Math.PI / 3, 0]} scale={[5, 3, 1]} />
      <Lightformer intensity={0.45 * intensityScale} position={[0, 6, -4]} rotation={[Math.PI / 2, 0, 0]} scale={[6, 6, 1]} />
    </Environment>
  )
}
