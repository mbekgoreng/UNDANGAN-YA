// ============================================================
// UndangYa! HTML Visual Studio — HistoryPanel
// View applied non-destructive CSS patches, timestamps & revert
// ============================================================
import React from 'react';
import { useStudio } from '../../context/StudioContext';

export function HistoryPanel() {
  const { project, revertPatch, undo, redo, canUndo, canRedo } = useStudio();

  if (!project) return null;

  const patches = project.patches || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-section-header">
        <span>Riwayat Perbaikan ({patches.length})</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            style={{
              background: '#24242a',
              border: '1px solid #363640',
              color: canUndo ? '#dfc278' : '#555',
              borderRadius: '3px',
              padding: '2px 6px',
              fontSize: '10px',
              cursor: canUndo ? 'pointer' : 'not-allowed',
            }}
            title="Undo"
          >
            ↺ Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            style={{
              background: '#24242a',
              border: '1px solid #363640',
              color: canRedo ? '#dfc278' : '#555',
              borderRadius: '3px',
              padding: '2px 6px',
              fontSize: '10px',
              cursor: canRedo ? 'pointer' : 'not-allowed',
            }}
            title="Redo"
          >
            ↻ Redo
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {patches.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#7a7a84', fontSize: '11px' }}>
            Belum ada patch perbaikan yang diterapkan. Mulai geser atau ubah gaya elemen untuk membuat patch non-destruktif.
          </div>
        ) : (
          <div className="patch-list">
            {[...patches].reverse().map(patch => {
              const propEntries = Object.entries(patch.properties);

              return (
                <div key={patch.id} className="patch-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="patch-selector">{patch.selector}</span>
                    <span style={{ fontSize: '9px', color: '#666' }}>
                      {new Date(patch.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {patch.mediaQuery && (
                    <div style={{ fontSize: '9px', color: '#4da6ff', fontFamily: 'monospace' }}>
                      @media {patch.mediaQuery}
                    </div>
                  )}

                  <div className="patch-props">
                    {propEntries.map(([k, v]) => (
                      <div key={k}>
                        <span style={{ color: '#888' }}>{k}:</span> <span style={{ color: '#dfc278' }}>{v}</span>;
                      </div>
                    ))}
                  </div>

                  <button
                    className="patch-revert-btn"
                    onClick={() => revertPatch(patch.id)}
                    title="Batalkan aturan perbaikan ini"
                  >
                    Batalkan Patch
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
