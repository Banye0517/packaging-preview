import { describe, expect, it } from 'vitest'

import { createDefaultBoxFinish } from './finishTypes'
import { finishUsesBaseArtwork, getActiveFinishFaces, getFinishMaterialProps } from './finishMaterial'

describe('finish overlay', () => {
  it('creates overlays only for enabled layers with masks', () => {
    const finish = createDefaultBoxFinish()
    finish.layers['gold-foil'].masks.front = {
      asset: { id: 'front', name: 'front.png', mimeType: 'image/png', width: 10, height: 10, previewUrl: 'data:image/png;base64,AAAA' },
      transform: { scale: 100, offsetX: 0, offsetY: 0, rotation: 0 },
    }
    finish.layers['silver-foil'].enabled = false
    finish.layers['silver-foil'].masks.back = finish.layers['gold-foil'].masks.front

    expect(getActiveFinishFaces(finish)).toEqual([{ kind: 'gold-foil', face: 'front' }])
  })

  it('maps reference finish kinds to visibly distinct physical materials', () => {
    const finish = createDefaultBoxFinish()

    expect(getFinishMaterialProps('gold-foil', finish.layers['gold-foil'].parameters)).toMatchObject({
      color: '#ffffff', metalness: 0.72, envMapIntensity: 2,
      clearcoat: 0.82, clearcoatRoughness: 0.04,
      emissive: '#9b5a08', emissiveIntensity: 0.18,
    })
    expect(getFinishMaterialProps('silver-foil', finish.layers['silver-foil'].parameters)).toMatchObject({
      color: '#ffffff', metalness: 0.76, envMapIntensity: 2.2,
      clearcoat: 0.86, clearcoatRoughness: 0.035,
      emissive: '#aeb8c6', emissiveIntensity: 0.12,
    })
    expect(getFinishMaterialProps('spot-uv', finish.layers['spot-uv'].parameters)).toMatchObject({ color: '#ffffff', metalness: 0, clearcoat: 1 })
    expect(getFinishMaterialProps('holographic', finish.layers.holographic.parameters).iridescence).toBe(0.22)
    expect(getFinishMaterialProps('holographic', finish.layers.holographic.parameters)).toMatchObject({
      color: '#ffffff', metalness: 0.05, opacity: 1,
      emissive: '#ffffff', emissiveIntensity: 0.08, iridescence: 0.22,
    })
    expect(finishUsesBaseArtwork('spot-uv')).toBe(true)
    expect(finishUsesBaseArtwork('emboss-deboss')).toBe(true)
    expect(finishUsesBaseArtwork('gold-foil')).toBe(false)
  })

  it('uses foil grain and normal strength in visible material values', () => {
    const fine = getFinishMaterialProps('gold-foil', { roughness: 0.08, grain: 0, normalStrength: 0 })
    const coarse = getFinishMaterialProps('gold-foil', { roughness: 0.08, grain: 100, normalStrength: 100 })

    expect(coarse.roughness).toBeGreaterThan(fine.roughness ?? 0)
    expect(coarse.bumpScale).toBeGreaterThan(fine.bumpScale ?? 0)
  })
})
