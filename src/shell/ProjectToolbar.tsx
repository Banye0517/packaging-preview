import { useState } from 'react'

import type { ExportPreset } from '../export/exportFrame'
import type { PngExportSelection } from '../export/transparentPng'
import { DEMO_PRESETS, type DemoPresetBundle } from '../presets/demoPresets'

interface ProjectToolbarProps {
  name: string
  onNameChange: (name: string) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onHelp: () => void
  onLoadPreset?: (preset: DemoPresetBundle) => void
  presetLoading?: boolean
  videoExporting?: boolean
  exportPreset: ExportPreset
  onExport: (selection: PngExportSelection) => void
  onExportPoster?: () => void
  onExportVideo?: () => void
}

export function ProjectToolbar({
  name,
  onNameChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNew,
  onOpen,
  onSave,
  onHelp,
  onLoadPreset,
  presetLoading = false,
  videoExporting = false,
  exportPreset,
  onExport,
  onExportPoster,
  onExportVideo,
}: ProjectToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const runMobileAction = (action: () => void) => {
    setMoreOpen(false)
    action()
  }

  return (
    <header className="project-toolbar" role="banner">
      <div className="brand-lockup" aria-label="BoxLab">
        <span className="brand-mark" aria-hidden="true">B</span>
        <div className="brand-text">
          <strong>BoxLab</strong>
          <small>3D 包装与展台工作台</small>
        </div>
      </div>

      <div className="project-identity">
        <input
          aria-label="项目名称"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <span>本地实时渲染 · 图片不上传服务器</span>
      </div>

      <nav className="toolbar-actions" aria-label="工程操作">
        {onLoadPreset ? (
          <div className="export-menu-wrap">
            <button
              type="button"
              className="preset-trigger-btn"
              disabled={presetLoading}
              aria-expanded={presetOpen}
              onClick={() => {
                setExportOpen(false)
                setPresetOpen((v) => !v)
              }}
            >
              {presetLoading ? '加载示例中…' : '示例模板 ▾'}
            </button>
            {presetOpen ? (
              <div className="export-menu preset-menu" role="menu" aria-label="一键加载示例">
                {DEMO_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setPresetOpen(false)
                      onLoadPreset(p)
                    }}
                  >
                    <span className="preset-badge">{p.badge}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <button type="button" disabled={!canUndo} onClick={onUndo}>撤销</button>
        <button type="button" disabled={!canRedo} onClick={onRedo}>重做</button>
        <button type="button" className="desktop-action" onClick={onNew}>新建</button>
        <button type="button" className="desktop-action" onClick={onOpen}>打开</button>
        <button type="button" className="desktop-action" onClick={onSave}>保存</button>
        <button
          type="button"
          className="mobile-action"
          aria-expanded={moreOpen}
          aria-controls="mobile-project-menu"
          onClick={() => setMoreOpen((open) => !open)}
        >
          更多
        </button>
        {moreOpen ? (
          <div
            id="mobile-project-menu"
            className="mobile-more-menu"
            role="menu"
            aria-label="更多工程操作"
          >
            <button type="button" role="menuitem" disabled={!canUndo} onClick={() => runMobileAction(onUndo)}>撤销</button>
            <button type="button" role="menuitem" disabled={!canRedo} onClick={() => runMobileAction(onRedo)}>重做</button>
            <button type="button" role="menuitem" onClick={() => runMobileAction(onNew)}>新建</button>
            <button type="button" role="menuitem" onClick={() => runMobileAction(onOpen)}>打开</button>
            <button type="button" role="menuitem" onClick={() => runMobileAction(onSave)}>保存</button>
            <button type="button" role="menuitem" onClick={() => runMobileAction(onHelp)}>帮助</button>
          </div>
        ) : null}
        <button type="button" onClick={onHelp}>帮助</button>
        <div className="export-menu-wrap">
          <button
            type="button"
            className="export-button"
            disabled={videoExporting}
            aria-expanded={exportOpen}
            aria-controls="png-export-menu"
            onClick={() => {
              setPresetOpen(false)
              setExportOpen((open) => !open)
            }}
          >
            {videoExporting ? '录制 360° 视频中…' : '导出 ▾'}
          </button>
          {exportOpen ? (
            <div id="png-export-menu" className="export-menu" role="menu" aria-label="导出选项">
              {[false, true].map((includeShadow) => (
                <button
                  key={includeShadow ? 'shadow' : 'transparent'}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setExportOpen(false)
                    onExport({
                      width: exportPreset.width,
                      height: exportPreset.height,
                      includeShadow,
                    })
                  }}
                >
                  导出透明 PNG（{includeShadow ? '有投影' : '无投影'}）· {exportPreset.width} × {exportPreset.height}
                </button>
              ))}
              {onExportPoster ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setExportOpen(false)
                    onExportPoster()
                  }}
                >
                  导出场景海报 PNG（含背景与展台）· {exportPreset.width} × {exportPreset.height}
                </button>
              ) : null}
              {onExportVideo ? (
                <button
                  type="button"
                  role="menuitem"
                  className="export-video-item"
                  onClick={() => {
                    setExportOpen(false)
                    onExportVideo()
                  }}
                >
                  ★ 导出 360° 旋转短视频（4.5秒无 UI 循环）
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  )
}
