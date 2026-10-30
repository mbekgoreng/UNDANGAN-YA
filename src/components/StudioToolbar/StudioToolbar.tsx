// ============================================================
// Top Toolbar — Mode Switcher, Viewports, Zoom, Undo/Redo, Project & Export
// ============================================================
import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  IconUndo,
  IconRedo,
  IconZoomIn,
  IconZoomOut,
  IconFolder,
  IconExport,
  IconPlay,
  IconMagicWand,
} from '../Icons';
import type { EditorMode, ViewportPreset } from '../../types/visualStudio';

export function StudioToolbar({ onOpenExport }: { onOpenExport: () => void }) {
  const {
    project,
    saveStatus,
    editorMode,
    viewport,
    zoom,
    compareMode,
    canUndo,
    canRedo,
    setEditorMode,
    setViewport,
    setZoom,
    setCompareMode,
    openProject,
    openSample,
    undo,
    redo,
    createSnapshot,
  } = useStudio();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [folderInput, setFolderInput] = useState('');

  const handleOpenFolder = async () => {
    if (!folderInput.trim()) return;
    await openProject(folderInput.trim());
    setShowOpenModal(false);
  };

  const statusLabel = {
    saved: '✓ Tersimpan',
    saving: '↻ Menyimpan…',
    unsaved: '● Belum Simpan',
    error: '✕ Gagal Simpan',
  }[saveStatus];

  return (
    <>
      <header className="studio-toolbar">
        {/* Brand */}
        <div className="toolbar-logo">
          <div className="toolbar-logo-mark" style={{ background: 'linear-gradient(135deg, #fad961 0%, #c9a84c 100%)' }}>
            H
          </div>
          <div className="toolbar-logo-name">
            UndangYa! <span>HTML Studio</span>
          </div>
        </div>

        <div className="toolbar-divider" />

        {/* Project Selector & Status */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowOpenModal(true)}
          title="Buka Proyek Undangan HTML Lainnya"
        >
          <IconFolder size={12} />
          <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {project ? project.name : 'Buka Proyek…'}
          </span>
        </button>

        <div className={`save-status ${saveStatus}`} style={{ marginLeft: 6 }}>
          <span>{statusLabel}</span>
        </div>

        <div className="toolbar-divider" />

        {/* Undo / Redo */}
        <button
          className="btn btn-ghost btn-icon btn-sm"
          disabled={!canUndo}
          onClick={undo}
          title="Undo (Ctrl+Z)"
        >
          <IconUndo size={13} />
        </button>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          disabled={!canRedo}
          onClick={redo}
          title="Redo (Ctrl+Y)"
        >
          <IconRedo size={13} />
        </button>

        <div className="toolbar-divider" />

        {/* Editor Modes */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-input)', padding: 2, borderRadius: 4, border: '1px solid var(--border)' }}>
          <button
            className={`btn btn-ghost btn-sm ${editorMode === 'inspect' ? 'text-accent' : ''}`}
            style={{ background: editorMode === 'inspect' ? 'var(--accent-muted)' : undefined, fontSize: 10, padding: '2px 8px' }}
            onClick={() => setEditorMode('inspect')}
            title="Mode Inspeksi: Sorot elemen dan klik untuk memilih"
          >
            🔍 Inspeksi
          </button>
          <button
            className={`btn btn-ghost btn-sm ${editorMode === 'move' ? 'text-accent' : ''}`}
            style={{ background: editorMode === 'move' ? 'var(--accent-muted)' : undefined, fontSize: 10, padding: '2px 8px' }}
            onClick={() => setEditorMode('move')}
            title="Mode Geser & Ubah Ukuran: Seret posisi dan tarik pegangan sudut"
          >
            ✥ Geser & Ukuran
          </button>
          <button
            className={`btn btn-ghost btn-sm ${editorMode === 'asset-place' ? 'text-accent' : ''}`}
            style={{ background: editorMode === 'asset-place' ? 'var(--accent-muted)' : undefined, fontSize: 10, padding: '2px 8px' }}
            onClick={() => setEditorMode('asset-place')}
            title="Mode Sisipkan Aset: Klik kontainer di preview untuk menaruh gambar"
          >
            ➕ Sisip Aset
          </button>
          <button
            className={`btn btn-ghost btn-sm ${editorMode === 'preview' ? 'text-accent' : ''}`}
            style={{ background: editorMode === 'preview' ? 'var(--accent-muted)' : undefined, fontSize: 10, padding: '2px 8px' }}
            onClick={() => setEditorMode('preview')}
            title="Mode Pratinjau Murni: Uji coba scroll dan interaksi tombol website tanpa garis outline"
          >
            <IconPlay size={10} /> Preview
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Viewport Presets */}
        <div style={{ display: 'flex', gap: 2 }}>
          {(['mobile', 'mobile-s', 'tablet', 'desktop'] as ViewportPreset[]).map(vp => (
            <button
              key={vp}
              className={`btn btn-ghost btn-sm ${viewport.preset === vp ? 'text-accent' : ''}`}
              style={{
                background: viewport.preset === vp ? 'var(--accent-muted)' : undefined,
                fontSize: 10,
                padding: '2px 6px',
              }}
              onClick={() => setViewport(vp)}
            >
              {vp === 'mobile' ? '📱 390px' : vp === 'mobile-s' ? '📱 320px' : vp === 'tablet' ? '📟 768px' : '🖥 1280px'}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        {/* Zoom */}
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}
          title="Zoom Out (-)"
        >
          <IconZoomOut size={13} />
        </button>
        <span className="zoom-display" style={{ fontSize: 10 }}>{Math.round(zoom * 100)}%</span>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          title="Zoom In (+)"
        >
          <IconZoomIn size={13} />
        </button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 9, padding: '2px 6px' }}
          onClick={() => setZoom(1)}
        >
          100%
        </button>

        <div className="toolbar-spacer" />

        {/* Compare Toggle */}
        <button
          className={`btn btn-ghost btn-sm ${compareMode === 'original' ? 'text-accent' : ''}`}
          style={{ background: compareMode === 'original' ? 'var(--accent-muted)' : undefined }}
          onClick={() => setCompareMode(compareMode === 'original' ? 'edited' : 'original')}
          title="Bandingkan tampilan hasil perbaikan dengan HTML Asli"
        >
          {compareMode === 'original' ? '👁 Asli (Original)' : '✨ Hasil Edit'}
        </button>

        {/* Snapshot */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            const label = prompt('Beri nama snapshot cadangan:', 'Cadangan Sebelum Edit');
            if (label) createSnapshot(label);
          }}
          title="Simpan Snapshot Pemulihan"
        >
          📷 Snapshot
        </button>

        {/* Export */}
        <button
          className="btn btn-primary btn-sm"
          onClick={onOpenExport}
          title="Ekspor Website Undangan yang Sudah Diperbaiki"
        >
          <IconExport size={12} />
          Ekspor Website
        </button>
      </header>

      {/* Open Project Modal */}
      {showOpenModal && (
        <div className="modal-backdrop" onClick={() => setShowOpenModal(false)}>
          <div className="modal" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Buka Proyek Undangan HTML</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowOpenModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                UndangYa! HTML Visual Studio bekerja secara lokal. Buka folder undangan digital Anda di komputer, atau gunakan sampel buatan AI untuk mencoba fitur perbaikan:
              </div>

              {/* Sample Quick Open */}
              <div
                style={{
                  background: 'var(--accent-muted)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: 6,
                  padding: 12,
                  marginBottom: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
                onClick={() => {
                  openSample();
                  setShowOpenModal(false);
                }}
              >
                <div style={{ fontSize: 24 }}>✨</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                    Buka Proyek Sampel (AI Generated Flawed)
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Undangan Adat Jawa dengan masalah umum: Gunungan wayang menutupi teks, posisi cincin miring, dan ornamen bunga terpotong.
                  </div>
                </div>
                <button className="btn btn-primary btn-sm">Buka Sampel</button>
              </div>

              {/* Enter Path */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  MASUKKAN PATH FOLDER LOKAL:
                </label>
                <input
                  type="text"
                  className="inspector-input"
                  placeholder="Contoh: D:\proyek-undangan\wedding-invitation"
                  value={folderInput}
                  onChange={e => setFolderInput(e.target.value)}
                  style={{ width: '100%', fontSize: 11 }}
                  onKeyDown={e => e.key === 'Enter' && handleOpenFolder()}
                />
              </div>

              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                * Sistem akan membuat salinan kerja aman (Working Copy) sehingga file asli Anda tidak akan pernah rusak.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowOpenModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleOpenFolder} disabled={!folderInput.trim()}>
                Buka Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
