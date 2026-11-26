import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

import type { PedestalColor, PedestalPreset, PedestalState, StageBackground } from '../app/types'

import {
  calculateExportFrameRect,
  calculatePreviewStageLayout,
  getExportFramePadding,
  getExportPreset,
  type ExportPresetId,
  type ExportRatio,
} from './exportFrame'

interface ExportFrameOverlayProps {
  presetId: ExportPresetId
  onChange: (presetId: ExportPresetId) => void
  pedestal: PedestalState
  pedestalNotice?: string | null
  stageBg?: StageBackground
  onStageBgChange?: (bg: StageBackground) => void
  onPedestalPresetChange: (preset: PedestalPreset) => void
  onPedestalColorChange: (color: PedestalColor) => void
  onPedestalRadiusChange: (radius: number) => void
}

const PEDESTAL_PRESETS: Array<{ id: PedestalPreset; label: string; short: string }> = [
  { id: 'none', label: '关闭展台', short: '无展台' },
  { id: 'gallery', label: '建筑积木展台', short: '积木舞台' },
  { id: 'steps', label: '阶梯展台', short: '阶梯' },
  { id: 'islands', label: '岛屿展台', short: '岛屿' },
  { id: 'horizontal', label: '横向展台', short: '横向' },
]

const PEDESTAL_COLORS: Array<{ id: PedestalColor; label: string; value: string }> = [
  { id: 'morandi', label: '莫兰迪撞色（雾紫+鼠尾草绿+蜜桃粉）', value: 'conic-gradient(#c8bee0 0 120deg, #a3be9b 120deg 240deg, #ebc6bc 240deg 360deg)' },
  { id: 'glacier', label: '冰川母婴（天蓝+薄荷）', value: 'conic-gradient(#c9dff2 0 180deg, #d2ebe3 180deg 360deg)' },
  { id: 'oatmeal', label: '奶油燕麦', value: 'conic-gradient(#dfd2c0 0 180deg, #edd9cb 180deg 360deg)' },
  { id: 'white', label: '白色', value: '#ffffff' },
  { id: 'warm-white', label: '暖白', value: '#eee9df' },
  { id: 'light-gray', label: '浅灰', value: '#d8d8d5' },
  { id: 'light-yellow', label: '浅黄', value: '#f2e5b9' },
  { id: 'light-pink', label: '浅粉', value: '#f3dedf' },
]

const STAGE_BGS: Array<{ id: StageBackground; label: string; swatch: string }> = [
  { id: 'studio', label: '影棚柔灰', swatch: '#e9ecf1' },
  { id: 'pure-white', label: '纯净白底', swatch: '#ffffff' },
  { id: 'warm-sand', label: '暖米留白', swatch: '#f2eee5' },
  { id: 'dark-noir', label: '暗调黑棚', swatch: '#181a1d' },
]

export function ExportFrameOverlay({
  presetId,
  onChange,
  pedestal,
  pedestalNotice,
  stageBg = 'studio',
  onStageBgChange,
  onPedestalPresetChange,
  onPedestalColorChange,
  onPedestalRadiusChange,
}: ExportFrameOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const preset = getExportPreset(presetId)
  const padding = getExportFramePadding(viewport.width)
  const stageLayout = viewport.width > 0 && viewport.height > 0
    ? calculatePreviewStageLayout(viewport.width, viewport.height, preset)
    : null
  const frame = stageLayout
    ? stageLayout.frame
    : calculateExportFrameRect(viewport.width, viewport.height, preset, padding)

  useLayoutEffect(() => {
    const element = rootRef.current
    if (!element) return
    const update = () => setViewport({ width: element.clientWidth, height: element.clientHeight })
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const selectRatio = (ratio: ExportRatio) => {
    if (ratio === '1:1') onChange(preset.ratio === '1:1' ? presetId : 'square-standard')
    else if (ratio === '16:9') onChange('landscape-2k')
    else onChange('portrait-2k')
  }

  return (
    <div ref={rootRef} className="export-frame-ui">
      <div
        className={`preview-primary-toolbar preview-primary-toolbar--${stageLayout?.placement ?? 'horizontal-rails'}`}
        style={stageLayout ? stageLayout.primaryToolbar : undefined}
      >
        <div className="export-ratio-controls" aria-label="导出画幅">
          {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
            <button
              key={ratio}
              type="button"
              aria-label={ratio}
              aria-pressed={preset.ratio === ratio}
              onClick={() => selectRatio(ratio)}
            >
              {ratio}
            </button>
          ))}
          {preset.ratio === '1:1' ? (
            <div className="export-resolution-controls" aria-label="正方形导出尺寸">
              {(['square-standard', 'square-hd'] as const).map((id) => {
                const option = getExportPreset(id)
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={presetId === id}
                    onClick={() => onChange(id)}
                  >
                    {option.width} × {option.height}
                  </button>
                )
              })}
            </div>
          ) : null}
          {onStageBgChange ? (
            <div className="stage-bg-controls" aria-label="画布背景">
              {STAGE_BGS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  title={`背景：${bg.label}`}
                  aria-label={`背景：${bg.label}`}
                  aria-pressed={stageBg === bg.id}
                  onClick={() => onStageBgChange(bg.id)}
                  style={{ '--pedestal-swatch': bg.swatch } as CSSProperties}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="pedestal-controls" aria-label="展台设置">
          <div className="pedestal-preset-controls">
            {PEDESTAL_PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-label={option.label}
                aria-pressed={pedestal.preset === option.id}
                onClick={() => onPedestalPresetChange(option.id)}
              >
                {option.short}
              </button>
            ))}
          </div>
          {pedestal.preset !== 'none' ? (
            <div className="pedestal-color-controls" aria-label="展台配色">
              {PEDESTAL_COLORS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  title={option.label}
                  aria-label={option.label}
                  aria-pressed={pedestal.color === option.id}
                  onClick={() => onPedestalColorChange(option.id)}
                  style={{ '--pedestal-swatch': option.value } as CSSProperties}
                />
              ))}
            </div>
          ) : null}
          {pedestal.preset !== 'none' && pedestal.preset !== 'gallery' ? (
            <label className="pedestal-radius-control">
              <span>圆角 {pedestal.cornerRadiusMm} mm</span>
              <input
                aria-label="展台圆角"
                type="range"
                min={0}
                max={30}
                step={1}
                value={pedestal.cornerRadiusMm}
                onChange={(event) => onPedestalRadiusChange(Number(event.currentTarget.value))}
              />
            </label>
          ) : null}
        </div>
        {pedestalNotice ? <div className="pedestal-notice" role="status">{pedestalNotice}</div> : null}
      </div>
      <div
        data-testid="export-frame-mask"
        className="export-frame-overlay export-frame-overlay--pass-through"
        aria-hidden="true"
      >
        <div className="export-frame-shade export-frame-shade--top" style={{ height: frame.top }} />
        <div className="export-frame-shade export-frame-shade--bottom" style={{ top: frame.top + frame.height }} />
        <div className="export-frame-shade export-frame-shade--left" style={{ top: frame.top, width: frame.left, height: frame.height }} />
        <div className="export-frame-shade export-frame-shade--right" style={{ top: frame.top, left: frame.left + frame.width, height: frame.height }} />
        <div
          className="export-frame"
          style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }}
        >
          <span>导出取景 · {preset.width} × {preset.height}</span>
        </div>
      </div>
    </div>
  )
}
