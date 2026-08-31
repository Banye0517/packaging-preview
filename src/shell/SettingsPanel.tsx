import type { ReactNode } from 'react'

const SETTINGS_TABS = [
  { id: 'artwork', label: '贴图' },
  { id: 'finish', label: '工艺' },
  { id: 'box', label: '盒型' },
  { id: 'camera', label: '相机' },
] as const

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id']

interface SettingsPanelProps {
  activeTab: SettingsTabId
  children: ReactNode
  onTabChange: (tab: SettingsTabId) => void
}

export function SettingsPanel({
  activeTab,
  children,
  onTabChange,
}: SettingsPanelProps) {
  return (
    <aside className="settings-panel" aria-label="包装设置">
      <div className="settings-tabs" role="tablist" aria-label="设置分类">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="settings-content" role="tabpanel">
        {children}
      </div>
    </aside>
  )
}
