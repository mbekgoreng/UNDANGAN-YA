// ============================================================
// Left Sidebar — tabbed panel container
// ============================================================
import React from 'react';
import { useApp } from '../../app/AppContext';
import { AssetPanel } from '../AssetPanel/AssetPanel';
import { LayerPanel } from '../LayerPanel/LayerPanel';
import { ScenePanel } from '../SceneManager/ScenePanel';
import { TemplatesPanel } from '../SceneManager/TemplatesPanel';

const TABS = [
  { id: 'assets', label: 'Assets' },
  { id: 'layers', label: 'Layers' },
  { id: 'scenes', label: 'Scenes' },
  { id: 'templates', label: 'Templates' },
] as const;

export function Sidebar() {
  const { state, dispatch } = useApp();
  const { activeTab } = state;

  return (
    <div className="studio-sidebar">
      <div className="sidebar-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tab: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="sidebar-content" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'assets' && <AssetPanel />}
        {activeTab === 'layers' && <LayerPanel />}
        {activeTab === 'scenes' && <ScenePanel />}
        {activeTab === 'templates' && <TemplatesPanel />}
      </div>
    </div>
  );
}
