// ============================================================
// UndangYa! HTML Visual Studio — DiagnosticsPanel
// Project health inspection: missing assets, external fonts, broken links
// ============================================================
import React from 'react';
import { useStudio } from '../../context/StudioContext';

export function DiagnosticsPanel() {
  const { health } = useStudio();

  if (!health) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#7a7a84', fontSize: '11px' }}>
        Memindai kesehatan proyek...
      </div>
    );
  }

  const errorCount = health.issues.filter(i => i.severity === 'error').length;
  const warningCount = health.issues.filter(i => i.severity === 'warning').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div className="sidebar-section-header">
        <span>Diagnostik & Kesehatan Undangan</span>
        <span className={`sidebar-badge ${errorCount > 0 ? 'badge-alert' : ''}`}>
          {errorCount} Masalah, {warningCount} Peringatan
        </span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', padding: '10px' }}>
        <div style={{ background: '#1c1c22', border: '1px solid #282830', padding: '8px', borderRadius: '4px' }}>
          <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase' }}>File HTML Masuk</div>
          <div style={{ fontSize: '12px', color: '#dfc278', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>
            {health.entryHtml}
          </div>
        </div>
        <div style={{ background: '#1c1c22', border: '1px solid #282830', padding: '8px', borderRadius: '4px' }}>
          <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase' }}>CSS Overrides</div>
          <div style={{ fontSize: '12px', color: health.hasOverridesCss ? '#7ee787' : '#eab308', fontWeight: 600, marginTop: '2px' }}>
            {health.hasOverridesCss ? 'Aktif Terhubung' : 'Belum Ada'}
          </div>
        </div>
        <div style={{ background: '#1c1c22', border: '1px solid #282830', padding: '8px', borderRadius: '4px' }}>
          <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase' }}>Aset Gambar</div>
          <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
            {health.imageFiles.length} file terdeteksi
          </div>
        </div>
        <div style={{ background: '#1c1c22', border: '1px solid #282830', padding: '8px', borderRadius: '4px' }}>
          <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase' }}>Elemen Interaktif</div>
          <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
            {health.selectableElementsCount} / {health.totalElementsCount} DOM
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="diag-card">
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#e0e0e6' }}>
          Temuan & Rekomendasi Perbaikan
        </div>

        {health.issues.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#7ee787', padding: '8px 0' }}>
            ✓ Tidak ditemukan masalah struktural pada proyek ini.
          </div>
        ) : (
          health.issues.map((issue, idx) => (
            <div key={idx} className="diag-issue-item">
              <span className={`diag-issue-${issue.severity}`}>
                {issue.severity === 'error' ? '✖' : issue.severity === 'warning' ? '⚠' : 'ℹ'}
              </span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#d0d0d8' }}>{issue.message}</span>
                {issue.file && (
                  <span style={{ fontSize: '9px', color: '#7a7a84', fontFamily: 'monospace' }}>
                    Berkas: {issue.file}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* External Dependencies */}
      {health.externalDependencies.length > 0 && (
        <div className="diag-card">
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#e0e0e6' }}>
            Ketergantungan Eksternal ({health.externalDependencies.length})
          </div>
          <div style={{ fontSize: '10px', color: '#888' }}>
            Akan membutuhkan koneksi internet saat dibuka jika tidak diunduh secara offline:
          </div>
          {health.externalDependencies.map((dep, idx) => (
            <div key={idx} style={{ fontSize: '10px', color: '#4da6ff', wordBreak: 'break-all', fontFamily: 'monospace' }}>
              • {dep}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
