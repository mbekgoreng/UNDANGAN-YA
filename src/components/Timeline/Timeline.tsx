// ============================================================
// Timeline Panel — playback, scrubbing, animation tracks
// ============================================================
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { IconPlay, IconPause, IconStop } from '../Icons';
import type { AnimationConfig } from '../../schemas/project';

interface BlockDrag {
  objectId: string;
  mode: 'move' | 'left' | 'right';
  startX: number;
  trackWidth: number;
  origStartTime: number;
  origDuration: number;
  delay: number;
  curStartTime: number;
  curDuration: number;
}

const snap = (v: number) => Math.round(v / 0.05) * 0.05;
const clampN = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function Timeline() {
  const { state, dispatch, selectedScene } = useApp();
  const { isPlaying, currentTime } = state;
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const rulerRef = useRef<HTMLDivElement>(null);

  const duration = selectedScene?.duration ?? 5;

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      startRef.current = performance.now();
      startTimeRef.current = currentTime;
      const tick = (now: number) => {
        const elapsed = (now - (startRef.current ?? now)) / 1000;
        const newTime = startTimeRef.current + elapsed;
        if (newTime >= duration) {
          dispatch({ type: 'SET_CURRENT_TIME', time: duration });
          dispatch({ type: 'SET_PLAYING', playing: false });
          return;
        }
        dispatch({ type: 'SET_CURRENT_TIME', time: newTime });
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const play = () => {
    if (currentTime >= duration) dispatch({ type: 'SET_CURRENT_TIME', time: 0 });
    dispatch({ type: 'SET_PLAYING', playing: true });
  };
  const pause = () => dispatch({ type: 'SET_PLAYING', playing: false });
  const stop = () => {
    dispatch({ type: 'SET_PLAYING', playing: false });
    dispatch({ type: 'SET_CURRENT_TIME', time: 0 });
  };

  const handleRulerClick = useCallback((e: React.MouseEvent) => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    const rect = ruler.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const t = Math.max(0, Math.min(duration, ratio * duration));
    dispatch({ type: 'SET_CURRENT_TIME', time: t });
  }, [duration, dispatch]);

  const handleRulerMouseDown = useCallback((e: React.MouseEvent) => {
    handleRulerClick(e);
    const ruler = rulerRef.current;
    if (!ruler) return;
    const wasPlaying = isPlaying;
    if (wasPlaying) dispatch({ type: 'SET_PLAYING', playing: false });
    const onMove = (me: MouseEvent) => {
      const rect = ruler.getBoundingClientRect();
      const ratio = (me.clientX - rect.left) / rect.width;
      const t = Math.max(0, Math.min(duration, ratio * duration));
      dispatch({ type: 'SET_CURRENT_TIME', time: t });
    };
    const onUp = () => {
      if (wasPlaying) dispatch({ type: 'SET_PLAYING', playing: true });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [duration, isPlaying, dispatch, handleRulerClick]);

  const [blockDrag, setBlockDrag] = useState<BlockDrag | null>(null);
  const blockDragRef = useRef<BlockDrag | null>(null);

  // Drag an animation block: move = geser waktu mulai, left/right = ubah durasi.
  // Nilai lokal selama seret; satu UPDATE_OBJECT dikirim saat dilepas.
  const startBlockDrag = useCallback((e: React.PointerEvent, objectId: string, anim: AnimationConfig, mode: BlockDrag['mode']) => {
    if (!selectedScene) return;
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'SELECT_OBJECT', objectId });
    const body = (e.currentTarget as HTMLElement).closest('.timeline-track-body') as HTMLElement | null;
    const trackWidth = body?.getBoundingClientRect().width ?? 1;
    const initial: BlockDrag = {
      objectId, mode, startX: e.clientX, trackWidth,
      origStartTime: anim.startTime, origDuration: anim.duration, delay: anim.delay,
      curStartTime: anim.startTime, curDuration: anim.duration,
    };
    blockDragRef.current = initial;
    setBlockDrag(initial);

    const onMove = (me: PointerEvent) => {
      const d = blockDragRef.current;
      if (!d) return;
      const dt = ((me.clientX - d.startX) / d.trackWidth) * duration;
      const effStart = d.origStartTime + d.delay;
      const effEnd = effStart + d.origDuration;
      let startTime = d.origStartTime;
      let dur = d.origDuration;
      if (d.mode === 'move') {
        startTime = clampN(snap(d.origStartTime + dt), 0, Math.max(0, duration - d.delay - d.origDuration));
      } else if (d.mode === 'right') {
        dur = clampN(snap(d.origDuration + dt), 0.2, Math.max(0.2, duration - effStart));
      } else {
        const newEffStart = clampN(snap(effStart + dt), 0, effEnd - 0.2);
        startTime = Math.max(0, newEffStart - d.delay);
        dur = effEnd - (startTime + d.delay);
      }
      const next = { ...d, curStartTime: startTime, curDuration: dur };
      blockDragRef.current = next;
      setBlockDrag(next);
    };
    const onUp = () => {
      const d = blockDragRef.current;
      blockDragRef.current = null;
      setBlockDrag(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (d && selectedScene && (d.curStartTime !== d.origStartTime || d.curDuration !== d.origDuration)) {
        const obj = selectedScene.objects.find(o => o.id === d.objectId);
        if (obj) {
          dispatch({
            type: 'UPDATE_OBJECT',
            sceneId: selectedScene.id,
            objectId: d.objectId,
            updates: {
              animation: {
                ...obj.animation,
                startTime: Math.round(d.curStartTime * 100) / 100,
                duration: Math.round(d.curDuration * 100) / 100,
                endTime: Math.round((d.curStartTime + d.curDuration) * 100) / 100,
              },
            },
          });
        }
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [selectedScene, duration, dispatch]);

  const objects = selectedScene?.objects ?? [];
  const sortedObjects = [...objects].sort((a, b) => b.zIndex - a.zIndex);

  const timeStr = currentTime.toFixed(2);
  const playheadPct = Math.min(100, (currentTime / (duration || 1)) * 100);

  // Ruler ticks
  const ticks: number[] = [];
  const tickInterval = duration > 20 ? 5 : duration > 8 ? 2 : 1;
  for (let t = 0; t <= duration; t += tickInterval) ticks.push(t);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="timeline-header">
        {/* Controls */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={isPlaying ? pause : play}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <IconPause size={14} /> : <IconPlay size={14} />}
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={stop}
          title="Stop"
        >
          <IconStop size={12} />
        </button>

        <div className="timeline-time-display">{timeStr}s</div>

        {/* Ruler */}
        <div
          ref={rulerRef}
          className="timeline-ruler"
          style={{ flex: 1 }}
          onMouseDown={handleRulerMouseDown}
        >
          {/* Ticks */}
          {ticks.map(t => (
            <div
              key={t}
              className="timeline-ruler-tick"
              style={{ left: `${(t / duration) * 100}%` }}
            />
          ))}
          {ticks.map(t => (
            <div
              key={`label-${t}`}
              style={{
                position: 'absolute',
                left: `${(t / duration) * 100}%`,
                top: 2,
                fontSize: 8,
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)',
                paddingLeft: 2,
                pointerEvents: 'none',
              }}
            >
              {t}s
            </div>
          ))}
          {/* Playhead */}
          <div className="timeline-playhead" style={{ left: `${playheadPct}%` }} />
        </div>

        {/* Duration */}
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span>Total:</span>
          <input
            type="number"
            style={{
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 3, color: 'var(--text-primary)', fontSize: 10,
              fontFamily: 'var(--font-mono)', padding: '2px 4px', width: 44,
              textAlign: 'right', outline: 'none',
            }}
            value={selectedScene?.duration ?? 5}
            min={0.5}
            max={120}
            step={0.5}
            onChange={e => {
              if (!selectedScene) return;
              dispatch({ type: 'UPDATE_SCENE', sceneId: selectedScene.id, updates: { duration: parseFloat(e.target.value) || 5 } });
            }}
          />
          <span>s</span>
        </div>
      </div>

      <div style={{ padding: '2px 10px', fontSize: 9, color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>
        Seret blok animasi untuk menggeser waktu mulai · tarik tepi kiri/kanan blok untuk mengubah durasi
      </div>

      {/* Tracks */}
      <div className="timeline-tracks">
        {sortedObjects.length === 0 ? (
          <div style={{ padding: '8px 12px', fontSize: 10, color: 'var(--text-tertiary)' }}>
            No objects in scene.
          </div>
        ) : (
          sortedObjects.map(obj => {
            const anim = obj.animation;
            const hasAnim = anim.preset !== 'none';
            const dragging = blockDrag?.objectId === obj.id ? blockDrag : null;
            const effStartTime = dragging ? dragging.curStartTime : anim.startTime;
            const effDuration = dragging ? dragging.curDuration : anim.duration;
            const blockLeft = `${Math.max(0, ((effStartTime + anim.delay) / duration) * 100)}%`;
            const blockWidth = `${Math.min(100, (effDuration / duration) * 100)}%`;
            const isSelected = state.selectedObjectIds.includes(obj.id);

            return (
              <div key={obj.id} className="timeline-track">
                <div
                  className="timeline-track-label"
                  style={{ opacity: obj.visible ? 1 : 0.4 }}
                  onClick={() => dispatch({ type: 'SELECT_OBJECT', objectId: obj.id })}
                >
                  {obj.name}
                </div>
                <div className="timeline-track-body">
                  {hasAnim && (
                    <div
                      className={`timeline-block ${isSelected ? 'selected' : ''}`}
                      style={{ left: blockLeft, width: blockWidth, maxWidth: '100%', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
                      title={`${anim.preset} — mulai ${(effStartTime + anim.delay).toFixed(2)}s, durasi ${effDuration.toFixed(2)}s. Seret untuk menggeser, tarik tepi untuk mengubah durasi.`}
                      onPointerDown={e => startBlockDrag(e, obj.id, anim, 'move')}
                    >
                      <div
                        className="tl-handle tl-handle-left"
                        onPointerDown={e => startBlockDrag(e, obj.id, anim, 'left')}
                      />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}>
                        {anim.preset} · {effDuration.toFixed(1)}s
                      </span>
                      <div
                        className="tl-handle tl-handle-right"
                        onPointerDown={e => startBlockDrag(e, obj.id, anim, 'right')}
                      />
                    </div>
                  )}
                  {/* Playhead overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0, bottom: 0,
                    left: `${playheadPct}%`,
                    width: 1,
                    background: 'var(--accent)',
                    opacity: 0.5,
                    pointerEvents: 'none',
                  }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
