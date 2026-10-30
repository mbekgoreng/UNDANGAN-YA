// ============================================================
// UndangYa! Suite — App Entry Point
// Hosts HTML Visual Studio (Primary) & Motion Studio Lite
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { HtmlVisualStudio } from './HtmlVisualStudio';
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

function MotionStudio() {
  useAutosave();
  const { state, dispatch } = useApp();
  const restoredRef = useRef(false);

  // Restore the most recently used project on startup
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
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
      // storage unavailable
    }
  }, [state.project.meta.id]);

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
  const [activeStudio, setActiveStudio] = useState<'html' | 'motion'>('html');

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Studio Mode Quick Switcher in header */}
      <div
        style={{
          position: 'fixed',
          top: 6,
          right: 180,
          zIndex: 1000,
        }}
      >
        <div className="studio-switcher-pill">
          <button
            className={`studio-switcher-btn ${activeStudio === 'html' ? 'is-active' : ''}`}
            onClick={() => setActiveStudio('html')}
            title="HTML Visual Studio: Perbaiki dan atur tata letak undangan HTML dari AI"
          >
            HTML Visual Studio
          </button>
          <button
            className={`studio-switcher-btn ${activeStudio === 'motion' ? 'is-active' : ''}`}
            onClick={() => setActiveStudio('motion')}
            title="Motion Studio Lite: Buat komposisi 2D canvas animasi"
          >
            Motion Studio Lite
          </button>
        </div>
      </div>

      {activeStudio === 'html' ? (
        <HtmlVisualStudio onSwitchToMotion={() => setActiveStudio('motion')} />
      ) : (
        <AppProvider>
          <MotionStudio />
        </AppProvider>
      )}
    </div>
  );
}
