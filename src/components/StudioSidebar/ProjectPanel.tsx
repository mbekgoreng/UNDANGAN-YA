// ============================================================
// UndangYa! HTML Visual Studio — ProjectPanel
// Project meta, safe working copy details, snapshots & file browser
// ============================================================
import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';

export function ProjectPanel() {
  const { project, files, createSnapshot, restoreSnapshot } = useStudio();
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  if (!project) {
    return (
      <div style={{ padding: '20px 14px', color: '#7c7c84', fontSize: '12px', textAlign: 'center' }}>
        Tidak ada proyek terbuka.
      </div>
    );
  }

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotLabel.trim()) return;
    setIsCreatingSnapshot(true);
    try {
      await createSnapshot(snapshotLabel.trim());
      setSnapshotLabel('');
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Project Meta Card */}
      <div className="project-meta-card">
        <div className="project-name-title">{project.name}</div>
        <div style={{ color: '#909098', fontSize: '11px' }}>
          Working Copy ID: <span style={{ fontFamily: 'monospace', color: '#dfc278' }}>{project.id}</span>
        </div>
        <div className="project-path-text" title={project.originalPath}>
          Asli: {project.originalPath}
        </div>
      </div>

      {/* Snapshots Section */}
      <div className="sidebar-section-header">
        <span>Snapshot Aman ({project.snapshots.length})</span>
      </div>

      <form onSubmit={handleCreateSnapshot} style={{ padding: '8px 12px', display: 'flex', gap: '6px' }}>
        <input
          type="text"
          placeholder="Nama snapshot..."
          value={snapshotLabel}
          onChange={e => setSnapshotLabel(e.target.value)}
          style={{
            flex: 1,
            background: '#131316',
            border: '1px solid #303036',
            borderRadius: '4px',
            color: '#ffffff',
            padding: '5px 8px',
            fontSize: '11px',
          }}
        />
        <button
          type="submit"
          disabled={!snapshotLabel.trim() || isCreatingSnapshot}
          style={{
            background: '#c9a84c',
            border: 'none',
            borderRadius: '4px',
            color: '#131316',
            fontWeight: 600,
            fontSize: '11px',
            padding: '5px 10px',
            cursor: !snapshotLabel.trim() || isCreatingSnapshot ? 'not-allowed' : 'pointer',
            opacity: !snapshotLabel.trim() || isCreatingSnapshot ? 0.6 : 1,
          }}
        >
          {isCreatingSnapshot ? '...' : '+ Buat'}
        </button>
      </form>

      <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
        {project.snapshots.map(s => (
          <div key={s.id} className="snapshot-item">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '11px', color: '#e0e0e6', fontWeight: 500 }}>{s.label}</span>
              <span style={{ fontSize: '9px', color: '#72727a' }}>
                {new Date(s.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <button
              className="snapshot-restore-btn"
              onClick={() => {
                if (confirm(`Pulihkan ke snapshot "${s.label}"? Perubahan yang belum disimpan akan digantikan.`)) {
                  restoreSnapshot(s.id);
                }
              }}
            >
              Pulihkan
            </button>
          </div>
        ))}
      </div>

      {/* Files Section */}
      <div className="sidebar-section-header" style={{ marginTop: '12px' }}>
        <span>Berkas Proyek ({files.length})</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {files.map(f => (
          <div key={f.relativePath} className="file-item-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span className={`file-type-badge file-type-${f.type}`}>{f.type}</span>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: f.name === project.entryHtml ? '#dfc278' : 'inherit',
                  fontWeight: f.name === project.entryHtml ? 600 : 400,
                }}
                title={f.relativePath}
              >
                {f.name}
              </span>
            </div>
            <span style={{ color: '#686872', fontSize: '10px', fontFamily: 'monospace' }}>
              {formatFileSize(f.size)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
