export const CAMERA_POLAR_LIMITS = {
  min: 0.03,
  max: Math.PI - 0.03,
} as const

export const CAMERA_POSITIONS = {
  fit: [4.8, 3.8, 6.4],
  front: [0, 0.2, 8.8],
  reset: [6.4, 5.2, 8.8],
} as const
