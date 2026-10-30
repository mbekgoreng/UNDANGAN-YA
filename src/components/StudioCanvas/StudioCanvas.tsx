// ============================================================
// UndangYa! HTML Visual Studio — StudioCanvas Component
// Central interactive canvas with live iframe DOM bridge,
// overlay selection handles, live drag/resize & responsive frame
// ============================================================
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useStudio } from '../../context/StudioContext';
import { extractElementInfo, buildDomTree, generateOptimalSelector } from '../../utils/domUtils';
import './StudioCanvas.css';

interface DragState {
  type: 'move' | 'resize' | 'rotate';
  handle?: string;
  startX: number;
  startY: number;
  startRect: { x: number; y: number; width: number; height: number; left: number; top: number };
  startAngle?: number;
  targetElement: HTMLElement | null;
}

export function StudioCanvas() {
  const {
    project,
    selectedElement,
    editorMode,
    viewport,
    zoom,
    compareMode,
    iframeKey,
    selectElement,
    updateElementStyles,
    deleteSelectedElement,
    duplicateSelectedElement,
    setHoveredElementSelector,
    setDomTree,
    setEditorMode,
    openSample,
  } = useStudio();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const originalIframeRef = useRef<HTMLIFrameElement>(null);
  const [hoverRect, setHoverRect] = useState<{ x: number; y: number; width: number; height: number; tag: string } | null>(null);
  const [selectedRect, setSelectedRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);

  // Sync selected element rect whenever selection changes or iframe scrolls
  const updateSelectedRectFromDom = useCallback(() => {
    if (!iframeRef.current || !selectedElement) {
      setSelectedRect(null);
      return;
    }
    try {
      const doc = iframeRef.current.contentDocument;
      if (!doc) return;
      const el = doc.querySelector(selectedElement.selector) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setSelectedRect({
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
        });
      }
    } catch {
      // Ignore cross-context query errors
    }
  }, [selectedElement]);

  useEffect(() => {
    updateSelectedRectFromDom();
  }, [selectedElement, updateSelectedRectFromDom]);

  // Handle iframe load: scan DOM, attach event listeners
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) return;

      // Build DOM hierarchy for Layers panel
      const tree = buildDomTree(doc.body);
      setDomTree(tree);

      // Listen to scroll inside iframe to update bounding overlays
      const handleScroll = () => {
        updateSelectedRectFromDom();
      };
      doc.addEventListener('scroll', handleScroll, { passive: true });

      // Mousemove inside iframe: detect hover element
      const handleDocMouseMove = (e: MouseEvent) => {
        if (dragStateRef.current || editorMode === 'preview') return;
        const target = doc.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (!target || target === doc.body || target === doc.documentElement) {
          setHoverRect(null);
          setHoveredElementSelector(null);
          return;
        }

        const rect = target.getBoundingClientRect();
        const tag = target.tagName.toLowerCase() + (target.className && typeof target.className === 'string' ? '.' + target.className.split(' ')[0] : '');
        setHoverRect({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          tag,
        });
        setHoveredElementSelector(generateOptimalSelector(target));
      };

      // Click inside iframe: select element or handle asset placement
      const handleDocClick = (e: MouseEvent) => {
        if (editorMode === 'preview') return;

        // Prevent links and form submissions from navigating
        e.preventDefault();
        e.stopPropagation();

        const target = doc.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (!target || target === doc.body || target === doc.documentElement) {
          selectElement(null);
          return;
        }

        // If in asset placement mode, place asset into this element
        if (editorMode === 'asset-place') {
          const selector = generateOptimalSelector(target);
          window.dispatchEvent(new CustomEvent('undangya-place-asset-target', { detail: { selector } }));
          return;
        }

        // Extract computed info and select
        const info = extractElementInfo(target, iframe);
        selectElement(info);
      };

      doc.addEventListener('mousemove', handleDocMouseMove);
      doc.addEventListener('click', handleDocClick, true);

      // Cleanup on unload or reload
      return () => {
        doc.removeEventListener('scroll', handleScroll);
        doc.removeEventListener('mousemove', handleDocMouseMove);
        doc.removeEventListener('click', handleDocClick, true);
      };
    } catch (err) {
      console.warn('Cannot attach listeners to iframe DOM:', err);
    }
  }, [editorMode, selectElement, setHoveredElementSelector, setDomTree, updateSelectedRectFromDom]);

  // Window-level mouse/pointer events for drag & resize operations
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || !state.targetElement) return;

      const deltaX = (e.clientX - state.startX) / zoom;
      const deltaY = (e.clientY - state.startY) / zoom;

      if (state.type === 'move') {
        const computed = window.getComputedStyle(state.targetElement);
        const isAbsolute = computed.position === 'absolute' || computed.position === 'fixed';

        let newX = state.startRect.left + deltaX;
        let newY = state.startRect.top + deltaY;

        if (isAbsolute) {
          state.targetElement.style.left = `${newX}px`;
          state.targetElement.style.top = `${newY}px`;
        } else {
          // Use transform translate if relative or static
          state.targetElement.style.position = 'relative';
          state.targetElement.style.left = `${newX}px`;
          state.targetElement.style.top = `${newY}px`;
        }

        const r = state.targetElement.getBoundingClientRect();
        setSelectedRect({ x: r.x, y: r.y, width: r.width, height: r.height });
      } else if (state.type === 'resize') {
        const h = state.handle || 'se';
        let newWidth = state.startRect.width;
        let newHeight = state.startRect.height;

        if (h.includes('e')) newWidth = Math.max(16, state.startRect.width + deltaX);
        if (h.includes('w')) newWidth = Math.max(16, state.startRect.width - deltaX);
        if (h.includes('s')) newHeight = Math.max(16, state.startRect.height + deltaY);
        if (h.includes('n')) newHeight = Math.max(16, state.startRect.height - deltaY);

        state.targetElement.style.width = `${Math.round(newWidth)}px`;
        state.targetElement.style.height = `${Math.round(newHeight)}px`;

        const r = state.targetElement.getBoundingClientRect();
        setSelectedRect({ x: r.x, y: r.y, width: r.width, height: r.height });
      } else if (state.type === 'rotate' && state.startAngle !== undefined) {
        const centerX = state.startRect.left + state.startRect.width / 2;
        const centerY = state.startRect.top + state.startRect.height / 2;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const angleDiff = Math.round(currentAngle - state.startAngle);
        state.targetElement.style.transform = `rotate(${angleDiff}deg)`;
      }
    };

    const handlePointerUp = () => {
      const state = dragStateRef.current;
      if (!state || !state.targetElement) return;

      setIsDragging(false);
      dragStateRef.current = null;

      // Commit changes to backend CSS patch
      const computed = window.getComputedStyle(state.targetElement);
      const updates: Record<string, string> = {};

      if (state.type === 'move') {
        updates['position'] = computed.position;
        updates['left'] = state.targetElement.style.left;
        updates['top'] = state.targetElement.style.top;
      } else if (state.type === 'resize') {
        updates['width'] = state.targetElement.style.width;
        updates['height'] = state.targetElement.style.height;
      } else if (state.type === 'rotate') {
        updates['transform'] = state.targetElement.style.transform;
      }

      updateElementStyles(updates, true);
      updateSelectedRectFromDom();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [zoom, updateElementStyles, updateSelectedRectFromDom]);

  // Keyboard navigation & nudging for selected element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElement || editorMode === 'preview') return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const el = doc.querySelector(selectedElement.selector) as HTMLElement | null;
      if (!el) return;

      const step = e.shiftKey ? 10 : 1;
      let handled = false;

      const currentLeft = parseFloat(el.style.left || getComputedStyle(el).left) || 0;
      const currentTop = parseFloat(el.style.top || getComputedStyle(el).top) || 0;

      if (e.key === 'ArrowLeft') {
        el.style.position = el.style.position || 'relative';
        el.style.left = `${currentLeft - step}px`;
        handled = true;
      } else if (e.key === 'ArrowRight') {
        el.style.position = el.style.position || 'relative';
        el.style.left = `${currentLeft + step}px`;
        handled = true;
      } else if (e.key === 'ArrowUp') {
        el.style.position = el.style.position || 'relative';
        el.style.top = `${currentTop - step}px`;
        handled = true;
      } else if (e.key === 'ArrowDown') {
        el.style.position = el.style.position || 'relative';
        el.style.top = `${currentTop + step}px`;
        handled = true;
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedElement();
        handled = true;
      } else if (e.key === 'Escape') {
        selectElement(null);
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          updateElementStyles({
            position: el.style.position,
            left: el.style.left,
            top: el.style.top,
          }, true);
          updateSelectedRectFromDom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, editorMode, updateElementStyles, deleteSelectedElement, selectElement, updateSelectedRectFromDom]);

  // Initiate dragging bounding box
  const startDragMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!iframeRef.current || !selectedElement) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const el = doc.querySelector(selectedElement.selector) as HTMLElement | null;
    if (!el) return;

    const r = el.getBoundingClientRect();
    setIsDragging(true);
    dragStateRef.current = {
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
      startRect: {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        left: parseFloat(el.style.left || getComputedStyle(el).left) || r.x,
        top: parseFloat(el.style.top || getComputedStyle(el).top) || r.y,
      },
      targetElement: el,
    };
  };

  // Initiate resize from handle
  const startResize = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    if (!iframeRef.current || !selectedElement) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const el = doc.querySelector(selectedElement.selector) as HTMLElement | null;
    if (!el) return;

    const r = el.getBoundingClientRect();
    setIsDragging(true);
    dragStateRef.current = {
      type: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startRect: {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        left: r.left,
        top: r.top,
      },
      targetElement: el,
    };
  };

  // Initiate rotation
  const startRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!iframeRef.current || !selectedElement) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const el = doc.querySelector(selectedElement.selector) as HTMLElement | null;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const centerX = r.left + r.width / 2;
    const centerY = r.top + r.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    setIsDragging(true);
    dragStateRef.current = {
      type: 'rotate',
      startX: e.clientX,
      startY: e.clientY,
      startAngle,
      startRect: {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        left: r.left,
        top: r.top,
      },
      targetElement: el,
    };
  };

  // If no project is currently open
  if (!project) {
    return (
      <div className="studio-canvas-root">
        <div className="canvas-empty-state">
          <svg className="canvas-empty-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <h2 style={{ color: '#dfc278', fontSize: '18px', fontWeight: 600 }}>Belum Ada Proyek Undangan Terbuka</h2>
          <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
            Buka folder undangan HTML hasil AI yang ingin diperbaiki, atau coba langsung proyek sampel pernikahan Jawa dengan tata letak yang berantakan.
          </p>
          <div className="canvas-empty-actions">
            <button className="canvas-primary-btn" onClick={openSample}>
              Buka Sampel Proyek Cacat (Ready to Fix)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const iframeSrc = `/api/projects/${project.id}/serve/${project.entryHtml || 'index.html'}?k=${iframeKey}`;
  const isDesktop = viewport.preset === 'desktop';
  const isTablet = viewport.preset === 'tablet';

  return (
    <div className="studio-canvas-root" onClick={() => selectElement(null)}>
      {editorMode === 'asset-place' && (
        <div className="placement-banner">
          <span>Mode Penempatan: Klik pada container/bagian undangan di mana Anda ingin menaruh aset baru.</span>
          <button className="placement-banner-cancel" onClick={() => setEditorMode('move')}>
            Batal
          </button>
        </div>
      )}

      {compareMode === 'split' ? (
        <div className="canvas-split-container">
          {/* Left Column: Original */}
          <div className="canvas-split-column">
            <div className="canvas-split-badge">Asli (Original AI)</div>
            <div
              className="device-wrapper"
              style={{ transform: `scale(${zoom})`, width: viewport.width, height: viewport.height }}
            >
              <div
                className={`device-frame ${isDesktop ? 'frame-desktop' : isTablet ? 'frame-tablet' : ''}`}
                style={{ width: viewport.width, height: viewport.height }}
              >
                {!isDesktop && (
                  <div className="device-notch">
                    <div className="device-speaker" />
                    <div className="device-camera" />
                  </div>
                )}
                <div className="canvas-iframe-container">
                  <iframe
                    ref={originalIframeRef}
                    className="canvas-iframe"
                    src={`/api/projects/${project.id}/serve/${project.entryHtml || 'index.html'}?original=1`}
                    title="Original Viewport"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Edited */}
          <div className="canvas-split-column">
            <div className="canvas-split-badge badge-edited">Hasil Perbaikan (Edited)</div>
            <div
              className="device-wrapper"
              style={{ transform: `scale(${zoom})`, width: viewport.width, height: viewport.height }}
              onClick={e => e.stopPropagation()}
            >
              <div
                className={`device-frame ${isDesktop ? 'frame-desktop' : isTablet ? 'frame-tablet' : ''}`}
                style={{ width: viewport.width, height: viewport.height }}
              >
                {!isDesktop && (
                  <div className="device-notch">
                    <div className="device-speaker" />
                    <div className="device-camera" />
                  </div>
                )}
                <div className="canvas-iframe-container">
                  <iframe
                    ref={iframeRef}
                    className="canvas-iframe"
                    src={iframeSrc}
                    title="Visual Studio Preview"
                    onLoad={handleIframeLoad}
                  />
                  {renderOverlays()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Normal Single Viewport (Edited or Original) */
        <div
          className="device-wrapper"
          style={{ transform: `scale(${zoom})`, width: viewport.width, height: viewport.height }}
          onClick={e => e.stopPropagation()}
        >
          <div
            className={`device-frame ${isDesktop ? 'frame-desktop' : isTablet ? 'frame-tablet' : ''}`}
            style={{ width: viewport.width, height: viewport.height }}
          >
            {!isDesktop && (
              <div className="device-notch">
                <div className="device-speaker" />
                <div className="device-camera" />
              </div>
            )}
            <div className="canvas-iframe-container">
              <iframe
                ref={iframeRef}
                className="canvas-iframe"
                src={compareMode === 'original' ? `${iframeSrc}&original=1` : iframeSrc}
                title="Visual Studio Preview"
                onLoad={handleIframeLoad}
              />
              {compareMode !== 'original' && renderOverlays()}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render interactive selection & hover overlays
  function renderOverlays() {
    if (editorMode === 'preview') return null;

    return (
      <div className="canvas-overlay-layer">
        {/* Hover Highlight Box */}
        {hoverRect && !selectedRect && (
          <div
            className="overlay-hover-box"
            style={{
              left: `${hoverRect.x}px`,
              top: `${hoverRect.y}px`,
              width: `${hoverRect.width}px`,
              height: `${hoverRect.height}px`,
            }}
          >
            <div className="overlay-hover-tag">{hoverRect.tag}</div>
          </div>
        )}

        {/* Selected Element Box & Handles */}
        {selectedRect && (
          <div
            className={`overlay-selection-box ${isDragging ? 'is-dragging' : ''}`}
            style={{
              left: `${selectedRect.x}px`,
              top: `${selectedRect.y}px`,
              width: `${selectedRect.width}px`,
              height: `${selectedRect.height}px`,
            }}
            onPointerDown={startDragMove}
          >
            {/* Quick Action Toolbar above selection */}
            <div className="overlay-action-toolbar" onPointerDown={e => e.stopPropagation()}>
              <span className="overlay-tag-pill">{selectedElement?.tagName}</span>
              <button
                className="overlay-action-btn"
                onClick={() => duplicateSelectedElement()}
                title="Duplikat Elemen"
              >
                Duplikat
              </button>
              <button
                className="overlay-action-btn btn-delete"
                onClick={() => deleteSelectedElement()}
                title="Hapus Elemen"
              >
                Hapus
              </button>
            </div>

            {/* Resize Handles (8 directions) */}
            <div className="resize-handle handle-nw" onPointerDown={e => startResize(e, 'nw')} />
            <div className="resize-handle handle-n"  onPointerDown={e => startResize(e, 'n')} />
            <div className="resize-handle handle-ne" onPointerDown={e => startResize(e, 'ne')} />
            <div className="resize-handle handle-e"  onPointerDown={e => startResize(e, 'e')} />
            <div className="resize-handle handle-se" onPointerDown={e => startResize(e, 'se')} />
            <div className="resize-handle handle-s"  onPointerDown={e => startResize(e, 's')} />
            <div className="resize-handle handle-sw" onPointerDown={e => startResize(e, 'sw')} />
            <div className="resize-handle handle-w"  onPointerDown={e => startResize(e, 'w')} />

            {/* Rotation Handle */}
            <div className="rotate-handle-stem" />
            <div className="rotate-handle" onPointerDown={startRotate} title="Putar Elemen" />

            {/* Dimensions Pill below element */}
            <div className="overlay-dim-pill">
              {Math.round(selectedRect.width)} × {Math.round(selectedRect.height)} px
            </div>
          </div>
        )}
      </div>
    );
  }
}
