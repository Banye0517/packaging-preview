const WORLD_UNITS_PER_MM = 3.6 / 220
const EPSILON = 1e-3

export function getSafePedestalRadius(radiusMm: number, width: number, height: number, depth: number) {
  if (!Number.isFinite(radiusMm) || radiusMm <= 0) return 0
  return Math.max(0, Math.min(
    radiusMm * WORLD_UNITS_PER_MM,
    width / 2 - EPSILON,
    height / 2 - EPSILON,
    depth / 2 - EPSILON,
  ))
}
