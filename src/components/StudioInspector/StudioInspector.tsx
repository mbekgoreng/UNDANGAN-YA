// ============================================================
// UndangYa! HTML Visual Studio — StudioInspector Component
// Complete visual property inspector for selected DOM elements
// ============================================================
import React, { useState, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import './StudioInspector.css';

export function StudioInspector() {
  const {
    selectedElement,
    activeMediaQuery,
    setActiveMediaQuery,
    updateElementStyles,
    updateElementText,
    deleteSelectedElement,
  } = useStudio();

  // Local state for immediate typing feedback
  const [left, setLeft] = useState('');
  const [top, setTop] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [zIndex, setZIndex] = useState('');
  const [opacity, setOpacity] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [positionMode, setPositionMode] = useState('relative');
  const [objectFit, setObjectFit] = useState('contain');
  const [borderRadius, setBorderRadius] = useState('0px');

  // Typography states
  const [textContent, setTextContent] = useState('');
  const [fontSize, setFontSize] = useState('');
  const [color, setColor] = useState('#000000');
  const [fontWeight, setFontWeight] = useState('normal');
  const [textAlign, setTextAlign] = useState('left');
  const [lineHeight, setLineHeight] = useState('');
  const [letterSpacing, setLetterSpacing] = useState('');

  // Animation preset
  const [activeAnimation, setActiveAnimation] = useState('none');
  const [animDuration, setAnimDuration] = useState('3s');

  // Synchronize local states when selectedElement changes
  useEffect(() => {
    if (!selectedElement) return;

    const c = selectedElement.computed;
    setLeft(c.left === 'auto' ? `${Math.round(selectedElement.rect.left)}px` : c.left);
    setTop(c.top === 'auto' ? `${Math.round(selectedElement.rect.top)}px` : c.top);
    setWidth(c.width === 'auto' ? `${Math.round(selectedElement.rect.width)}px` : c.width);
    setHeight(c.height === 'auto' ? `${Math.round(selectedElement.rect.height)}px` : c.height);
    setZIndex(c.zIndex === 'auto' ? '0' : c.zIndex);
    setOpacity(parseFloat(c.opacity) || 1);

    // Extract rotation from transform matrix or rotate(deg)
    let rot = 0;
    if (c.transform && c.transform !== 'none') {
      const match = c.transform.match(/rotate\(([-0-9.]+)deg\)/);
      if (match) {
        rot = parseFloat(match[1]) || 0;
      }
    }
    setRotation(rot);

    setPositionMode(c.position || 'relative');
    setObjectFit(c.objectFit || 'contain');
    setBorderRadius(c.borderRadius || '0px');

    if (selectedElement.isText) {
      setTextContent(selectedElement.textContent || '');
      setFontSize(c.fontSize || '16px');
      setColor(c.color || '#ffffff');
      setFontWeight(c.fontWeight || '400');
      setTextAlign(c.textAlign || 'left');
      setLineHeight(c.lineHeight || 'normal');
      setLetterSpacing(c.letterSpacing || 'normal');
    }

    setActiveAnimation(c.animationName || 'none');
    setAnimDuration(c.animationDuration || '3s');
  }, [selectedElement]);

  if (!selectedElement) {
    return (
      <aside className="studio-inspector-root">
        <div className="inspector-empty">
          <svg className="inspector-empty-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <div style={{ fontWeight: 600, color: '#a0a0aa', fontSize: '13px' }}>Pilih Elemen</div>
          <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
            Klik elemen dekorasi, bunga, teks, atau wayang pada kanvas tengah untuk memeriksa dan menyesuaikan posisinya.
          </div>
        </div>
      </aside>
    );
  }

  // Handle immediate style commit
  const handlePropChange = (prop: string, value: string) => {
    updateElementStyles({ [prop]: value }, true);
  };

  // Preset animations apply
  const applyPresetAnimation = (presetName: string) => {
    setActiveAnimation(presetName);
    if (presetName === 'none') {
      updateElementStyles({ animation: 'none' }, true);
      return;
    }
    const animMap: Record<string, string> = {
      float: `undangyaFloat ${animDuration} ease-in-out infinite`,
      sway: `undangyaSway ${animDuration} ease-in-out infinite alternate`,
      pulse: `undangyaPulse ${animDuration} ease-in-out infinite`,
      fadeIn: `undangyaFadeIn 1.2s ease-out forwards`,
      zoomIn: `undangyaZoomIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
    };
    updateElementStyles({ animation: animMap[presetName] || 'none' }, true);
  };

  return (
    <aside className="studio-inspector-root">
      {/* Element Header */}
      <div className="inspector-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className="inspector-element-tag">&lt;{selectedElement.tagName}&gt;</div>
          <div className="inspector-element-selector" title={selectedElement.selector}>
            {selectedElement.selector}
          </div>
        </div>
        <button
          onClick={deleteSelectedElement}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '11px',
            padding: '4px 6px',
            borderRadius: '4px',
          }}
          title="Hapus elemen dari dokumen"
        >
          Hapus
        </button>
      </div>

      <div className="inspector-content-scroll">
        {/* Responsive Target Scope */}
        <div className="inspector-section">
          <div className="inspector-section-title">
            <span>Target Responsif</span>
          </div>
          <div className="breakpoint-bar">
            <button
              className={`bp-pill ${activeMediaQuery === '' ? 'is-active' : ''}`}
              onClick={() => setActiveMediaQuery('')}
              title="Terapkan ke semua ukuran layar"
            >
              Semua
            </button>
            <button
              className={`bp-pill ${activeMediaQuery === '(max-width: 480px)' ? 'is-active' : ''}`}
              onClick={() => setActiveMediaQuery('(max-width: 480px)')}
              title="Terapkan hanya pada ponsel kecil"
            >
              Ponsel (≤480)
            </button>
            <button
              className={`bp-pill ${activeMediaQuery === '(max-width: 768px)' ? 'is-active' : ''}`}
              onClick={() => setActiveMediaQuery('(max-width: 768px)')}
              title="Terapkan pada tablet / iPad"
            >
              Tablet (≤768)
            </button>
          </div>
        </div>

        {/* Position & Geometry */}
        <div className="inspector-section">
          <div className="inspector-section-title">
            <span>Posisi & Dimensi</span>
          </div>

          <div className="inspector-control-group">
            <label className="inspector-label">Mode Penempatan</label>
            <select
              className="inspector-select"
              value={positionMode}
              onChange={e => {
                setPositionMode(e.target.value);
                handlePropChange('position', e.target.value);
              }}
            >
              <option value="relative">relative (relatif ke posisi asal)</option>
              <option value="absolute">absolute (bebas di dalam container)</option>
              <option value="fixed">fixed (menempel pada viewport layar)</option>
              <option value="static">static (mengikuti alur default HTML)</option>
            </select>
          </div>

          <div className="inspector-row-2">
            <div className="inspector-control-group">
              <label className="inspector-label">Kiri (X / Left)</label>
              <div className="inspector-input-wrap">
                <input
                  type="text"
                  className="inspector-input"
                  value={left}
                  onChange={e => setLeft(e.target.value)}
                  onBlur={() => handlePropChange('left', left)}
                  onKeyDown={e => e.key === 'Enter' && handlePropChange('left', left)}
                />
              </div>
            </div>
            <div className="inspector-control-group">
              <label className="inspector-label">Atas (Y / Top)</label>
              <div className="inspector-input-wrap">
                <input
                  type="text"
                  className="inspector-input"
                  value={top}
                  onChange={e => setTop(e.target.value)}
                  onBlur={() => handlePropChange('top', top)}
                  onKeyDown={e => e.key === 'Enter' && handlePropChange('top', top)}
                />
              </div>
            </div>
          </div>

          <div className="inspector-row-2">
            <div className="inspector-control-group">
              <label className="inspector-label">Lebar (Width)</label>
              <div className="inspector-input-wrap">
                <input
                  type="text"
                  className="inspector-input"
                  value={width}
                  onChange={e => setWidth(e.target.value)}
                  onBlur={() => handlePropChange('width', width)}
                  onKeyDown={e => e.key === 'Enter' && handlePropChange('width', width)}
                />
              </div>
            </div>
            <div className="inspector-control-group">
              <label className="inspector-label">Tinggi (Height)</label>
              <div className="inspector-input-wrap">
                <input
                  type="text"
                  className="inspector-input"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  onBlur={() => handlePropChange('height', height)}
                  onKeyDown={e => e.key === 'Enter' && handlePropChange('height', height)}
                />
              </div>
            </div>
          </div>

          <div className="inspector-row-2">
            <div className="inspector-control-group">
              <label className="inspector-label">Lapisan (Z-Index)</label>
              <div className="inspector-input-wrap">
                <input
                  type="number"
                  className="inspector-input"
                  value={zIndex}
                  onChange={e => {
                    setZIndex(e.target.value);
                    handlePropChange('z-index', e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="inspector-control-group">
              <label className="inspector-label">Bentuk Sudut</label>
              <div className="inspector-input-wrap">
                <input
                  type="text"
                  className="inspector-input"
                  value={borderRadius}
                  onChange={e => setBorderRadius(e.target.value)}
                  onBlur={() => handlePropChange('border-radius', borderRadius)}
                />
              </div>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="inspector-control-group">
            <div className="inspector-label">
              <span>Transparansi (Opacity)</span>
              <span>{Math.round(opacity * 100)}%</span>
            </div>
            <div className="inspector-slider-row">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                className="inspector-range"
                value={opacity}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setOpacity(val);
                  handlePropChange('opacity', String(val));
                }}
              />
            </div>
          </div>

          {/* Rotation Slider */}
          <div className="inspector-control-group">
            <div className="inspector-label">
              <span>Rotasi (Derajat)</span>
              <span>{rotation}°</span>
            </div>
            <div className="inspector-slider-row">
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                className="inspector-range"
                value={rotation}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  setRotation(val);
                  handlePropChange('transform', `rotate(${val}deg)`);
                }}
              />
            </div>
          </div>

          {/* Object Fit if Image */}
          {selectedElement.isImage && (
            <div className="inspector-control-group">
              <label className="inspector-label">Skala Gambar (Object Fit)</label>
              <select
                className="inspector-select"
                value={objectFit}
                onChange={e => {
                  setObjectFit(e.target.value);
                  handlePropChange('object-fit', e.target.value);
                }}
              >
                <option value="contain">contain (proporsional tanpa terpotong)</option>
                <option value="cover">cover (penuh memenuhi area)</option>
                <option value="fill">fill (rentang penuh)</option>
                <option value="none">none (ukuran alami gambar)</option>
              </select>
            </div>
          )}
        </div>

        {/* Typography Section (if text node) */}
        {selectedElement.isText && (
          <div className="inspector-section">
            <div className="inspector-section-title">
              <span>Tipografi & Teks</span>
            </div>

            <div className="inspector-control-group">
              <label className="inspector-label">Ubah Isi Teks Langsung</label>
              <textarea
                value={textContent}
                onChange={e => {
                  setTextContent(e.target.value);
                  updateElementText(e.target.value);
                }}
                rows={3}
                style={{
                  background: '#121215',
                  border: '1px solid #2d2d34',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '11px',
                  padding: '6px',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            <div className="inspector-row-2">
              <div className="inspector-control-group">
                <label className="inspector-label">Ukuran Font</label>
                <div className="inspector-input-wrap">
                  <input
                    type="text"
                    className="inspector-input"
                    value={fontSize}
                    onChange={e => setFontSize(e.target.value)}
                    onBlur={() => handlePropChange('font-size', fontSize)}
                  />
                </div>
              </div>

              <div className="inspector-control-group">
                <label className="inspector-label">Warna Teks</label>
                <div className="inspector-color-wrap">
                  <input
                    type="color"
                    className="inspector-color-picker"
                    value={color.startsWith('#') && color.length === 7 ? color : '#ffffff'}
                    onChange={e => {
                      setColor(e.target.value);
                      handlePropChange('color', e.target.value);
                    }}
                  />
                  <input
                    type="text"
                    className="inspector-input"
                    style={{ background: '#121215', border: '1px solid #2d2d34', borderRadius: '4px', padding: '0 6px', height: '24px' }}
                    value={color}
                    onChange={e => {
                      setColor(e.target.value);
                      handlePropChange('color', e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="inspector-control-group">
              <label className="inspector-label">Rata Paragraf</label>
              <div className="inspector-btn-group">
                {(['left', 'center', 'right', 'justify'] as const).map(align => (
                  <button
                    key={align}
                    className={`inspector-group-btn ${textAlign === align ? 'is-active' : ''}`}
                    onClick={() => {
                      setTextAlign(align);
                      handlePropChange('text-align', align);
                    }}
                  >
                    {align.slice(0, 1).toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="inspector-row-2">
              <div className="inspector-control-group">
                <label className="inspector-label">Tinggi Baris</label>
                <div className="inspector-input-wrap">
                  <input
                    type="text"
                    className="inspector-input"
                    value={lineHeight}
                    onChange={e => setLineHeight(e.target.value)}
                    onBlur={() => handlePropChange('line-height', lineHeight)}
                  />
                </div>
              </div>
              <div className="inspector-control-group">
                <label className="inspector-label">Jarak Huruf</label>
                <div className="inspector-input-wrap">
                  <input
                    type="text"
                    className="inspector-input"
                    value={letterSpacing}
                    onChange={e => setLetterSpacing(e.target.value)}
                    onBlur={() => handlePropChange('letter-spacing', letterSpacing)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Motion & Animation Presets */}
        <div className="inspector-section">
          <div className="inspector-section-title">
            <span>Animasi & Preset Gerak</span>
          </div>

          <div className="animation-preset-grid">
            <button
              className={`preset-chip-btn ${activeAnimation === 'none' ? 'is-active' : ''}`}
              onClick={() => applyPresetAnimation('none')}
            >
              Tanpa Gerak
            </button>
            <button
              className={`preset-chip-btn ${activeAnimation === 'float' ? 'is-active' : ''}`}
              onClick={() => applyPresetAnimation('float')}
            >
              Melayang Lembut
            </button>
            <button
              className={`preset-chip-btn ${activeAnimation === 'sway' ? 'is-active' : ''}`}
              onClick={() => applyPresetAnimation('sway')}
            >
              Goyang Angin
            </button>
            <button
              className={`preset-chip-btn ${activeAnimation === 'pulse' ? 'is-active' : ''}`}
              onClick={() => applyPresetAnimation('pulse')}
            >
              Denyut Emas
            </button>
            <button
              className={`preset-chip-btn ${activeAnimation === 'fadeIn' ? 'is-active' : ''}`}
              onClick={() => applyPresetAnimation('fadeIn')}
            >
              Fade In Masuk
            </button>
            <button
              className={`preset-chip-btn ${activeAnimation === 'zoomIn' ? 'is-active' : ''}`}
              onClick={() => applyPresetAnimation('zoomIn')}
            >
              Zoom In Halus
            </button>
          </div>

          <div className="inspector-control-group" style={{ marginTop: '6px' }}>
            <label className="inspector-label">Durasi Siklus Animasi</label>
            <div className="inspector-input-wrap">
              <input
                type="text"
                className="inspector-input"
                value={animDuration}
                onChange={e => setAnimDuration(e.target.value)}
                placeholder="misal: 3s atau 2.5s"
                onBlur={() => {
                  if (activeAnimation !== 'none') {
                    applyPresetAnimation(activeAnimation);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
