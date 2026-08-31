import { Environment, Lightformer } from '@react-three/drei'

export function StudioEnvironment() {
  return (
    <Environment resolution={128}>
      <Lightformer intensity={4.5} position={[0, 5, -4]} scale={[8, 4, 1]} />
      <Lightformer intensity={3} position={[-5, 1, 2]} rotation={[0, Math.PI / 2, 0]} scale={[5, 3, 1]} />
      <Lightformer intensity={2.2} position={[5, -1, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[4, 2, 1]} />
    </Environment>
  )
}
