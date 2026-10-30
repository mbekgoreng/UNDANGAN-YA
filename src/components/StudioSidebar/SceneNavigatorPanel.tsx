// ============================================================
// UndangYa! HTML Visual Studio — SceneNavigatorPanel
// Auto-detect sections (Cover, Couple, Event, Gallery, RSVP) and jump
// ============================================================
import React, { useState, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { scanInvitationScenes, extractElementInfo } from '../../utils/domUtils';

interface SceneItem {
  id: string;
  name: string;
  selector: string;
  top: number;
}

export function SceneNavigatorPanel() {
  const { project, iframeKey, selectElement } = useStudio();
  const [scenes, setScenes] = useState<SceneItem[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

  useEffect(() => {
    const iframe = document.querySelector('.canvas-iframe') as HTMLIFrameElement | null;
    if (!iframe || !iframe.contentDocument) return;

    try {
      const detected = scanInvitationScenes(iframe.contentDocument);
      setScenes(detected);
    } catch (err) {
      console.warn('Could not scan scenes from iframe:', err);
    }
  }, [project, iframeKey]);

  const handleScrollToScene = (scene: SceneItem) => {
    setActiveSceneId(scene.id);
    const iframe = document.querySelector('.canvas-iframe') as HTMLIFrameElement | null;
    if (!iframe || !iframe.contentDocument) return;

    try {
      const el = iframe.contentDocument.querySelector(scene.selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const info = extractElementInfo(el, iframe);
        selectElement(info);
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-section-header">
        <span>Adegan & Bagian Undangan ({scenes.length})</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {scenes.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#7a7a84', fontSize: '11px' }}>
            Tidak ada bagian &lt;section&gt; yang terdeteksi otomatis. Silakan pilih elemen langsung dari tab Struktur Lapisan atau kanvas.
          </div>
        ) : (
          <div className="scene-list">
            {scenes.map((scene, idx) => {
              const isActive = activeSceneId === scene.id;
              return (
                <div
                  key={scene.id || idx}
                  className="scene-card"
                  style={isActive ? { borderColor: '#c9a84c', background: 'rgba(201, 168, 76, 0.1)' } : {}}
                  onClick={() => handleScrollToScene(scene)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <span className="scene-title">{scene.name}</span>
                    <span className="scene-id">{scene.selector}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
