// ============================================================
// UndangYa! HTML Visual Studio — AssetLibraryPanel
// Transparent PNG & SVG asset library with upload & 1-click placement
// ============================================================
import React, { useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';

export function AssetLibraryPanel() {
  const { project, files, uploadAsset, setEditorMode, insertAssetElement } = useStudio();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedAssetForPlacement, setSelectedAssetForPlacement] = useState<string | null>(null);

  if (!project) return null;

  // Filter image assets from project files
  const imageAssets = files.filter(f => f.type === 'image');

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        await uploadAsset(fileList[i]);
      }
    } catch (err: any) {
      alert(`Gagal mengunggah aset: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartPlacement = (assetPath: string) => {
    setSelectedAssetForPlacement(assetPath);
    setEditorMode('asset-place');

    // Setup one-time listener for placement target from Canvas
    const onTargetChosen = async (e: Event) => {
      const customEvent = e as CustomEvent<{ selector: string }>;
      const targetSelector = customEvent.detail.selector;
      window.removeEventListener('undangya-place-asset-target', onTargetChosen);
      setSelectedAssetForPlacement(null);
      setEditorMode('move');

      if (targetSelector) {
        await insertAssetElement(assetPath, targetSelector);
      }
    };

    window.addEventListener('undangya-place-asset-target', onTargetChosen, { once: true });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Upload Drop Zone */}
      <div
        className={`asset-upload-zone ${isDraggingOver ? 'is-over' : ''}`}
        onDragOver={e => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDraggingOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFileUpload(e.target.files)}
        />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <div style={{ fontSize: '11px', color: '#e0e0e6', fontWeight: 500 }}>
          {isUploading ? 'Mengunggah aset...' : 'Unggah PNG / SVG Transparan'}
        </div>
        <div style={{ fontSize: '9px', color: '#7a7a84' }}>
          Klik atau seret gambar ke sini untuk ditambahkan ke proyek
        </div>
      </div>

      {/* Asset Grid */}
      <div className="sidebar-section-header">
        <span>Aset Gambar & Dekorasi ({imageAssets.length})</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {imageAssets.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#7a7a84', fontSize: '11px' }}>
            Belum ada berkas gambar pada proyek ini. Unggah aset dekoratif seperti bunga, wayang, atau ornamen.
          </div>
        ) : (
          <div className="asset-grid">
            {imageAssets.map(asset => {
              const assetUrl = `/api/projects/${project.id}/serve/${asset.relativePath}`;
              const isSelected = selectedAssetForPlacement === asset.relativePath;

              return (
                <div
                  key={asset.relativePath}
                  className="asset-card"
                  style={isSelected ? { borderColor: '#c9a84c', background: 'rgba(201, 168, 76, 0.1)' } : {}}
                  onClick={() => handleStartPlacement(asset.relativePath)}
                  title="Klik untuk menempatkan aset ini ke dalam undangan"
                >
                  <div className="asset-thumb-wrap">
                    <img src={assetUrl} alt={asset.name} className="asset-thumb-img" />
                  </div>
                  <div className="asset-info-wrap">
                    <span className="asset-name">{asset.name}</span>
                    <span className="asset-size">{(asset.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
