import { useLayoutEffect, useRef, useState } from 'react'

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
}

export function ExportFrameOverlay({ presetId, onChange }: ExportFrameOverlayProps) {
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
