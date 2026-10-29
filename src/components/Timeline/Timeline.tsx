// ============================================================
// Timeline Panel — playback, scrubbing, animation tracks
// ============================================================
import React, { useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../app/AppContext';
import { IconPlay, IconPause, IconStop } from '../Icons';

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
            const blockLeft = `${Math.max(0, ((anim.startTime + anim.delay) / duration) * 100)}%`;
            const blockWidth = `${Math.min(100, (anim.duration / duration) * 100)}%`;

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
                      className="timeline-block"
                      style={{ left: blockLeft, width: blockWidth, maxWidth: '100%' }}
                      title={`${anim.preset} — ${anim.duration}s`}
                    >
                      {anim.preset}
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
