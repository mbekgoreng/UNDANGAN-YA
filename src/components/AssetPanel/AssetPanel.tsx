// ============================================================
// Asset Panel — import, display, manage assets
// ============================================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../app/AppContext';
import { saveAssetMeta, saveAssetBlob, deleteAsset, listAssets, getAssetObjectURL } from '../../storage/db';
import { seedSampleAssetsIfEmpty, forceSeedSampleAssets } from '../../assets/seedAssets';
import type { AssetItem, AssetCategory } from '../../schemas/project';
import { IconPlus, IconTrash, IconImage, IconMagicWand } from '../Icons';

const CATEGORIES: { value: AssetCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'flora', label: 'Flora' },
  { value: 'flowers', label: 'Flowers' },
  { value: 'birds', label: 'Birds' },
  { value: 'architecture', label: 'Arch.' },
  { value: 'ornaments', label: 'Ornaments' },
  { value: 'frames', label: 'Frames' },
  { value: 'backgrounds', label: 'BG' },
  { value: 'textures', label: 'Textures' },
  { value: 'photos', label: 'Photos' },
  { value: 'misc', label: 'Misc' },
];

interface AssetThumbProps {
  asset: AssetItem;
  onAdd: (asset: AssetItem) => void;
  onDelete: (asset: AssetItem) => void;
}

function AssetThumb({ asset, onAdd, onDelete }: AssetThumbProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objUrl: string | null = null;
    getAssetObjectURL(asset.id).then(u => {
      objUrl = u;
      setUrl(u);
    });
    return () => {
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [asset.id]);

  return (
    <div
      className="asset-thumb"
      title={asset.name}
      onDoubleClick={() => onAdd(asset)}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application/undangya-asset', asset.id);
      }}
    >
      {url ? (
        <img src={url} alt={asset.name} loading="lazy" />
      ) : (
        <IconImage size={20} style={{ color: 'var(--text-tertiary)' }} />
      )}
      <div className="asset-thumb-label">{asset.name}</div>
      <button
        className="btn btn-ghost btn-icon"
        style={{
          position: 'absolute', top: 1, right: 1,
          width: 16, height: 16, padding: 0, opacity: 0,
          background: 'rgba(0,0,0,0.7)',
          fontSize: 10,
        }}
        onClick={e => { e.stopPropagation(); onDelete(asset); }}
        onMouseEnter={e => { (e.currentTarget.style.opacity = '1'); }}
        onMouseLeave={e => { (e.currentTarget.style.opacity = '0'); }}
      >
        <IconTrash size={9} style={{ color: 'var(--text-danger)' }} />
      </button>
    </div>
  );
}

export function AssetPanel() {
  const { state, dispatch } = useApp();
  const { assets, selectedSceneId } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<AssetCategory | 'all'>('all');
  const [dragOver, setDragOver] = useState(false);

  // Load assets on mount (seeds sample assets if empty)
  useEffect(() => {
    seedSampleAssetsIfEmpty().then(list => dispatch({ type: 'SET_ASSETS', assets: list }));
  }, [dispatch]);

  const handleSeedSamples = useCallback(async () => {
    const list = await forceSeedSampleAssets();
    const all = await listAssets();
    dispatch({ type: 'SET_ASSETS', assets: all });
  }, [dispatch]);

  const importFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    for (const file of arr) {
      if (!file.type.startsWith('image/')) continue;
      const img = new Image();
      const tempUrl = URL.createObjectURL(file);
      await new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = tempUrl;
      });
      URL.revokeObjectURL(tempUrl);

      const asset: AssetItem = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: guessCategory(file.name),
        mimeType: file.type,
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0,
        fileSize: file.size,
        createdAt: new Date().toISOString(),
      };

      await saveAssetMeta(asset);
      await saveAssetBlob(asset.id, file);
      dispatch({ type: 'ADD_ASSET', asset });
    }
  }, [dispatch]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) importFiles(e.target.files);
    e.target.value = '';
  }, [importFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) importFiles(e.dataTransfer.files);
  }, [importFiles]);

  const handleDelete = useCallback(async (asset: AssetItem) => {
    if (!confirm(`Delete asset "${asset.name}"?`)) return;
    await deleteAsset(asset.id);
    dispatch({ type: 'REMOVE_ASSET', assetId: asset.id });
  }, [dispatch]);

  const handleAdd = useCallback((asset: AssetItem) => {
    if (!selectedSceneId) return;
    const obj = {
      id: crypto.randomUUID(),
      type: 'image' as const,
      name: asset.name,
      x: 50,
      y: 50,
      width: Math.min(asset.width || 200, 300),
      height: Math.min(asset.height || 200, 300),
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      assetId: asset.id,
      flipX: false,
      flipY: false,
      animation: {
        preset: 'none' as const,
        duration: 1,
        delay: 0,
        easing: 'easeOut' as const,
        loop: false,
        startTime: 0,
        endTime: 1,
      },
    };
    dispatch({ type: 'ADD_OBJECT', sceneId: selectedSceneId, object: obj });
    dispatch({ type: 'SELECT_OBJECT', objectId: obj.id });
  }, [selectedSceneId, dispatch]);

  const filtered = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'all' || a.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex-col" style={{ height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '8px 8px 4px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Assets
        </span>
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 9, padding: '2px 6px', height: 20, color: 'var(--accent)' }}
          onClick={handleSeedSamples}
          title="Muat Ornamen & Flora Tradisional"
        >
          <IconMagicWand size={10} /> +Sampel
        </button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => fileInputRef.current?.click()} data-tip="Import assets">
          <IconPlus size={12} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
      </div>

      {/* Search */}
      <div className="search-input-wrap">
        <input
          className="search-input"
          placeholder="Search assets…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 2, padding: '0 6px 6px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            className={`btn btn-ghost btn-sm ${category === c.value ? 'text-accent' : ''}`}
            style={{
              fontSize: 9,
              padding: '2px 5px',
              height: 18,
              background: category === c.value ? 'var(--accent-muted)' : undefined,
            }}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        style={{ margin: '0 8px 6px', padding: 8 }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        Click or drag PNG/SVG files here
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🖼️</div>
          <div>No assets yet.<br />Import PNG, JPG, WebP, or SVG files.</div>
        </div>
      ) : (
        <div className="sidebar-content">
          <div className="asset-grid">
            {filtered.map(a => (
              <AssetThumb key={a.id} asset={a} onAdd={handleAdd} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function guessCategory(filename: string): AssetCategory {
  const f = filename.toLowerCase();
  if (f.includes('flower') || f.includes('petal') || f.includes('rose')) return 'flowers';
  if (f.includes('leaf') || f.includes('fern') || f.includes('plant') || f.includes('flora')) return 'flora';
  if (f.includes('bird') || f.includes('butterfly') || f.includes('dove')) return 'birds';
  if (f.includes('frame') || f.includes('border')) return 'frames';
  if (f.includes('bg') || f.includes('background')) return 'backgrounds';
  if (f.includes('texture')) return 'textures';
  if (f.includes('ornament') || f.includes('batik') || f.includes('motif')) return 'ornaments';
  if (f.includes('arch') || f.includes('temple') || f.includes('gate')) return 'architecture';
  if (f.includes('photo') || f.includes('img') || f.includes('couple')) return 'photos';
  return 'misc';
}
