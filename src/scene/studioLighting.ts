export interface StudioLighting {
  ambientIntensity: number
  hemisphereIntensity: number
  keyIntensity: number
  fillIntensity: number
  environmentScale: number
  keyPosition: [number, number, number]
  fillPosition: [number, number, number]
}

export function getStudioLighting(intensity: number): StudioLighting {
  const clamped = Math.min(100, Math.max(-100, intensity))
  const weakened = clamped <= 0 ? (clamped + 100) / 100 : 1
  const enhanced = clamped > 0 ? clamped / 100 : 0

  return {
    ambientIntensity: 0.12 + 0.28 * weakened + 0.08 * enhanced,
    hemisphereIntensity: 0.18 + 0.32 * weakened + 0.18 * enhanced,
    keyIntensity: 0.4 + 3.6 * weakened + 2 * enhanced,
    fillIntensity: 0.08 + 0.37 * weakened + 0.25 * enhanced,
    environmentScale: 0.25 + 0.65 * weakened + 0.35 * enhanced,
    keyPosition: [-3, 7, 8],
    fillPosition: [5, 2, -3],
  }
}
