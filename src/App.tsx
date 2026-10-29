// ============================================================
// Main App
// ============================================================
import React, { useEffect, useRef } from 'react';
import { AppProvider, useApp } from './app/AppContext';
import { useAutosave } from './app/useAutosave';
import { listProjects } from './storage/db';
import { seedSampleAssetsIfEmpty } from './assets/seedAssets';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { CanvasEditor } from './components/CanvasEditor/CanvasEditor';
import { PropertiesPanel } from './components/PropertiesPanel/PropertiesPanel';
import { Timeline } from './components/Timeline/Timeline';
import { PreviewMode } from './components/Preview/PreviewMode';
import { ExportDialog } from './components/ExportDialog/ExportDialog';
import { ProjectManager } from './components/ProjectManager/ProjectManager';
import { EventPanel } from './components/EventPanel/EventPanel';
import './styles/global.css';

const LAST_PROJECT_KEY = 'undangya-last-project-id';

function Studio() {
  useAutosave();
  const { state, dispatch } = useApp();
  const restoredRef = useRef(false);

  // F-02: restore the most recently used project on startup instead of
  // always starting from (and autosaving) a fresh template copy.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    // Read the remembered id synchronously, before the persist effect below
    // overwrites it with the bootstrap template's id.
    const lastId = localStorage.getItem(LAST_PROJECT_KEY);
    (async () => {
      try {
        const projects = await listProjects();
        if (projects.length === 0) return;
        const sorted = [...projects].sort((a, b) => b.meta.updatedAt.localeCompare(a.meta.updatedAt));
        const target = sorted.find(p => p.meta.id === lastId) ?? sorted[0];
        if (target) dispatch({ type: 'LOAD_PROJECT', project: target });
      } catch (err) {
        console.error('Failed to restore last project:', err);
      }
    })();
  }, [dispatch]);

  // Remember which project is open so the next visit restores it.
  useEffect(() => {
    try {
      localStorage.setItem(LAST_PROJECT_KEY, state.project.meta.id);
    } catch {
      // storage unavailable (private mode) — restore falls back to most recent
    }
  }, [state.project.meta.id]);

  // Initialize sample assets on startup if needed
  useEffect(() => {
    seedSampleAssetsIfEmpty().then(list => {
      dispatch({ type: 'SET_ASSETS', assets: list });
    });
  }, [dispatch]);

  return (
    <>
      <div className="studio-layout">
        <Toolbar />
        <Sidebar />
        <div className="studio-canvas-area">
          <CanvasEditor />
        </div>
        <div className="studio-inspector">
          <PropertiesPanel />
        </div>
        <div className="studio-timeline">
          <Timeline />
        </div>
      </div>

      {state.showPreview && <PreviewMode />}
      {state.showExportDialog && <ExportDialog />}
      {state.showProjectManager && <ProjectManager />}
      {state.showEventPanel && <EventPanel />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Studio />
    </AppProvider>
  );
}
