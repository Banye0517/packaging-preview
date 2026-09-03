import { Environment, Lightformer } from '@react-three/drei'

export function StudioEnvironment({ intensityScale = 1 }: { intensityScale?: number }) {
  return (
    <Environment resolution={128}>
      <Lightformer intensity={4.2 * intensityScale} position={[-4, 5, 3]} rotation={[0, Math.PI / 5, 0]} scale={[7, 4, 1]} />
      <Lightformer intensity={0.9 * intensityScale} position={[5, 1, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[4, 3, 1]} />
    </Environment>
  )
}
