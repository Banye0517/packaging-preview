import { useState } from 'react'

import type { ExportPreset } from '../export/exportFrame'
import type { PngExportSelection } from '../export/transparentPng'

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
  exportPreset: ExportPreset
  onExport: (selection: PngExportSelection) => void
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
  exportPreset,
  onExport,
}: ProjectToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const runMobileAction = (action: () => void) => {
    setMoreOpen(false)
    action()
  }

  return (
    <header className="project-toolbar" role="banner">
      <div className="brand-lockup" aria-label="BoxLab">
        <span className="brand-mark" aria-hidden="true">B</span>
        <strong>BoxLab</strong>
      </div>

      <div className="project-identity">
        <input
          aria-label="项目名称"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <span>已保存到本地</span>
      </div>

      <nav className="toolbar-actions" aria-label="工程操作">
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
            aria-expanded={exportOpen}
            aria-controls="png-export-menu"
            onClick={() => setExportOpen((open) => !open)}
          >
            导出
          </button>
          {exportOpen ? (
            <div id="png-export-menu" className="export-menu" role="menu" aria-label="PNG 导出选项">
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
                  导出 PNG（{includeShadow ? '有投影' : '无投影'}）· {exportPreset.width} × {exportPreset.height}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  )
}
