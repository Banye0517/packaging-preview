import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

import type { ProjectState } from '../app/types'

const NORMALIZED_HEIGHT = 3.6
const CORNER_SEGMENTS = 6

export function getRoundedBoxDimensions(box: ProjectState['box']) {
  const scale = NORMALIZED_HEIGHT / box.height
  return {
    width: box.width * scale,
    height: NORMALIZED_HEIGHT,
    depth: box.depth * scale,
    radius: box.radius * scale,
  }
}

export function createRoundedBoxGeometry(box: ProjectState['box']) {
  const dimensions = getRoundedBoxDimensions(box)
  return new RoundedBoxGeometry(
    dimensions.width,
    dimensions.height,
    dimensions.depth,
    CORNER_SEGMENTS,
    dimensions.radius,
  )
}
