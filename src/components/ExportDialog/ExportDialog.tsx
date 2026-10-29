// ============================================================
// Export Dialog — Standalone Website Packager (.ZIP & Direct Folder)
// ============================================================
import React, { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { exportInvitationZip, exportInvitationDirectory, exportSingleFileHtml } from '../../engine/export/exporter';
import { IconClose, IconExport, IconFolder } from '../Icons';

export function ExportDialog() {
  const { state, dispatch } = useApp();
  const [exportingZip, setExportingZip] = useState(false);
  const [exportingDir, setExportingDir] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await exportSingleFileHtml(state.project);
    } catch (err) {
      console.error('Publish failed:', err);
      alert('Gagal membuat file publish: ' + (err as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  const handleExportZip = async () => {
    setExportingZip(true);
    try {
      await exportInvitationZip(state.project);
    } catch (err) {
      console.error('Export ZIP failed:', err);
      alert('Gagal mengekspor ZIP: ' + (err as Error).message);
    } finally {
      setExportingZip(false);
    }
  };

  const handleExportDir = async () => {
    setExportingDir(true);
    try {
      await exportInvitationDirectory(state.project);
    } catch (err) {
      console.error('Export Directory failed:', err);
      alert('Gagal mengekspor ke folder: ' + (err as Error).message);
    } finally {
      setExportingDir(false);
    }
  };

  const close = () => dispatch({ type: 'TOGGLE_EXPORT_DIALOG', show: false });

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" style={{ width: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="toolbar-logo-mark" style={{ width: 22, height: 22, fontSize: 10 }}>U</div>
            <div className="modal-title">Ekspor Website Undangan Digital</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={close}><IconClose size={14} /></button>
        </div>

        <div className="modal-body">
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
            Ekspor undangan digital Anda menjadi paket website statis mandiri (HTML5, CSS3, JS & Aset Gambar) tanpa dependensi backend atau server editor:
          </div>

          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 12 }}>
            {`dist-invitation/\n├── index.html     (Layout responsif mobile & desktop + Google Fonts)\n├── styles.css     (Animasi keyframe & tipografi mewah)\n├── invitation.js  (Scroll observer reveal & efek kelopak bunga)\n└── assets/        (Aset gambar PNG/SVG lokal mandiri)`}
          </div>

          <div style={{ background: 'var(--accent-muted)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--radius)', padding: 10, fontSize: 10, color: 'var(--accent)', lineHeight: 1.6 }}>
            💡 <strong>Rekomendasi Ekspor:</strong>
            <br />Gunakan tombol <strong>"Unduh Paket .ZIP"</strong> untuk mengunduh seluruh website dalam 1 file zip yang siap diekstrak & diupload ke hosting static apa saja (Vercel, Netlify, cPanel, GitHub Pages).
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div><strong style={{ color: 'var(--text-primary)' }}>Proyek:</strong> {state.project.meta.name}</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Scene:</strong> {state.project.scenes.length} scene</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Dimensi:</strong> {state.project.canvas.width} × {state.project.canvas.height} px</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Aset Terpakai:</strong> {state.assets.length} file</div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={state.project.exportConfig?.includeAnimations !== false}
                onChange={e => dispatch({ type: 'SET_EXPORT_CONFIG', exportConfig: { includeAnimations: e.target.checked } })}
              />
              Sertakan animasi &amp; kelopak
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={state.project.exportConfig?.minify === true}
                onChange={e => dispatch({ type: 'SET_EXPORT_CONFIG', exportConfig: { minify: e.target.checked } })}
              />
              Minify hasil ekspor
            </label>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Publish 1 File HTML:</strong> seluruh website
            (gaya, animasi, gambar, QRIS &amp; musik) digabung menjadi SATU file .html mandiri —
            bisa langsung dibuka, dibagikan, atau diunggah ke hosting mana pun tanpa folder aset.
          </div>
        </div>

        <div className="modal-footer" style={{ gap: 8 }}>
          <button className="btn btn-secondary" onClick={close}>Batal</button>

          <button
            className="btn btn-secondary"
            onClick={handlePublish}
            disabled={publishing || exportingZip || exportingDir}
            title="Satu file HTML mandiri, siap dibuka/dibagikan/diunggah"
          >
            <IconExport size={12} />
            {publishing ? 'Menyiapkan…' : 'Publish 1 File HTML'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleExportDir}
            disabled={exportingDir || exportingZip || publishing}
            title="Pilih folder di komputermu (Chrome/Edge)"
          >
            <IconFolder size={12} />
            {exportingDir ? 'Mengekspor…' : 'Pilih Folder Langsung'}
          </button>

          <button
            className="btn btn-primary"
            onClick={handleExportZip}
            disabled={exportingZip || exportingDir}
          >
            <IconExport size={12} />
            {exportingZip ? 'Menyiapkan ZIP…' : 'Unduh Paket .ZIP (Rekomendasi)'}
          </button>
        </div>
      </div>
    </div>
  );
}
