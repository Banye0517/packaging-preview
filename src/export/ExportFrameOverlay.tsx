import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

import type { PedestalColor, PedestalPreset, PedestalState } from '../app/types'

import {
  calculateExportFrameRect,
  getExportFramePadding,
  getExportPreset,
  type ExportPresetId,
  type ExportRatio,
} from './exportFrame'

interface ExportFrameOverlayProps {
  presetId: ExportPresetId
  onChange: (presetId: ExportPresetId) => void
  pedestal: PedestalState
  onPedestalPresetChange: (preset: PedestalPreset) => void
  onPedestalColorChange: (color: PedestalColor) => void
}

const PEDESTAL_PRESETS: Array<{ id: PedestalPreset; label: string }> = [
  { id: 'none', label: '关闭展台' },
  { id: 'steps', label: '阶梯展台' },
  { id: 'islands', label: '岛屿展台' },
  { id: 'horizontal', label: '横向展台' },
]

const PEDESTAL_COLORS: Array<{ id: PedestalColor; label: string; value: string }> = [
  { id: 'warm-white', label: '暖白', value: '#eee9df' },
  { id: 'light-gray', label: '浅灰', value: '#d8d8d5' },
  { id: 'white', label: '白色', value: '#ffffff' },
  { id: 'light-yellow', label: '浅黄', value: '#f2e5b9' },
  { id: 'light-pink', label: '浅粉', value: '#f3dedf' },
]

export function ExportFrameOverlay({
  presetId,
  onChange,
  pedestal,
  onPedestalPresetChange,
  onPedestalColorChange,
}: ExportFrameOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const preset = getExportPreset(presetId)
  const padding = getExportFramePadding(viewport.width)
  const frame = calculateExportFrameRect(viewport.width, viewport.height, preset, padding)

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
              {option.id === 'none' ? '无展台' : option.label.replace('展台', '')}
            </button>
          ))}
        </div>
        {pedestal.preset !== 'none' ? (
          <div className="pedestal-color-controls" aria-label="展台颜色">
            {PEDESTAL_COLORS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-label={option.label}
                aria-pressed={pedestal.color === option.id}
                onClick={() => onPedestalColorChange(option.id)}
                style={{ '--pedestal-swatch': option.value } as CSSProperties}
              />
            ))}
          </div>
        ) : null}
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
          <span>PNG 导出范围 · {preset.width} × {preset.height}</span>
        </div>
      </div>
    </div>
  )
}
