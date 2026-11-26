export interface StudioLighting {
  ambientIntensity: number
  hemisphereIntensity: number
  keyIntensity: number
  fillIntensity: number
  cameraFillIntensity: number
  environmentScale: number
  keyPosition: [number, number, number]
  fillPosition: [number, number, number]
}

/**
 * Calibrated commercial studio lighting:
 * Keeps #ffffff packaging around #f5f6f8 on the key-lit plane and #dfe3ea on shaded side planes
 * (never clipping cream/pastel mother-baby artwork to pure white), while casting crisp diagonal
 * studio shadows across architectural risers & tabletops.
 */
export function getStudioLighting(intensity: number): StudioLighting {
  const clamped = Math.min(100, Math.max(-100, intensity))
  const scale = clamped <= 0
    ? 0.55 + 0.45 * ((clamped + 100) / 100)
    : 1 + 0.42 * (clamped / 100)

  return {
    ambientIntensity: 0.36 * scale,
    hemisphereIntensity: 0.44 * scale,
    keyIntensity: 1.38 * scale,
    fillIntensity: 0.42 * scale,
    cameraFillIntensity: 0.32 * scale,
    environmentScale: 0.28 * scale,
    keyPosition: [-5.2, 7.6, 6.4],
    fillPosition: [5.6, 3.2, 2.4],
  }
}
