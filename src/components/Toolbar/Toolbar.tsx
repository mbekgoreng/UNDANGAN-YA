// ============================================================
// Top Toolbar
// ============================================================
import React, { useState, useCallback } from 'react';
import { useApp } from '../../app/AppContext';
import {
  IconUndo, IconRedo, IconZoomIn, IconZoomOut,
  IconPlay, IconGear, IconExport, IconFolder, IconClose,
} from '../Icons';

export function Toolbar() {
  const { state, dispatch } = useApp();
  const { project, saveStatus, zoom, isPlaying, history } = state;

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(project.meta.name);

  const handleNameBlur = useCallback(() => {
    setEditingName(false);
    if (nameValue.trim()) {
      dispatch({ type: 'UPDATE_PROJECT_META', meta: { name: nameValue.trim() } });
    } else {
      setNameValue(project.meta.name);
    }
  }, [nameValue, project.meta.name, dispatch]);

  const handleNameKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
    if (e.key === 'Escape') { setNameValue(project.meta.name); setEditingName(false); }
  }, [project.meta.name]);

  const zoomPercent = Math.round(zoom * 100);

  const saveLabel = {
    saved: '✓ Saved',
    saving: '↻ Saving…',
    unsaved: '● Unsaved',
    error: '✕ Error',
  }[saveStatus];

  return (
    <div className="studio-toolbar">
      {/* Logo */}
      <div className="toolbar-logo">
        <div className="toolbar-logo-mark">U</div>
        <div className="toolbar-logo-name">
          UndangYa! <span>Studio</span>
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Project name */}
      <div className="toolbar-project-name">
        {editingName ? (
          <input
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKey}
            autoFocus
          />
        ) : (
          <span
            style={{ cursor: 'text', color: 'var(--text-primary)' }}
            onDoubleClick={() => { setNameValue(project.meta.name); setEditingName(true); }}
            title="Double-click to rename"
          >
            {project.meta.name}
          </span>
        )}
      </div>

      {/* Save status */}
      <div className={`save-status ${saveStatus}`}>
        <span>{saveLabel}</span>
      </div>

      <div className="toolbar-divider" />

      {/* Undo / Redo */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => dispatch({ type: 'UNDO' })}
        disabled={history.past.length === 0}
        data-tip="Undo (Ctrl+Z)"
      >
        <IconUndo size={14} />
      </button>
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => dispatch({ type: 'REDO' })}
        disabled={history.future.length === 0}
        data-tip="Redo (Ctrl+Y)"
      >
        <IconRedo size={14} />
      </button>

      <div className="toolbar-divider" />

      {/* Zoom */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => dispatch({ type: 'SET_ZOOM', zoom: zoom - 0.1 })}
        data-tip="Zoom out (-)"
      >
        <IconZoomOut size={14} />
      </button>
      <div className="zoom-display">{zoomPercent}%</div>
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => dispatch({ type: 'SET_ZOOM', zoom: zoom + 0.1 })}
        data-tip="Zoom in (+)"
      >
        <IconZoomIn size={14} />
      </button>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => dispatch({ type: 'SET_ZOOM', zoom: 1 })}
        style={{ fontSize: 9, padding: '3px 6px' }}
      >
        Fit
      </button>

      <div className="toolbar-spacer" />

      {/* Projects */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => dispatch({ type: 'TOGGLE_PROJECT_MANAGER' })}
        data-tip="Projects"
      >
        <IconFolder size={14} />
      </button>

      {/* Preview */}
      <button
        className="btn btn-ghost"
        onClick={() => dispatch({ type: 'TOGGLE_PREVIEW' })}
        data-tip="Preview invitation"
      >
        <IconPlay size={12} />
        Preview
      </button>

      {/* Export */}
      <button
        className="btn btn-primary"
        onClick={() => dispatch({ type: 'TOGGLE_EXPORT_DIALOG' })}
        data-tip="Export invitation website"
      >
        <IconExport size={12} />
        Export
      </button>

      {/* Event, music & gifts */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => dispatch({ type: 'TOGGLE_EVENT_PANEL' })}
        data-tip="Acara, Musik & Amplop"
      >
        <IconGear size={14} />
      </button>
    </div>
  );
}
