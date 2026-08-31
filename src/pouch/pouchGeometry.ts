import {
  BufferGeometry,
  Float32BufferAttribute,
  PlaneGeometry,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

import type { PouchClosure } from '../app/types'

export interface PouchGeometryOptions {
  width: number
  height: number
  thickness: number
  gussetDepth: number
  roundedCorners: boolean
}

export interface PouchGeometryParts {
  front: BufferGeometry
  back: BufferGeometry
  leftSeal: BufferGeometry
  rightSeal: BufferGeometry
  topSeal: BufferGeometry
  gusset: BufferGeometry
}

function tagGeometry(
  geometry: BufferGeometry,
  role: string,
  printable: boolean,
  crossSection?: string,
) {
  geometry.userData.role = role
  geometry.userData.printable = printable
  if (crossSection) geometry.userData.crossSection = crossSection
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  return geometry
}

function createPanelGeometry(
  width: number,
  height: number,
  thickness: number,
  gussetDepth: number,
  cornerRadius: number,
  side: 1 | -1,
) {
  const geometry = new PlaneGeometry(width, height, 32, 40)
  const positions = geometry.getAttribute('position')
  const uvs = geometry.getAttribute('uv')
  const halfWidth = width / 2
  const halfHeight = height / 2
  const innerX = halfWidth - cornerRadius
  const innerY = halfHeight - cornerRadius

  for (let index = 0; index < positions.count; index += 1) {
    const u = uvs.getX(index)
    const v = uvs.getY(index)
    let x = (u - 0.5) * width
    let y = (v - 0.5) * height
    const dx = Math.abs(x) - innerX
    const dy = Math.abs(y) - innerY
    if (cornerRadius > 0.002 && dx > 0 && dy > 0) {
      const angle = Math.atan2(dy, dx)
      x = Math.sign(x) * (innerX + cornerRadius * Math.cos(angle))
      y = Math.sign(y) * (innerY + cornerRadius * Math.sin(angle))
    }

    const centerWeight = Math.pow(Math.sin(Math.PI * u), 1.4)
    const bodyBulge = thickness * 0.38 * centerWeight * Math.sin(Math.PI * v)
    const bottomExpansion = Math.max(0, (gussetDepth - thickness) / 2) *
      Math.pow(1 - v, 2.2) * centerWeight
    positions.setXYZ(index, x, y, side * (thickness / 2 + bodyBulge + bottomExpansion))
  }
  if (side === -1) geometry.scale(-1, 1, 1)
  positions.needsUpdate = true
  return geometry
}

function createGussetGeometry(width: number, depth: number, bottomY: number) {
  const geometry = new BufferGeometry()
  const segments = 16
  const foldLift = Math.min(0.08, depth * 0.08)
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let row = 0; row < 3; row += 1) {
    const v = row / 2
    const z = (v - 0.5) * depth
    const y = row === 1 ? bottomY + foldLift : bottomY
    for (let column = 0; column <= segments; column += 1) {
      const u = column / segments
      positions.push((u - 0.5) * width, y, z)
      uvs.push(u, v)
    }
  }

  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < segments; column += 1) {
      const first = row * (segments + 1) + column
      const next = first + segments + 1
      indices.push(first, next, first + 1, next, next + 1, first + 1)
    }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  return geometry
}

export function createPouchGeometry(options: PouchGeometryOptions): PouchGeometryParts {
  const scale = 3.2 / options.height
  const width = options.width * scale
  const height = options.height * scale
  const thickness = options.thickness * scale
  const gussetDepth = options.gussetDepth * scale
  const sealWidth = Math.max(width * 0.045, 0.08)
  const sealCornerRadius = Math.min(sealWidth * 0.42, thickness * 0.42)
  const cornerRadius = options.roundedCorners
    ? Math.min(width, height) * 0.055
    : 0.001
  const cornerInset = options.roundedCorners ? cornerRadius : 0
  const front = createPanelGeometry(
    width,
    height,
    thickness,
    gussetDepth,
    cornerRadius,
    1,
  )
  const back = createPanelGeometry(
    width,
    height,
    thickness,
    gussetDepth,
    cornerRadius,
    -1,
  )

  const sealDepth = thickness + 0.035
  const verticalSealHeight = Math.max(sealWidth, height - cornerInset * 2)
  const leftSeal = new RoundedBoxGeometry(
    sealWidth,
    verticalSealHeight,
    sealDepth,
    6,
    sealCornerRadius,
  )
  leftSeal.translate(-width / 2 + sealWidth / 2, 0, 0)
  const rightSeal = new RoundedBoxGeometry(
    sealWidth,
    verticalSealHeight,
    sealDepth,
    6,
    sealCornerRadius,
  )
  rightSeal.translate(width / 2 - sealWidth / 2, 0, 0)

  const topSealWidth = Math.max(sealWidth, width - cornerInset * 2)
  const topSeal = new RoundedBoxGeometry(
    topSealWidth,
    sealWidth,
    sealDepth,
    6,
    sealCornerRadius,
  )
  topSeal.translate(0, height / 2 - sealWidth / 2, 0)

  const gusset = createGussetGeometry(
    Math.max(0.01, width - sealWidth * 2),
    Math.max(gussetDepth, thickness),
    -height / 2 + 0.002,
  )

  topSeal.userData.outlineCorners = options.roundedCorners ? 'rounded' : 'square'
  leftSeal.userData.endInset = cornerInset
  rightSeal.userData.endInset = cornerInset

  return {
    front: tagGeometry(front, 'front-panel', true),
    back: tagGeometry(back, 'back-panel', true),
    leftSeal: tagGeometry(leftSeal, 'left-seal', false, 'rounded-bridge'),
    rightSeal: tagGeometry(rightSeal, 'right-seal', false, 'rounded-bridge'),
    topSeal: tagGeometry(topSeal, 'top-seal', false, 'rounded-bridge'),
    gusset: tagGeometry(gusset, 'open-bottom-gusset', false),
  }
}

export function getPouchClosureParts(closure: PouchClosure) {
  if (closure === 'zipper') return ['zipper-front', 'zipper-back'] as const
  if (closure === 'spout') return ['spout-neck', 'spout-cap'] as const
  return [] as const
}
