// ============================================================
// UndangYa! HTML Visual Studio — StudioSidebar
// Left sidebar host containing all editing, layer, asset & nav panels
// ============================================================
import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { DomLayersPanel } from './DomLayersPanel';
import { ProjectPanel } from './ProjectPanel';
import { AssetLibraryPanel } from './AssetLibraryPanel';
import { SceneNavigatorPanel } from './SceneNavigatorPanel';
import { HistoryPanel } from './HistoryPanel';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import './StudioSidebar.css';

export function StudioSidebar() {
  const { activeTab, setActiveTab, health, project } = useStudio();

  const issueCount = health ? health.issues.filter(i => i.severity === 'error' || i.severity === 'warning').length : 0;
  const patchCount = project?.patches?.length || 0;

  return (
    <aside className="studio-sidebar-root">
      {/* Tab Navigation Strip */}
      <div className="sidebar-tab-strip">
        <button
          className={`sidebar-tab-btn ${activeTab === 'layers' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('layers')}
          title="Struktur Hirarki Elemen DOM"
        >
          Lapisan
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'assets' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('assets')}
          title="Pustaka Aset & Dekorasi"
        >
          Aset
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'scenes' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('scenes')}
          title="Daftar Adegan & Bagian Undangan"
        >
          Adegan
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'project' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('project')}
          title="Berkas Proyek & Snapshot Aman"
        >
          Proyek
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'history' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('history')}
          title="Riwayat Patch Perbaikan"
        >
          Riwayat {patchCount > 0 && <span className="sidebar-badge">{patchCount}</span>}
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'diagnostics' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
          title="Diagnostik Kesehatan Proyek"
        >
          Cek {issueCount > 0 && <span className="sidebar-badge badge-alert">{issueCount}</span>}
        </button>
      </div>

      {/* Main Tab Panel Content */}
      <div className="sidebar-content-area">
        {activeTab === 'layers' && <DomLayersPanel />}
        {activeTab === 'assets' && <AssetLibraryPanel />}
        {activeTab === 'scenes' && <SceneNavigatorPanel />}
        {activeTab === 'project' && <ProjectPanel />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'diagnostics' && <DiagnosticsPanel />}
      </div>
    </aside>
  );
}
