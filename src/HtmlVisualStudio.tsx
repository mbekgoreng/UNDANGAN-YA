// ============================================================
// UndangYa! HTML Visual Studio — Main Application Component
// ============================================================
import React, { useState } from 'react';
import { StudioProvider } from './context/StudioContext';
import { StudioToolbar } from './components/StudioToolbar/StudioToolbar';
import { StudioSidebar } from './components/StudioSidebar/StudioSidebar';
import { StudioCanvas } from './components/StudioCanvas/StudioCanvas';
import { StudioInspector } from './components/StudioInspector/StudioInspector';
import { ExportModal } from './components/StudioExport/ExportModal';

interface HtmlVisualStudioProps {
  onSwitchToMotion?: () => void;
}

function StudioContent({ onSwitchToMotion }: HtmlVisualStudioProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <>
      <div className="html-studio-layout">
        <div className="html-studio-toolbar-area">
          <StudioToolbar onOpenExport={() => setIsExportOpen(true)} />
        </div>
        <div className="html-studio-sidebar-area">
          <StudioSidebar />
        </div>
        <div className="html-studio-canvas-area">
          <StudioCanvas />
        </div>
        <div className="html-studio-inspector-area">
          <StudioInspector />
        </div>
      </div>

      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </>
  );
}

export function HtmlVisualStudio(props: HtmlVisualStudioProps) {
  return (
    <StudioProvider>
      <StudioContent {...props} />
    </StudioProvider>
  );
}
