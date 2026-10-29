// ============================================================
// Properties Inspector — Context-sensitive Right Panel
// Transforms, Typography, Shapes, Images, Layer Orders & Animations
// ============================================================
import React, { useCallback, useState } from 'react';
import { useApp } from '../../app/AppContext';
import type { SceneObject, TextObject, ShapeObject, ImageObject, Scene } from '../../schemas/project';
import {
  ANIMATION_PRESET_GROUPS,
  PRESET_LABELS,
} from '../../engine/animation/presets';
import { IconFlipH } from '../Icons';

// ---- Utility inputs ----
function NumInput({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(Math.round(value * 100) / 100));
  const commit = () => {
    const n = parseFloat(local);
    if (!isNaN(n)) onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n)));
    else setLocal(String(value));
  };
  return (
    <div className="inspector-row">
      <label className="inspector-label">{label}</label>
      <input
        type="number"
        className="inspector-input"
        value={local}
        min={min}
        max={max}
        step={step}
        onChange={e => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        onFocus={e => { setLocal(String(value)); e.target.select(); }}
      />
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inspector-row">
      <label className="inspector-label">{label}</label>
      <input
        type="color"
        className="inspector-input"
        style={{ flex: 0, width: 36 }}
        value={value.startsWith('rgba') ? '#c9a84c' : value}
        onChange={e => onChange(e.target.value)}
      />
      <input
        type="text"
        className="inspector-input"
        style={{ flex: 1, fontSize: 10 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={e => e.target.select()}
      />
    </div>
  );
}

// ---- Common object properties ----
function CommonProperties({
  obj,
  onUpdate,
  onBringForward,
  onSendBackward,
  onDuplicate,
  onDelete,
}: {
  obj: SceneObject;
  onUpdate: (u: Partial<SceneObject>) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="panel-section">
        <div className="panel-section-header">Transform</div>
        <div className="panel-section-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 6px' }}>
            <NumInput label="X" value={obj.x} onChange={v => onUpdate({ x: v })} />
            <NumInput label="Y" value={obj.y} onChange={v => onUpdate({ y: v })} />
            <NumInput label="W" value={obj.width} min={1} onChange={v => onUpdate({ width: v })} />
            <NumInput label="H" value={obj.height} min={1} onChange={v => onUpdate({ height: v })} />
          </div>
          <NumInput label="Rotation" value={obj.rotation} min={-360} max={360} step={1} onChange={v => onUpdate({ rotation: v })} />
          <NumInput label="Opacity" value={Math.round(obj.opacity * 100)} min={0} max={100} step={1} onChange={v => onUpdate({ opacity: v / 100 })} />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-header">Lapisan & Susunan</div>
        <div className="panel-section-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <button className="btn btn-secondary btn-sm" onClick={onBringForward} title="Bawa maju 1 lapisan">
            ▲ Maju
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onSendBackward} title="Kirim mundur 1 lapisan">
            ▼ Mundur
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onDuplicate} title="Gandakan objek (Ctrl+D)">
            ⎘ Duplikat
          </button>
          <button className="btn btn-danger btn-sm" onClick={onDelete} title="Hapus objek (Del)">
            ✕ Hapus
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-header">Status</div>
        <div className="panel-section-body">
          <div className="inspector-row">
            <label className="inspector-label">Tampil</label>
            <div
              className={`toggle ${obj.visible ? 'on' : ''}`}
              onClick={() => onUpdate({ visible: !obj.visible })}
            >
              <div className="toggle-knob" />
            </div>
          </div>
          <div className="inspector-row">
            <label className="inspector-label">Terkunci</label>
            <div
              className={`toggle ${obj.locked ? 'on' : ''}`}
              onClick={() => onUpdate({ locked: !obj.locked })}
            >
              <div className="toggle-knob" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---- Text properties ----
function TextProperties({ obj, onUpdate }: { obj: TextObject; onUpdate: (u: Partial<TextObject>) => void }) {
  const FONTS = [
    'Playfair Display, serif',
    'Cinzel, serif',
    'Cormorant Garamond, serif',
    'Plus Jakarta Sans, sans-serif',
    'Great Vibes, cursive',
    'Georgia, serif',
    'Palatino Linotype, serif',
    'Garamond, serif',
    'Montserrat, sans-serif',
    'Inter, sans-serif',
  ];

  return (
    <div className="panel-section">
      <div className="panel-section-header">Tipografi</div>
      <div className="panel-section-body">
        <div className="inspector-row">
          <label className="inspector-label">Font</label>
          <select
            className="inspector-select"
            value={obj.fontFamily}
            onChange={e => onUpdate({ fontFamily: e.target.value })}
          >
            {FONTS.map(f => <option key={f} value={f}>{f.split(',')[0]}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 6px' }}>
          <NumInput label="Ukuran" value={obj.fontSize} min={4} max={400} onChange={v => onUpdate({ fontSize: v })} />
          <div className="inspector-row">
            <label className="inspector-label">Weight</label>
            <select className="inspector-select" value={obj.fontWeight} onChange={e => onUpdate({ fontWeight: e.target.value as TextObject['fontWeight'] })}>
              {['100','200','300','400','500','600','700','800','900','normal','bold'].map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>

        <div className="inspector-row">
          <label className="inspector-label">Gaya</label>
          <select className="inspector-select" value={obj.fontStyle} onChange={e => onUpdate({ fontStyle: e.target.value as TextObject['fontStyle'] })}>
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </div>

        <div className="inspector-row">
          <label className="inspector-label">Rata</label>
          <div style={{ display: 'flex', gap: 3 }}>
            {(['left','center','right'] as const).map(a => (
              <button
                key={a}
                className={`btn btn-ghost btn-sm ${obj.textAlign === a ? 'text-accent' : ''}`}
                style={{ padding: '2px 6px', background: obj.textAlign === a ? 'var(--accent-muted)' : undefined }}
                onClick={() => onUpdate({ textAlign: a })}
              >
                {a[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <NumInput label="Line H" value={obj.lineHeight} min={0.5} max={5} step={0.05} onChange={v => onUpdate({ lineHeight: v })} />
        <NumInput label="Spasi" value={obj.letterSpacing} min={-10} max={50} step={0.5} onChange={v => onUpdate({ letterSpacing: v })} />
        <ColorInput label="Warna" value={obj.fill} onChange={v => onUpdate({ fill: v })} />

        <div className="inspector-row" style={{ marginTop: 4 }}>
          <label className="inspector-label">Isi Teks</label>
        </div>
        <textarea
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 11,
            fontFamily: 'var(--font-ui)',
            padding: '5px 7px',
            outline: 'none',
            resize: 'vertical',
            minHeight: 60,
          }}
          value={obj.text}
          onChange={e => onUpdate({ text: e.target.value })}
          onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'; }}
          onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'; }}
        />
      </div>
    </div>
  );
}

// ---- Shape properties ----
function ShapeProperties({ obj, onUpdate }: { obj: ShapeObject; onUpdate: (u: Partial<ShapeObject>) => void }) {
  return (
    <div className="panel-section">
      <div className="panel-section-header">Bentuk & Garis</div>
      <div className="panel-section-body">
        <ColorInput label="Warna Isi" value={obj.fill} onChange={v => onUpdate({ fill: v })} />
        <ColorInput label="Garis Tepi" value={obj.stroke} onChange={v => onUpdate({ stroke: v })} />
        <NumInput label="Tebal Garis" value={obj.strokeWidth} min={0} max={20} onChange={v => onUpdate({ strokeWidth: v })} />
        {obj.shapeType === 'rect' && (
          <NumInput label="Radius" value={obj.cornerRadius ?? 0} min={0} max={200} onChange={v => onUpdate({ cornerRadius: v })} />
        )}
      </div>
    </div>
  );
}

// ---- Image properties ----
function ImageProperties({ obj, onUpdate }: { obj: ImageObject; onUpdate: (u: Partial<ImageObject>) => void }) {
  return (
    <div className="panel-section">
      <div className="panel-section-header">Gambar</div>
      <div className="panel-section-body">
        <div className="inspector-row">
          <label className="inspector-label">Balik</label>
          <button
            className={`btn btn-ghost btn-sm ${obj.flipX ? 'text-accent' : ''}`}
            onClick={() => onUpdate({ flipX: !obj.flipX })}
          >
            <IconFlipH size={10} /> Horizontal
          </button>
          <button
            className={`btn btn-ghost btn-sm ${obj.flipY ? 'text-accent' : ''}`}
            onClick={() => onUpdate({ flipY: !obj.flipY })}
          >
            <IconFlipH size={10} style={{ transform: 'rotate(90deg)' }} /> Vertikal
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Animation properties ----
function AnimationProperties({ obj, onUpdate }: { obj: SceneObject; onUpdate: (u: Partial<SceneObject>) => void }) {
  const anim = obj.animation;
  const updateAnim = (u: Partial<typeof anim>) => onUpdate({ animation: { ...anim, ...u } });

  return (
    <div className="panel-section">
      <div className="panel-section-header">Animasi Gerak</div>
      <div className="panel-section-body">
        {ANIMATION_PRESET_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {group.presets.map(p => (
                <button
                  key={p}
                  className="btn btn-ghost btn-sm"
                  style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    height: 20,
                    background: anim.preset === p ? 'var(--accent-muted)' : undefined,
                    color: anim.preset === p ? 'var(--accent)' : undefined,
                    border: anim.preset === p ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
                  }}
                  onClick={() => updateAnim({ preset: p })}
                >
                  {PRESET_LABELS[p]}
                </button>
              ))}
              <button
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: 9, padding: '2px 6px', height: 20,
                  background: anim.preset === 'none' ? 'var(--accent-muted)' : undefined,
                  color: anim.preset === 'none' ? 'var(--accent)' : undefined,
                }}
                onClick={() => updateAnim({ preset: 'none' })}
              >
                None
              </button>
            </div>
          </div>
        ))}

        {anim.preset !== 'none' && (
          <>
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 0' }} />
            <NumInput label="Durasi" value={anim.duration} min={0.1} max={30} step={0.1} onChange={v => updateAnim({ duration: v, endTime: anim.startTime + v })} />
            <NumInput label="Delay" value={anim.delay} min={0} max={30} step={0.1} onChange={v => updateAnim({ delay: v })} />
            <NumInput label="Mulai" value={anim.startTime} min={0} max={60} step={0.1} onChange={v => updateAnim({ startTime: v, endTime: v + anim.duration })} />

            <div className="inspector-row">
              <label className="inspector-label">Easing</label>
              <select className="inspector-select" value={anim.easing} onChange={e => updateAnim({ easing: e.target.value as any })}>
                <option value="linear">Linear</option>
                <option value="easeIn">Ease In</option>
                <option value="easeOut">Ease Out (Elegance)</option>
                <option value="easeInOut">Ease In/Out</option>
                <option value="cubicBezier">Cubic Bezier Kustom</option>
              </select>
            </div>

            {anim.easing === 'cubicBezier' && (
              <div className="inspector-row">
                <label className="inspector-label">Kurva Bezier</label>
                <input
                  type="text"
                  className="inspector-input"
                  placeholder="0.34,1.3,0.64,1"
                  defaultValue={anim.cubicBezier ?? '0.34,1.3,0.64,1'}
                  onBlur={e => updateAnim({ cubicBezier: e.target.value.trim() || '0.34,1.3,0.64,1' })}
                />
              </div>
            )}

            <div className="inspector-row">
              <label className="inspector-label">Ulang (Loop)</label>
              <div
                className={`toggle ${anim.loop ? 'on' : ''}`}
                onClick={() => updateAnim({ loop: !anim.loop })}
              >
                <div className="toggle-knob" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Scene properties ----
function SceneProperties({ scene, onUpdate }: { scene: Scene; onUpdate: (u: Partial<Scene>) => void }) {
  const { state } = useApp();
  const imageAssets = state.assets.filter(a => a.mimeType.startsWith('image/'));
  return (
    <div className="panel-section">
      <div className="panel-section-header">Pengaturan Scene</div>
      <div className="panel-section-body">
        <div className="inspector-row">
          <label className="inspector-label">Nama</label>
          <input
            type="text"
            className="inspector-input"
            value={scene.name}
            onChange={e => onUpdate({ name: e.target.value })}
          />
        </div>
        <div className="inspector-row">
          <label className="inspector-label">Durasi (s)</label>
          <input
            type="number"
            className="inspector-input"
            value={scene.duration}
            min={0.5}
            max={120}
            step={0.5}
            onChange={e => onUpdate({ duration: parseFloat(e.target.value) || 5 })}
          />
        </div>
        <div className="inspector-row">
          <label className="inspector-label">Transisi</label>
          <select className="inspector-select" value={scene.transition} onChange={e => onUpdate({ transition: e.target.value as Scene['transition'] })}>
            <option value="none">Tanpa Transisi</option>
            <optgroup label="Dasar">
              <option value="fade">Pudar (Fade)</option>
              <option value="fadeSlow">Pudar Lambat</option>
              <option value="blackFade">Pudar dari Hitam</option>
              <option value="whiteFade">Pudar dari Putih</option>
              <option value="blurIn">Blur ke Fokus</option>
            </optgroup>
            <optgroup label="Geser & Sapu">
              <option value="rise">Naik dari Bawah</option>
              <option value="drop">Turun dari Atas</option>
              <option value="slideLeft">Geser dari Kanan</option>
              <option value="slideRight">Geser dari Kiri</option>
              <option value="slideFull">Geser Penuh</option>
              <option value="wipeLeft">Sapu dari Kanan</option>
              <option value="wipeUp">Sapu dari Bawah</option>
            </optgroup>
            <optgroup label="Kamera & Zoom">
              <option value="cameraIn">Kamera Masuk</option>
              <option value="cameraOut">Kamera Keluar</option>
              <option value="zoomSpin">Zoom + Putar</option>
              <option value="popIn">Pop Melenting</option>
              <option value="fallIn">Jatuh dari Atas</option>
            </optgroup>
            <optgroup label="Putar & 3D">
              <option value="spin">Putar Masuk</option>
              <option value="flipX">Balik Vertikal 3D</option>
              <option value="flipY">Balik Horizontal 3D</option>
              <option value="swing">Ayun dari Atas</option>
            </optgroup>
            <optgroup label="Efek">
              <option value="shake">Guncang</option>
              <option value="glitch">Glitch</option>
              <option value="flash">Kilat Putih</option>
            </optgroup>
          </select>
        </div>
        <ColorInput label="Warna BG" value={scene.backgroundColor} onChange={v => onUpdate({ backgroundColor: v })} />
        <div className="inspector-row">
          <label className="inspector-label">Gambar BG</label>
          <select
            className="inspector-select"
            value={scene.backgroundAssetId ?? ''}
            onChange={e => onUpdate({ backgroundAssetId: e.target.value || undefined })}
          >
            <option value="">— Tanpa gambar —</option>
            {imageAssets.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ---- Canvas properties ----
function CanvasProperties() {
  const { state, dispatch } = useApp();
  const { canvas } = state.project;

  const PRESETS = [
    { label: 'Mobile Undangan (390×844)', value: 'mobile', w: 390, h: 844 },
    { label: 'Vertical Story (1080×1920)', value: 'portrait', w: 1080, h: 1920 },
    { label: 'Square Post (1080×1080)', value: 'square', w: 1080, h: 1080 },
    { label: 'Custom', value: 'custom', w: canvas.width, h: canvas.height },
  ];

  return (
    <div className="panel-section">
      <div className="panel-section-header">Kanvas Desain</div>
      <div className="panel-section-body">
        <div className="inspector-row">
          <label className="inspector-label">Preset</label>
          <select
            className="inspector-select"
            value={canvas.preset}
            onChange={e => {
              const p = PRESETS.find(pr => pr.value === e.target.value);
              if (p) dispatch({ type: 'SET_CANVAS', canvas: { preset: p.value as any, width: p.w, height: p.h } });
            }}
          >
            {PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 6px' }}>
          <div className="inspector-row">
            <label className="inspector-label">L</label>
            <input
              type="number"
              className="inspector-input"
              value={canvas.width}
              min={100}
              max={3840}
              onChange={e => dispatch({ type: 'SET_CANVAS', canvas: { width: parseInt(e.target.value) || canvas.width, preset: 'custom' } })}
            />
          </div>
          <div className="inspector-row">
            <label className="inspector-label">T</label>
            <input
              type="number"
              className="inspector-input"
              value={canvas.height}
              min={100}
              max={3840}
              onChange={e => dispatch({ type: 'SET_CANVAS', canvas: { height: parseInt(e.target.value) || canvas.height, preset: 'custom' } })}
            />
          </div>
        </div>
        <ColorInput
          label="BG Default"
          value={canvas.backgroundColor}
          onChange={v => dispatch({ type: 'SET_CANVAS', canvas: { backgroundColor: v } })}
        />
      </div>
    </div>
  );
}

// ---- Multi-selection: align, distribute, group ----
function MultiSelectPanel() {
  const { state, dispatch, selectedScene } = useApp();
  const { selectedSceneId, selectedObjectIds } = state;
  const objs = (selectedScene?.objects ?? []).filter(o => selectedObjectIds.includes(o.id));

  if (!selectedSceneId || objs.length < 2) return null;

  const apply = (updates: Record<string, Partial<SceneObject>>) =>
    dispatch({ type: 'UPDATE_OBJECTS_BATCH', sceneId: selectedSceneId, updates });

  const align = (mode: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => {
    const minX = Math.min(...objs.map(o => o.x));
    const maxX = Math.max(...objs.map(o => o.x + o.width));
    const minY = Math.min(...objs.map(o => o.y));
    const maxY = Math.max(...objs.map(o => o.y + o.height));
    const updates: Record<string, Partial<SceneObject>> = {};
    for (const o of objs) {
      if (mode === 'left') updates[o.id] = { x: minX };
      if (mode === 'right') updates[o.id] = { x: Math.round(maxX - o.width) };
      if (mode === 'hcenter') updates[o.id] = { x: Math.round((minX + maxX) / 2 - o.width / 2) };
      if (mode === 'top') updates[o.id] = { y: minY };
      if (mode === 'bottom') updates[o.id] = { y: Math.round(maxY - o.height) };
      if (mode === 'vcenter') updates[o.id] = { y: Math.round((minY + maxY) / 2 - o.height / 2) };
    }
    apply(updates);
  };

  const distribute = (axis: 'h' | 'v') => {
    if (objs.length < 3) return;
    const sorted = [...objs].sort((a, b) => axis === 'h' ? (a.x + a.width / 2) - (b.x + b.width / 2) : (a.y + a.height / 2) - (b.y + b.height / 2));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const startC = axis === 'h' ? first.x + first.width / 2 : first.y + first.height / 2;
    const endC = axis === 'h' ? last.x + last.width / 2 : last.y + last.height / 2;
    const step = (endC - startC) / (sorted.length - 1);
    const updates: Record<string, Partial<SceneObject>> = {};
    sorted.forEach((o, i) => {
      const c = startC + step * i;
      updates[o.id] = axis === 'h' ? { x: Math.round(c - o.width / 2) } : { y: Math.round(c - o.height / 2) };
    });
    apply(updates);
  };

  const group = () => {
    const gid = crypto.randomUUID();
    const updates: Record<string, Partial<SceneObject>> = {};
    for (const o of objs) updates[o.id] = { groupId: gid };
    apply(updates);
  };
  const ungroup = () => {
    const updates: Record<string, Partial<SceneObject>> = {};
    for (const o of objs) updates[o.id] = { groupId: undefined };
    apply(updates);
  };
  const grouped = objs.some(o => o.groupId);

  const btnRow = (label: string, items: [string, () => void][]) => (
    <div className="inspector-row" key={label}>
      <label className="inspector-label">{label}</label>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {items.map(([t, fn]) => (
          <button key={t} className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: '2px 7px', height: 22 }} onClick={fn}>{t}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="panel-section">
      <div className="panel-section-header">{objs.length} Objek Terpilih</div>
      <div className="panel-section-body">
        {btnRow('Rata H', [['Kiri', () => align('left')], ['Tengah', () => align('hcenter')], ['Kanan', () => align('right')]])}
        {btnRow('Rata V', [['Atas', () => align('top')], ['Tengah', () => align('vcenter')], ['Bawah', () => align('bottom')]])}
        {objs.length >= 3 && btnRow('Sebar', [['Horizontal', () => distribute('h')], ['Vertikal', () => distribute('v')]])}
        {btnRow('Grup', grouped ? [['Batal Grup', ungroup]] : [['Jadikan Grup', group]])}
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Shift+klik untuk menambah pilihan. Objek satu grup selalu terpilih &amp; bergerak bersama.
        </div>
      </div>
    </div>
  );
}

// ---- Main Inspector ----
export function PropertiesPanel() {
  const { state, dispatch, selectedScene, selectedObject } = useApp();
  const { selectedSceneId } = state;

  const updateObject = useCallback((updates: Partial<SceneObject>) => {
    if (!selectedObject || !selectedSceneId) return;
    dispatch({ type: 'UPDATE_OBJECT', sceneId: selectedSceneId, objectId: selectedObject.id, updates });
  }, [selectedObject, selectedSceneId, dispatch]);

  const updateScene = useCallback((updates: Partial<Scene>) => {
    if (!selectedSceneId) return;
    dispatch({ type: 'UPDATE_SCENE', sceneId: selectedSceneId, updates });
  }, [selectedSceneId, dispatch]);

  const handleBringForward = useCallback(() => {
    if (!selectedSceneId || !selectedScene || !selectedObject) return;
    const sorted = [...selectedScene.objects].sort((a, b) => b.zIndex - a.zIndex);
    const idx = sorted.findIndex(o => o.id === selectedObject.id);
    if (idx <= 0) return;
    const above = sorted[idx - 1];
    dispatch({ type: 'UPDATE_OBJECT', sceneId: selectedSceneId, objectId: selectedObject.id, updates: { zIndex: above.zIndex + 1 } });
  }, [selectedSceneId, selectedScene, selectedObject, dispatch]);

  const handleSendBackward = useCallback(() => {
    if (!selectedSceneId || !selectedScene || !selectedObject) return;
    const sorted = [...selectedScene.objects].sort((a, b) => b.zIndex - a.zIndex);
    const idx = sorted.findIndex(o => o.id === selectedObject.id);
    if (idx >= sorted.length - 1) return;
    const below = sorted[idx + 1];
    dispatch({ type: 'UPDATE_OBJECT', sceneId: selectedSceneId, objectId: selectedObject.id, updates: { zIndex: Math.max(0, below.zIndex - 1) } });
  }, [selectedSceneId, selectedScene, selectedObject, dispatch]);

  const handleDuplicate = useCallback(() => {
    if (!selectedSceneId || !selectedObject) return;
    const newObj: SceneObject = {
      ...selectedObject,
      id: crypto.randomUUID(),
      name: selectedObject.name + ' Copy',
      x: selectedObject.x + 12,
      y: selectedObject.y + 12,
      zIndex: Date.now(),
    };
    dispatch({ type: 'ADD_OBJECT', sceneId: selectedSceneId, object: newObj });
    dispatch({ type: 'SELECT_OBJECT', objectId: newObj.id });
  }, [selectedSceneId, selectedObject, dispatch]);

  const handleDelete = useCallback(() => {
    if (!selectedSceneId || !selectedObject) return;
    dispatch({ type: 'DELETE_OBJECT', sceneId: selectedSceneId, objectId: selectedObject.id });
    dispatch({ type: 'SELECT_OBJECT', objectId: null });
  }, [selectedSceneId, selectedObject, dispatch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {selectedObject ? `Inspektor — ${selectedObject.type}` : 'Inspektor'}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {state.selectedObjectIds.length > 1 ? (
          <MultiSelectPanel />
        ) : selectedObject ? (
          <>
            <div className="panel-section">
              <div className="panel-section-body">
                <div className="inspector-row">
                  <label className="inspector-label">Nama</label>
                  <input
                    type="text"
                    className="inspector-input"
                    value={selectedObject.name}
                    onChange={e => updateObject({ name: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <CommonProperties
              obj={selectedObject}
              onUpdate={updateObject}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />

            {selectedObject.type === 'text' && (
              <TextProperties obj={selectedObject as TextObject} onUpdate={u => updateObject(u)} />
            )}
            {selectedObject.type === 'shape' && (
              <ShapeProperties obj={selectedObject as ShapeObject} onUpdate={u => updateObject(u)} />
            )}
            {selectedObject.type === 'image' && (
              <ImageProperties obj={selectedObject as ImageObject} onUpdate={u => updateObject(u)} />
            )}

            <AnimationProperties obj={selectedObject} onUpdate={updateObject} />
          </>
        ) : selectedScene ? (
          <>
            <SceneProperties scene={selectedScene} onUpdate={updateScene} />
            <CanvasProperties />
          </>
        ) : (
          <>
            <CanvasProperties />
            <div className="empty-state">
              <div className="empty-state-icon">👆</div>
              <div>Pilih objek atau scene<br />untuk melihat propertinya.</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
