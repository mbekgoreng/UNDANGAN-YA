// ============================================================
// Canvas Editor — 2D Object Renderer with Snapping, Alignment Guides,
// Inline Text Editing, Pan/Zoom & Transformation
// ============================================================
import React, {
  useRef, useState, useEffect, useCallback, useMemo,
} from 'react';
import { useApp } from '../../app/AppContext';
import type { SceneObject, ImageObject, TextObject, ShapeObject } from '../../schemas/project';
import { getAssetObjectURL } from '../../storage/db';
import { computeAnimatedState } from '../../engine/animation/presets';

// ---- Image URL cache ----
const imageUrlCache = new Map<string, string>();

async function getImageUrl(assetId: string): Promise<string | null> {
  if (imageUrlCache.has(assetId)) return imageUrlCache.get(assetId)!;
  const url = await getAssetObjectURL(assetId);
  if (url) imageUrlCache.set(assetId, url);
  return url;
}

interface ActiveGuides {
  x: number | null;
  y: number | null;
}

// ---- Individual object on canvas ----
interface CanvasObjectProps {
  object: SceneObject;
  isSelected: boolean;
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
  enableSnapping: boolean;
  isPlaying: boolean;
  currentTime: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SceneObject>) => void;
  onGuideChange: (guides: ActiveGuides) => void;
}

function CanvasObjectRenderer({
  object,
  isSelected,
  scale,
  canvasWidth,
  canvasHeight,
  enableSnapping,
  isPlaying,
  currentTime,
  onSelect,
  onUpdate,
  onGuideChange,
}: CanvasObjectProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editingText, setEditingText] = useState('');

  const dragRef = useRef<{ startX: number; startY: number; objX: number; objY: number } | null>(null);
  const resizeRef = useRef<{ handle: string; startX: number; startY: number; startW: number; startH: number; startObjX: number; startObjY: number } | null>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLTextAreaElement>(null);

  // Load image
  useEffect(() => {
    if (object.type !== 'image') return;
    const imgObj = object as ImageObject;
    getImageUrl(imgObj.assetId).then(setImageUrl);
  }, [object.type, (object as ImageObject).assetId]);

  // Sync text edit state
  useEffect(() => {
    if (object.type === 'text') {
      setEditingText((object as TextObject).text);
    }
  }, [object]);

  // Focus textarea when entering inline editing
  useEffect(() => {
    if (isInlineEditing && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [isInlineEditing]);

  // Animated state
  const animState = useMemo(() => {
    if (!isPlaying) return null;
    return computeAnimatedState(object.animation.preset, object.animation, currentTime, object.opacity);
  }, [isPlaying, object.animation, currentTime, object.opacity]);

  const opacity = animState ? animState.opacity : object.opacity;
  const tx = animState ? animState.translateX : 0;
  const ty = animState ? animState.translateY : 0;
  const sx = animState ? animState.scaleX : 1;
  const sy = animState ? animState.scaleY : 1;
  const rot = animState ? (object.rotation + animState.rotate) : object.rotation;

  // Drag interaction with snapping
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (object.locked || isPlaying || isInlineEditing) return;
    if (e.button !== 0) return; // only left click
    e.stopPropagation();
    onSelect(object.id);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      objX: object.x,
      objY: object.y,
    };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (me.clientX - dragRef.current.startX) / scale;
      const dy = (me.clientY - dragRef.current.startY) / scale;

      let newX = Math.round(dragRef.current.objX + dx);
      let newY = Math.round(dragRef.current.objY + dy);
      let guideX: number | null = null;
      let guideY: number | null = null;

      if (enableSnapping) {
        const snapThreshold = 7;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const objCenterX = newX + object.width / 2;
        const objCenterY = newY + object.height / 2;

        // Center X snap
        if (Math.abs(objCenterX - centerX) <= snapThreshold) {
          newX = Math.round(centerX - object.width / 2);
          guideX = centerX;
        } else if (Math.abs(newX) <= snapThreshold) {
          newX = 0;
          guideX = 0;
        } else if (Math.abs(newX + object.width - canvasWidth) <= snapThreshold) {
          newX = canvasWidth - object.width;
          guideX = canvasWidth;
        }

        // Center Y snap
        if (Math.abs(objCenterY - centerY) <= snapThreshold) {
          newY = Math.round(centerY - object.height / 2);
          guideY = centerY;
        } else if (Math.abs(newY) <= snapThreshold) {
          newY = 0;
          guideY = 0;
        } else if (Math.abs(newY + object.height - canvasHeight) <= snapThreshold) {
          newY = canvasHeight - object.height;
          guideY = canvasHeight;
        }
      }

      onGuideChange({ x: guideX, y: guideY });
      onUpdate(object.id, { x: newX, y: newY });
    };

    const onUp = () => {
      dragRef.current = null;
      onGuideChange({ x: null, y: null });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [object, scale, isPlaying, isInlineEditing, enableSnapping, canvasWidth, canvasHeight, onSelect, onUpdate, onGuideChange]);

  // Resize interaction
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    if (object.locked || isPlaying || isInlineEditing) return;
    e.stopPropagation();
    e.preventDefault();

    resizeRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startW: object.width,
      startH: object.height,
      startObjX: object.x,
      startObjY: object.y,
    };

    const onMove = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = (me.clientX - resizeRef.current.startX) / scale;
      const dy = (me.clientY - resizeRef.current.startY) / scale;
      const { handle, startW, startH, startObjX, startObjY } = resizeRef.current;

      let newW = startW, newH = startH, newX = startObjX, newY = startObjY;

      if (handle.includes('e')) newW = Math.max(20, startW + dx);
      if (handle.includes('w')) { newW = Math.max(20, startW - dx); newX = startObjX + (startW - newW); }
      if (handle.includes('s')) newH = Math.max(20, startH + dy);
      if (handle.includes('n')) { newH = Math.max(20, startH - dy); newY = startObjY + (startH - newH); }

      onUpdate(object.id, {
        x: Math.round(newX), y: Math.round(newY),
        width: Math.round(newW), height: Math.round(newH),
      });
    };

    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [object, scale, isPlaying, isInlineEditing, onUpdate]);

  // Rotate interaction
  const handleRotateMouseDown = useCallback((e: React.MouseEvent) => {
    if (object.locked || isPlaying || isInlineEditing) return;
    e.stopPropagation();
    e.preventDefault();
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) - object.rotation;

    const onMove = (me: MouseEvent) => {
      const angle = Math.atan2(me.clientY - cy, me.clientX - cx) * (180 / Math.PI) - startAngle;
      onUpdate(object.id, { rotation: Math.round(angle) });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [object, isPlaying, isInlineEditing, onUpdate]);

  // Double click for text editing
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (object.type === 'text' && !object.locked && !isPlaying) {
      e.stopPropagation();
      setIsInlineEditing(true);
    }
  }, [object.type, object.locked, isPlaying]);

  const commitInlineText = useCallback(() => {
    setIsInlineEditing(false);
    onUpdate(object.id, { text: editingText });
  }, [object.id, editingText, onUpdate]);

  if (!object.visible) return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: object.x * scale,
    top: object.y * scale,
    width: object.width * scale,
    height: object.height * scale,
    transform: `rotate(${rot}deg) translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
    transformOrigin: 'center center',
    opacity,
    cursor: object.locked ? 'default' : isInlineEditing ? 'text' : 'move',
    userSelect: isInlineEditing ? 'text' : 'none',
    pointerEvents: isPlaying ? 'none' : 'auto',
  };

  // Render object content
  let content: React.ReactNode = null;

  if (object.type === 'image') {
    const flipX = (object as ImageObject).flipX;
    const flipY = (object as ImageObject).flipY;
    content = imageUrl ? (
      <img
        src={imageUrl}
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain',
          transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
          display: 'block',
          pointerEvents: 'none',
        }}
        draggable={false}
        alt=""
      />
    ) : (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', fontSize: 10, color: 'var(--text-tertiary)' }}>
        Loading…
      </div>
    );
  } else if (object.type === 'text') {
    const t = object as TextObject;
    content = isInlineEditing ? (
      <textarea
        ref={inlineInputRef}
        style={{
          width: '100%',
          height: '100%',
          fontFamily: t.fontFamily,
          fontSize: `${t.fontSize * scale}px`,
          fontWeight: t.fontWeight,
          fontStyle: t.fontStyle,
          textAlign: t.textAlign,
          lineHeight: t.lineHeight,
          letterSpacing: `${t.letterSpacing}px`,
          color: t.fill,
          background: 'rgba(0,0,0,0.4)',
          border: '1px dashed var(--accent)',
          borderRadius: 2,
          padding: 0,
          margin: 0,
          outline: 'none',
          resize: 'none',
          overflow: 'hidden',
        }}
        value={editingText}
        onChange={e => setEditingText(e.target.value)}
        onBlur={commitInlineText}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commitInlineText();
          if (e.key === 'Escape') {
            setEditingText(t.text);
            setIsInlineEditing(false);
          }
        }}
      />
    ) : (
      <div
        style={{
          width: '100%', height: '100%',
          fontFamily: t.fontFamily,
          fontSize: t.fontSize * scale,
          fontWeight: t.fontWeight,
          fontStyle: t.fontStyle,
          textAlign: t.textAlign,
          lineHeight: t.lineHeight,
          letterSpacing: `${t.letterSpacing}px`,
          color: t.fill,
          textDecoration: t.textDecoration,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: t.textAlign === 'center' ? 'center' : t.textAlign === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        {t.text}
      </div>
    );
  } else if (object.type === 'shape') {
    const s = object as ShapeObject;
    if (s.shapeType === 'ellipse') {
      content = (
        <div style={{
          width: '100%', height: '100%',
          borderRadius: '50%',
          background: s.fill,
          border: `${s.strokeWidth}px solid ${s.stroke}`,
          boxSizing: 'border-box',
        }} />
      );
    } else {
      content = (
        <div style={{
          width: '100%', height: '100%',
          background: s.fill,
          border: `${s.strokeWidth}px solid ${s.stroke}`,
          borderRadius: s.cornerRadius ? `${s.cornerRadius}px` : 0,
          boxSizing: 'border-box',
        }} />
      );
    }
  }

  const HANDLE_SIZE = 8;
  const handles = ['n','ne','e','se','s','sw','w','nw'];
  const handlePositions: Record<string, React.CSSProperties> = {
    n: { top: -HANDLE_SIZE/2, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' },
    ne: { top: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'ne-resize' },
    e: { top: '50%', right: -HANDLE_SIZE/2, transform: 'translateY(-50%)', cursor: 'e-resize' },
    se: { bottom: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'se-resize' },
    s: { bottom: -HANDLE_SIZE/2, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' },
    sw: { bottom: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'sw-resize' },
    w: { top: '50%', left: -HANDLE_SIZE/2, transform: 'translateY(-50%)', cursor: 'w-resize' },
    nw: { top: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'nw-resize' },
  };

  return (
    <div
      ref={elRef}
      style={style}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {content}

      {/* Selection UI */}
      {isSelected && !isPlaying && !isInlineEditing && (
        <>
          <div style={{
            position: 'absolute', inset: -2,
            border: '2px solid var(--accent)',
            pointerEvents: 'none',
            borderRadius: 1,
          }} />

          {handles.map(h => (
            <div
              key={h}
              style={{
                position: 'absolute',
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                background: '#fff',
                border: '1px solid var(--accent)',
                borderRadius: 1,
                zIndex: 10,
                ...handlePositions[h],
              }}
              onMouseDown={e => handleResizeMouseDown(e, h)}
            />
          ))}

          {/* Rotate handle */}
          <div
            style={{
              position: 'absolute',
              top: -24,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 12,
              height: 12,
              background: 'var(--accent)',
              borderRadius: '50%',
              cursor: 'grab',
              zIndex: 10,
            }}
            onMouseDown={handleRotateMouseDown}
            title="Rotate"
          />
          <div style={{
            position: 'absolute',
            top: -16,
            left: '50%',
            width: 1,
            height: 14,
            background: 'var(--accent)',
            transformOrigin: 'top center',
          }} />
        </>
      )}
    </div>
  );
}

// ---- Main Canvas Editor ----
export function CanvasEditor() {
  const { state, dispatch, selectedScene } = useApp();
  const { project, selectedObjectIds, zoom, isPlaying, currentTime, selectedSceneId } = state;
  const { canvas } = project;

  const containerRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [enableSnapping, setEnableSnapping] = useState(true);
  const [activeGuides, setActiveGuides] = useState<ActiveGuides>({ x: null, y: null });

  const panStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const canvasW = canvas.width * zoom;
  const canvasH = canvas.height * zoom;
  const selectedId = selectedObjectIds[0] ?? null;

  const objects = useMemo(() => {
    if (!selectedScene) return [];
    return [...selectedScene.objects]
      .filter(o => o.visible)
      .sort((a, b) => a.zIndex - b.zIndex);
  }, [selectedScene]);

  // Track spacebar for pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Canvas Pan handler (Space+drag or middle mouse click)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };

      const onMove = (me: MouseEvent) => {
        if (!panStart.current) return;
        setPanOffset({
          x: panStart.current.ox + (me.clientX - panStart.current.x),
          y: panStart.current.oy + (me.clientY - panStart.current.y),
        });
      };
      const onUp = () => {
        setIsPanning(false);
        panStart.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return;
    }

    // Deselect if left-click directly on canvas background
    if (e.button === 0) {
      dispatch({ type: 'SELECT_OBJECT', objectId: null });
    }
  }, [isSpacePressed, panOffset, dispatch]);

  const handleResetPan = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
    dispatch({ type: 'SET_ZOOM', zoom: 1 });
  }, [dispatch]);

  // Drag asset from sidebar onto canvas
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (!selectedSceneId) return;
    const assetId = e.dataTransfer.getData('application/undangya-asset');
    if (!assetId) return;
    const asset = state.assets.find(a => a.id === assetId);
    if (!asset) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const dropX = (e.clientX - containerRect.left - canvasW / 2 + canvas.width * zoom / 2 - panOffset.x) / zoom;
    const dropY = (e.clientY - containerRect.top - canvasH / 2 + canvas.height * zoom / 2 - panOffset.y) / zoom;
    const w = Math.min(asset.width || 200, 300);
    const h = Math.min(asset.height || 200, 300);

    const obj = {
      id: crypto.randomUUID(),
      type: 'image' as const,
      name: asset.name,
      x: Math.round(dropX - w / 2),
      y: Math.round(dropY - h / 2),
      width: w, height: h,
      rotation: 0, opacity: 1,
      visible: true, locked: false,
      zIndex: Date.now(),
      assetId: asset.id,
      flipX: false, flipY: false,
      animation: { preset: 'none' as const, duration: 1, delay: 0, easing: 'easeOut' as const, loop: false, startTime: 0, endTime: 1 },
    };
    dispatch({ type: 'ADD_OBJECT', sceneId: selectedSceneId, object: obj });
    dispatch({ type: 'SELECT_OBJECT', objectId: obj.id });
  }, [selectedSceneId, state.assets, canvas, zoom, canvasW, canvasH, panOffset, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedId || !selectedSceneId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        dispatch({ type: 'DELETE_OBJECT', sceneId: selectedSceneId, objectId: selectedId });
        dispatch({ type: 'SELECT_OBJECT', objectId: null });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const obj = selectedScene?.objects.find(o => o.id === selectedId);
        if (!obj) return;
        const newObj: SceneObject = { ...obj, id: crypto.randomUUID(), name: obj.name + ' Copy', x: obj.x + 12, y: obj.y + 12, zIndex: Date.now() };
        dispatch({ type: 'ADD_OBJECT', sceneId: selectedSceneId, object: newObj });
        dispatch({ type: 'SELECT_OBJECT', objectId: newObj.id });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, selectedSceneId, selectedScene, dispatch]);

  // Zoom with scroll wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        dispatch({ type: 'SET_ZOOM', zoom: zoom + delta });
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [zoom, dispatch]);

  const handleSelect = useCallback((id: string) => {
    dispatch({ type: 'SELECT_OBJECT', objectId: id });
  }, [dispatch]);

  const handleUpdate = useCallback((id: string, updates: Partial<SceneObject>) => {
    if (!selectedSceneId) return;
    dispatch({ type: 'UPDATE_OBJECT', sceneId: selectedSceneId, objectId: id, updates });
  }, [selectedSceneId, dispatch]);

  // Add text helper
  const addText = useCallback(() => {
    if (!selectedSceneId) return;
    const obj = {
      id: crypto.randomUUID(),
      type: 'text' as const,
      name: 'Teks Undangan',
      x: 35,
      y: Math.round(canvas.height / 2 - 30),
      width: Math.round(canvas.width - 70),
      height: 60,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      text: 'Klik 2x Untuk Mengubah Teks',
      fontFamily: 'Playfair Display, Georgia, serif',
      fontSize: 22,
      fontWeight: 'normal' as const,
      fontStyle: 'normal' as const,
      textAlign: 'center' as const,
      lineHeight: 1.4,
      letterSpacing: 0.5,
      fill: '#f0ece4',
      textDecoration: 'none' as const,
      animation: { preset: 'none' as const, duration: 1, delay: 0, easing: 'easeOut' as const, loop: false, startTime: 0, endTime: 1 },
    };
    dispatch({ type: 'ADD_OBJECT', sceneId: selectedSceneId, object: obj });
    dispatch({ type: 'SELECT_OBJECT', objectId: obj.id });
  }, [selectedSceneId, canvas, dispatch]);

  // Add shape helper
  const addShape = useCallback((shapeType: 'rect' | 'ellipse') => {
    if (!selectedSceneId) return;
    const obj = {
      id: crypto.randomUUID(),
      type: 'shape' as const,
      name: shapeType === 'ellipse' ? 'Bingkai Lingkaran' : 'Bingkai Kotak',
      x: Math.round(canvas.width / 2 - 60),
      y: Math.round(canvas.height / 2 - 60),
      width: 120,
      height: 120,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      shapeType,
      fill: 'rgba(201,168,76,0.1)',
      stroke: '#c9a84c',
      strokeWidth: 1,
      cornerRadius: shapeType === 'rect' ? 6 : undefined,
      animation: { preset: 'none' as const, duration: 1, delay: 0, easing: 'easeOut' as const, loop: false, startTime: 0, endTime: 1 },
    };
    dispatch({ type: 'ADD_OBJECT', sceneId: selectedSceneId, object: obj });
    dispatch({ type: 'SELECT_OBJECT', objectId: obj.id });
  }, [selectedSceneId, canvas, dispatch]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default',
      }}
      onMouseDown={handleCanvasMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Quick-add floating toolbar inside canvas area */}
      {!isPlaying && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(28,28,32,0.92)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '4px 10px',
          zIndex: 100,
          backdropFilter: 'blur(8px)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>TAMBAH</span>
          <button className="btn btn-ghost btn-sm" onClick={addText}>T Teks</button>
          <button className="btn btn-ghost btn-sm" onClick={() => addShape('rect')}>▭ Kotak</button>
          <button className="btn btn-ghost btn-sm" onClick={() => addShape('ellipse')}>◯ Lingkaran</button>
          <div className="toolbar-divider" style={{ height: 16 }} />
          <button
            className={`btn btn-ghost btn-sm ${enableSnapping ? 'text-accent' : ''}`}
            onClick={() => setEnableSnapping(!enableSnapping)}
            title="Snap to Center & Margins"
          >
            🧲 Snap: {enableSnapping ? 'ON' : 'OFF'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleResetPan}
            title="Reset Pan & Zoom ke 100%"
          >
            ⌖ Reset
          </button>
        </div>
      )}

      {/* Main Scaled Canvas */}
      <div
        className="canvas-shadow"
        style={{
          width: canvasW,
          height: canvasH,
          background: selectedScene?.backgroundColor ?? canvas.backgroundColor,
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: isPanning ? 'none' : 'transform 0.05s ease',
        }}
      >
        {/* Alignment Guide Lines */}
        {activeGuides.x !== null && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: activeGuides.x * zoom,
              width: 1,
              borderLeft: '1px dashed #fad961',
              zIndex: 999,
              pointerEvents: 'none',
            }}
          />
        )}
        {activeGuides.y !== null && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: activeGuides.y * zoom,
              height: 1,
              borderTop: '1px dashed #fad961',
              zIndex: 999,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Objects */}
        {objects.map(obj => (
          <CanvasObjectRenderer
            key={obj.id}
            object={obj}
            isSelected={selectedId === obj.id}
            scale={zoom}
            canvasWidth={canvas.width}
            canvasHeight={canvas.height}
            enableSnapping={enableSnapping}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onSelect={handleSelect}
            onUpdate={handleUpdate}
            onGuideChange={setActiveGuides}
          />
        ))}
      </div>

      {/* Canvas size & hints badge */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 9,
        color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-mono)',
        background: 'rgba(0,0,0,0.6)',
        padding: '2px 10px',
        borderRadius: 3,
        display: 'flex',
        gap: 10,
        pointerEvents: 'none',
      }}>
        <span>{canvas.width} × {canvas.height} px</span>
        <span>•</span>
        <span>Spasi + Geser untuk Pan</span>
        <span>•</span>
        <span>Ctrl + Scroll untuk Zoom</span>
      </div>
    </div>
  );
}
