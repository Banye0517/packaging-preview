import { createPackageInstance } from '../app/packageFactory'
import { createInitialProject } from '../app/projectReducer'
import type { ArtworkAsset, ProjectState, StageBackground } from '../app/types'
import type { ExportPresetId } from '../export/exportFrame'
import { assetUrl } from '../scene/assetUrl'

export interface DemoPresetBundle {
  id: string
  label: string
  badge: string
  projectName: string
  exportPresetId: ExportPresetId
  stageBg: StageBackground
  cameraView: 'front' | 'hero-gallery' | 'reset'
  build: () => Promise<ProjectState>
}

async function fetchUrlAsAsset(relPath: string, name: string): Promise<ArtworkAsset> {
  const url = assetUrl(relPath)
  const response = await fetch(url)
  const blob = await response.blob()
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Failed to read preset image: ${name}`))
    reader.readAsDataURL(blob)
  })
  const dims = await new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 1000 })
    img.onerror = () => resolve({ width: 800, height: 1000 })
    img.src = dataUrl
  })
  return {
    id: `preset-${name}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    mimeType: 'image/webp',
    width: dims.width,
    height: dims.height,
    previewUrl: dataUrl,
  }
}

export const DEMO_PRESETS: readonly DemoPresetBundle[] = [
  {
    id: 'gallery-morandi-6',
    label: '多品积木展台 · 6件全家福（图1同款）',
    badge: '推荐',
    projectName: 'BANYE LAB · 多品积木展台全家福',
    exportPresetId: 'portrait-2k',
    stageBg: 'studio',
    cameraView: 'hero-gallery',
    async build() {
      const [s1, s2, s3, s4, side, appleFront, appleBack] = await Promise.all([
        fetchUrlAsAsset('presets/serie-01-front.webp', 'serie-01-front.webp'),
        fetchUrlAsAsset('presets/serie-02-front.webp', 'serie-02-front.webp'),
        fetchUrlAsAsset('presets/serie-03-front.webp', 'serie-03-front.webp'),
        fetchUrlAsAsset('presets/serie-04-front.webp', 'serie-04-front.webp'),
        fetchUrlAsAsset('presets/serie-side.webp', 'serie-side.webp'),
        fetchUrlAsAsset('presets/apple-front.webp', 'apple-front.webp'),
        fetchUrlAsAsset('presets/apple-back.webp', 'apple-back.webp'),
      ])

      const makeBox = (id: string, front: ArtworkAsset, w: number, h: number, d: number) => {
        const inst = createPackageInstance('box', id)
        inst.box = { width: w, height: h, depth: d, radius: 6 }
        inst.faces.front = front
        inst.faces.back = front
        inst.faces.left = side
        inst.faces.right = side
        return inst
      }

      // 6 items matching 图1's front-tabletop + left-lavender + stepped-sage + right-peach hierarchy
      const p0 = makeBox('preset-1', s1, 118, 210, 76) // front-left on white tabletop
      const p1 = makeBox('preset-2', s3, 118, 202, 76) // front-right on white tabletop
      const p2 = makeBox('preset-3', s4, 128, 192, 82) // left on wide Lavender block
      const p3 = makeBox('preset-4', s2, 122, 224, 78) // center-mid on lower Sage block
      const p4 = makeBox('preset-5', s1, 126, 236, 82) // center-rear on tall Deep-Sage column
      const p5 = createPackageInstance('pouch', 'preset-6') // right on low Dusty Peach block
      p5.pouch = {
        faces: { front: appleFront, back: appleBack },
        width: 150,
        height: 196,
        thickness: 22,
        gussetDepth: 64,
        roundedCorners: true,
        closure: 'none',
      }

      const base = createInitialProject()
      return {
        ...base,
        name: 'BANYE LAB · 多品积木展台全家福',
        instances: [p0, p1, p2, p3, p4, p5],
        selectedInstanceId: p0.id,
        heroInstanceId: p4.id,
        layout: 'cluster',
        pedestal: {
          preset: 'gallery',
          color: 'morandi',
          cornerRadiusMm: 1,
        },
        camera: {
          autoRotate: false,
          lightingIntensity: 6,
        },
      }
    },
  },
  {
    id: 'apple-pouch-single',
    label: '绵绵苹果棒 · 自立袋正反面还原',
    badge: '实拍稿',
    projectName: '绵绵苹果棒 · 自立袋包装',
    exportPresetId: 'square-hd',
    stageBg: 'studio',
    cameraView: 'reset',
    async build() {
      const [front, back] = await Promise.all([
        fetchUrlAsAsset('presets/apple-front.webp', 'apple-front.webp'),
        fetchUrlAsAsset('presets/apple-back.webp', 'apple-back.webp'),
      ])
      const pouch = createPackageInstance('pouch', 'apple-pouch-1')
      pouch.pouch = {
        faces: { front, back },
        width: 176,
        height: 230,
        thickness: 20,
        gussetDepth: 68,
        roundedCorners: true,
        closure: 'none',
      }
      const base = createInitialProject()
      return {
        ...base,
        name: '绵绵苹果棒 · 自立袋包装',
        instances: [pouch],
        selectedInstanceId: pouch.id,
        heroInstanceId: pouch.id,
        pedestal: {
          preset: 'none',
          color: 'warm-white',
          cornerRadiusMm: 8,
        },
        camera: {
          autoRotate: false,
          lightingIntensity: 0,
        },
      }
    },
  },
  {
    id: 'baby-glacier-trio',
    label: '冰川母婴 · 礼盒+自立袋+抽纸组合',
    badge: '母婴套系',
    projectName: '母婴柔护系列 · 三件套展台',
    exportPresetId: 'landscape-2k',
    stageBg: 'pure-white',
    cameraView: 'hero-gallery',
    async build() {
      const [s1, s4, side, appleFront, appleBack] = await Promise.all([
        fetchUrlAsAsset('presets/serie-01-front.webp', 'serie-01-front.webp'),
        fetchUrlAsAsset('presets/serie-04-front.webp', 'serie-04-front.webp'),
        fetchUrlAsAsset('presets/serie-side.webp', 'serie-side.webp'),
        fetchUrlAsAsset('presets/apple-front.webp', 'apple-front.webp'),
        fetchUrlAsAsset('presets/apple-back.webp', 'apple-back.webp'),
      ])
      const tissue = createPackageInstance('face-tissue', 'trio-1')
      tissue.faceTissue.showTopSheet = true

      const pouch = createPackageInstance('pouch', 'trio-2')
      pouch.pouch = {
        faces: { front: appleFront, back: appleBack },
        width: 168,
        height: 220,
        thickness: 20,
        gussetDepth: 68,
        roundedCorners: true,
        closure: 'none',
      }

      const box = createPackageInstance('box', 'trio-3')
      box.box = { width: 156, height: 228, depth: 82, radius: 6 }
      box.faces.front = s1
      box.faces.back = s4
      box.faces.left = side
      box.faces.right = side

      const base = createInitialProject()
      return {
        ...base,
        name: '母婴柔护系列 · 三件套展台',
        instances: [tissue, pouch, box],
        selectedInstanceId: box.id,
        heroInstanceId: box.id,
        pedestal: {
          preset: 'gallery',
          color: 'glacier',
          cornerRadiusMm: 1,
        },
        camera: {
          autoRotate: false,
          lightingIntensity: 5,
        },
      }
    },
  },
]
