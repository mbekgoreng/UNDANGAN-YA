// ============================================================
// Main App
// ============================================================
import React, { useEffect } from 'react';
import { AppProvider, useApp } from './app/AppContext';
import { useAutosave } from './app/useAutosave';
import { seedSampleAssetsIfEmpty } from './assets/seedAssets';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { CanvasEditor } from './components/CanvasEditor/CanvasEditor';
import { PropertiesPanel } from './components/PropertiesPanel/PropertiesPanel';
import { Timeline } from './components/Timeline/Timeline';
import { PreviewMode } from './components/Preview/PreviewMode';
import { ExportDialog } from './components/ExportDialog/ExportDialog';
import { ProjectManager } from './components/ProjectManager/ProjectManager';
import './styles/global.css';

function Studio() {
  useAutosave();
  const { state, dispatch } = useApp();

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
