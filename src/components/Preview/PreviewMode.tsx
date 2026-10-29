// ============================================================
// Preview Mode — Full-screen Invitation Simulation
// Supports both Auto-Play Timeline and Live Web Scroll with Falling Petals
// ============================================================
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useApp } from '../../app/AppContext';
import { IconClose, IconPlay, IconPause, IconStop } from '../Icons';
import { getAssetObjectURL } from '../../storage/db';
import { computeAnimatedState } from '../../engine/animation/presets';
import { PetalSystem } from '../../engine/animation/fallingPetals';
import type { SceneObject, ImageObject, TextObject, ShapeObject } from '../../schemas/project';

// Cache for Object URLs
const urlCache = new Map<string, string>();
async function cachedUrl(id: string) {
  if (urlCache.has(id)) return urlCache.get(id)!;
  const u = await getAssetObjectURL(id);
  if (u) urlCache.set(id, u);
  return u ?? null;
}

function SceneBgImage({ assetId }: { assetId?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!assetId) { setUrl(null); return; }
    cachedUrl(assetId).then(setUrl);
  }, [assetId]);
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
    />
  );
}

interface PreviewObjectProps {
  object: SceneObject;
  currentTime: number;
  sceneStartTime: number;
  scale: number;
  isScrollView?: boolean;
}

function PreviewObject({ object, currentTime, sceneStartTime, scale, isScrollView }: PreviewObjectProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (object.type !== 'image') return;
    cachedUrl((object as ImageObject).assetId).then(setImgUrl);
  }, [object.type, (object as ImageObject).assetId]);

  if (!object.visible) return null;

  // In scroll view, all objects are at rest or continuously moving
  const relativeTime = isScrollView ? currentTime : (currentTime - sceneStartTime);
  const animState = computeAnimatedState(object.animation.preset, object.animation, relativeTime, object.opacity);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: object.x * scale,
    top: object.y * scale,
    width: object.width * scale,
    height: object.height * scale,
    transform: `rotate(${object.rotation + animState.rotate}deg) translate(${animState.translateX}px, ${animState.translateY}px) scale(${animState.scaleX}, ${animState.scaleY})`,
    transformOrigin: 'center center',
    opacity: isScrollView ? object.opacity : animState.opacity,
    pointerEvents: 'none',
  };

  if (object.type === 'image') {
    const flipX = (object as ImageObject).flipX;
    const flipY = (object as ImageObject).flipY;
    return (
      <div style={style}>
        {imgUrl ? (
          <img
            src={imgUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
            }}
            alt=""
          />
        ) : null}
      </div>
    );
  }

  if (object.type === 'text') {
    const t = object as TextObject;
    return (
      <div style={{
        ...style,
        fontFamily: t.fontFamily,
        fontSize: t.fontSize * scale,
        fontWeight: t.fontWeight,
        fontStyle: t.fontStyle,
        textAlign: t.textAlign,
        lineHeight: t.lineHeight,
        letterSpacing: `${t.letterSpacing}px`,
        color: t.fill,
        display: 'flex',
        alignItems: 'center',
        justifyContent: t.textAlign === 'center' ? 'center' : t.textAlign === 'right' ? 'flex-end' : 'flex-start',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {t.text.split('{nama}').join('Nama Tamu').split('{tamu}').join('Nama Tamu')}
      </div>
    );
  }

  if (object.type === 'shape') {
    const s = object as ShapeObject;
    return (
      <div style={{
        ...style,
        background: s.fill,
        border: `${s.strokeWidth}px solid ${s.stroke}`,
        borderRadius: s.shapeType === 'ellipse' ? '50%' : `${s.cornerRadius ?? 0}px`,
        boxSizing: 'border-box',
      }} />
    );
  }

  return null;
}

export function PreviewMode() {
  const { state, dispatch } = useApp();
  const { project } = state;
  const { canvas, scenes } = project;

  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [viewport, setViewport] = useState<'mobile' | 'desktop'>('mobile');
  const [viewMode, setViewMode] = useState<'timeline' | 'scroll'>('scroll');
  const [petalsActive, setPetalsActive] = useState(true);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const petalsCanvasRef = useRef<HTMLCanvasElement>(null);
  const petalSystemRef = useRef<PetalSystem | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  // Active scene in timeline mode
  const { scene: currentScene, sceneStartTime } = useMemo(() => {
    let t = 0;
    for (const s of scenes) {
      if (currentTime < t + s.duration) return { scene: s, sceneStartTime: t };
      t += s.duration;
    }
    return { scene: scenes[scenes.length - 1] ?? null, sceneStartTime: t - (scenes[scenes.length - 1]?.duration ?? 0) };
  }, [currentTime, scenes]);

  // Timeline playback loop
  useEffect(() => {
    if (playing) {
      startRef.current = performance.now();
      startTimeRef.current = currentTime;
      const tick = (now: number) => {
        const elapsed = (now - (startRef.current ?? now)) / 1000;
        const newTime = (startTimeRef.current + elapsed) % (totalDuration || 1);
        setCurrentTime(newTime);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, totalDuration]);

  // Falling Petals Canvas effect
  useEffect(() => {
    const cvs = petalsCanvasRef.current;
    if (!cvs) return;
    if (petalsActive) {
      if (!petalSystemRef.current) {
        petalSystemRef.current = new PetalSystem(cvs, 24);
      }
      petalSystemRef.current.start();
    } else {
      petalSystemRef.current?.stop();
    }
    return () => {
      petalSystemRef.current?.stop();
    };
  }, [petalsActive, viewport]);

  const close = () => {
    setPlaying(false);
    petalSystemRef.current?.stop();
    dispatch({ type: 'TOGGLE_PREVIEW', show: false });
  };

  const previewW = viewport === 'mobile' ? 390 : 768;
  const scale = viewport === 'mobile'
    ? Math.min((window.innerHeight - 90) / canvas.height, 390 / canvas.width, 1)
    : 1;

  const displayW = canvas.width * scale;
  const displayH = canvas.height * scale;

  return (
    <div className="preview-overlay">
      {/* Top Header Bar */}
      <div className="preview-topbar">
        <button className="btn btn-ghost btn-icon" onClick={close} title="Tutup Preview">
          <IconClose size={14} />
        </button>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          Preview — {project.meta.name}
        </span>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border)' }}>
          <button
            className={`btn btn-ghost btn-sm ${viewMode === 'scroll' ? 'text-accent' : ''}`}
            style={{ background: viewMode === 'scroll' ? 'var(--accent-muted)' : undefined, fontSize: 10 }}
            onClick={() => setViewMode('scroll')}
          >
            📜 Web Scroll
          </button>
          <button
            className={`btn btn-ghost btn-sm ${viewMode === 'timeline' ? 'text-accent' : ''}`}
            style={{ background: viewMode === 'timeline' ? 'var(--accent-muted)' : undefined, fontSize: 10 }}
            onClick={() => setViewMode('timeline')}
          >
            ⏱ Timeline Play
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Viewport toggle */}
        <div style={{ display: 'flex', gap: 3 }}>
          <button
            className={`btn btn-ghost btn-sm ${viewport === 'mobile' ? 'text-accent' : ''}`}
            style={{ background: viewport === 'mobile' ? 'var(--accent-muted)' : undefined }}
            onClick={() => setViewport('mobile')}
          >
            📱 Mobile
          </button>
          <button
            className={`btn btn-ghost btn-sm ${viewport === 'desktop' ? 'text-accent' : ''}`}
            style={{ background: viewport === 'desktop' ? 'var(--accent-muted)' : undefined }}
            onClick={() => setViewport('desktop')}
          >
            🖥️ Desktop
          </button>
        </div>

        <div className="toolbar-divider" />

        {/* Petals Toggle */}
        <button
          className={`btn btn-ghost btn-sm ${petalsActive ? 'text-accent' : ''}`}
          style={{ background: petalsActive ? 'var(--accent-muted)' : undefined }}
          onClick={() => setPetalsActive(!petalsActive)}
          title="Efek Kelopak Bunga Berjatuhan"
        >
          🌸 {petalsActive ? 'Petals ON' : 'Petals OFF'}
        </button>

        {viewMode === 'timeline' && (
          <>
            <div className="toolbar-divider" />
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => { if (currentTime >= totalDuration) setCurrentTime(0); setPlaying(!playing); }}
            >
              {playing ? <IconPause size={14} /> : <IconPlay size={14} />}
            </button>
            <button className="btn btn-ghost btn-icon" onClick={() => { setPlaying(false); setCurrentTime(0); }}>
              <IconStop size={12} />
            </button>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)', minWidth: 60 }}>
              {currentTime.toFixed(2)}s / {totalDuration.toFixed(1)}s
            </span>
          </>
        )}
      </div>

      {/* Main Preview Container */}
      <div style={{
        marginTop: 48,
        width: '100%',
        height: 'calc(100vh - 58px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {viewMode === 'scroll' ? (
          // ================= WEB SCROLL SIMULATION =================
          <div
            ref={scrollContainerRef}
            style={{
              width: displayW,
              height: '92vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              borderRadius: viewport === 'mobile' ? 16 : 4,
              border: '2px solid rgba(201,168,76,0.25)',
              boxShadow: '0 12px 64px rgba(0,0,0,0.85)',
              background: '#0d0e12',
              position: 'relative',
              scrollBehavior: 'smooth',
            }}
          >
            {/* Falling Petals Canvas Overlay */}
            {petalsActive && (
              <canvas
                ref={petalsCanvasRef}
                width={displayW}
                height={displayH}
                style={{
                  position: 'fixed',
                  top: '48px',
                  width: displayW,
                  height: '92vh',
                  pointerEvents: 'none',
                  zIndex: 200,
                }}
              />
            )}

            {/* Vertical Stacked Scenes */}
            {scenes.map((scene, idx) => (
              <div
                key={scene.id}
                id={`preview-scene-${idx}`}
                style={{
                  width: displayW,
                  height: displayH,
                  position: 'relative',
                  background: scene.backgroundColor,
                  overflow: 'hidden',
                  flexShrink: 0,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <SceneBgImage assetId={scene.backgroundAssetId} />
                {[...scene.objects]
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map(obj => (
                    <PreviewObject
                      key={obj.id}
                      object={obj}
                      currentTime={currentTime}
                      sceneStartTime={0}
                      scale={scale}
                      isScrollView={true}
                    />
                  ))}
              </div>
            ))}
          </div>
        ) : (
          // ================= TIMELINE PRESENTATION =================
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{
              width: displayW,
              height: displayH,
              position: 'relative',
              background: currentScene?.backgroundColor ?? canvas.backgroundColor,
              overflow: 'hidden',
              borderRadius: viewport === 'mobile' ? 12 : 4,
              boxShadow: '0 8px 48px rgba(0,0,0,0.9)',
            }}>
              {/* Petals Canvas */}
              {petalsActive && (
                <canvas
                  ref={petalsCanvasRef}
                  width={displayW}
                  height={displayH}
                  style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}
                />
              )}

              <SceneBgImage assetId={currentScene?.backgroundAssetId} />
              {currentScene && [...currentScene.objects]
                .sort((a, b) => a.zIndex - b.zIndex)
                .map(obj => (
                  <PreviewObject
                    key={obj.id}
                    object={obj}
                    currentTime={currentTime}
                    sceneStartTime={sceneStartTime}
                    scale={scale}
                    isScrollView={false}
                  />
                ))}
            </div>

            {/* Scene dots */}
            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              {scenes.map(s => (
                <div
                  key={s.id}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: currentScene?.id === s.id ? 'var(--accent)' : 'var(--border)',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                  title={s.name}
                  onClick={() => {
                    let t = 0;
                    for (const sc of scenes) {
                      if (sc.id === s.id) { setCurrentTime(t); break; }
                      t += sc.duration;
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
