// ============================================================
// UndangYa! HTML Visual Studio — ExportModal Component
// Direct standalone ZIP package download & folder destination export
// ============================================================
import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import * as api from '../../api/studioApi';
import './ExportModal.css';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { project, health } = useStudio();
  const [targetDir, setTargetDir] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  const handleDownloadZip = () => {
    const downloadUrl = api.getExportZipUrl(project.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-perbaikan.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDirectory = async () => {
    if (!targetDir.trim()) {
      alert('Masukkan path direktori tujuan di komputer Anda.');
      return;
    }
    setIsExporting(true);
    setExportMessage(null);
    try {
      const res = await api.exportProjectToDirectory(project.id, targetDir.trim());
      setExportMessage(`Berhasil diekspor ke: ${res.exportedPath}`);
    } catch (err: any) {
      alert(`Gagal mengekspor folder: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-modal-backdrop" onClick={onClose}>
      <div className="export-modal-card" onClick={e => e.stopPropagation()}>
        <div className="export-modal-header">
          <div className="export-modal-title">Ekspor Undangan Siap Tayang</div>
          <button className="export-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="export-modal-body">
          {/* Preflight Checks */}
          <div className="export-section-box">
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#dfc278' }}>
              Pemeriksaan Kesiapan Standalone (Preflight)
            </div>
            <div className="export-check-list">
              <div className="export-check-item">
                <span className="export-check-ok">✓</span>
                <span>Aturan penataan CSS dikompilasi ke <code>undangya-overrides.css</code></span>
              </div>
              <div className="export-check-item">
                <span className="export-check-ok">✓</span>
                <span>Bebas dari dependensi atau URL localhost (100% relatif & portabel)</span>
              </div>
              <div className="export-check-item">
                <span className="export-check-ok">✓</span>
                <span>Struktur asli HTML, file JavaScript & aset dekorasi dipertahankan</span>
              </div>
              {health && health.issues.length > 0 && (
                <div style={{ fontSize: '10px', color: '#eab308', marginTop: '4px' }}>
                  Catatan: Terdapat {health.issues.length} catatan/peringatan pada tab Cek Diagnostik.
                </div>
              )}
            </div>
          </div>

          {/* Option 1: ZIP Archive */}
          <div className="export-section-box">
            <div className="export-option-row">
              <div>
                <div className="export-option-title">1. Unduh Arsip ZIP Mandiri</div>
                <div className="export-option-desc">
                  Paket lengkap berisi HTML, CSS overrides, gambar, skrip, dan font. Siap diunggah ke cPanel, Vercel, Netlify, atau GitHub Pages.
                </div>
              </div>
              <button className="export-btn-primary" onClick={handleDownloadZip}>
                Unduh .ZIP
              </button>
            </div>
          </div>

          {/* Option 2: Export to Local Folder */}
          <div className="export-section-box">
            <div className="export-option-title">2. Ekspor Langsung ke Folder Komputer</div>
            <div className="export-option-desc">
              Salin seluruh hasil revisi ke lokasi folder baru tanpa mengotak-atik file asli aslinya.
            </div>
            <div className="export-dir-input-row">
              <input
                type="text"
                className="export-dir-input"
                placeholder="Contoh: D:\Hasil-Undangan\Pernikahan-Revisi"
                value={targetDir}
                onChange={e => setTargetDir(e.target.value)}
              />
              <button
                className="export-btn-secondary"
                onClick={handleExportDirectory}
                disabled={isExporting}
              >
                {isExporting ? 'Mengekspor...' : 'Ekspor Folder'}
              </button>
            </div>
            {exportMessage && (
              <div style={{ fontSize: '11px', color: '#7ee787', marginTop: '4px' }}>
                {exportMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
