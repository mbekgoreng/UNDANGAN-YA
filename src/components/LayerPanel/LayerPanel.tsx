// ============================================================
// Layer Panel — list, reorder, lock, hide, rename objects
// ============================================================
import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../app/AppContext';
import type { SceneObject } from '../../schemas/project';
import {
  IconEye, IconEyeOff, IconLock, IconUnlock, IconTrash,
  IconDuplicate, IconArrowUp, IconArrowDown,
  IconImage, IconText, IconShape, IconLayers,
} from '../Icons';

function typeIcon(type: SceneObject['type']) {
  if (type === 'image') return <IconImage size={11} />;
  if (type === 'text') return <IconText size={11} />;
  if (type === 'shape') return <IconShape size={11} />;
  return <IconLayers size={11} />;
}

export function LayerPanel() {
  const { state, dispatch, selectedScene } = useApp();
  const { selectedObjectIds, selectedSceneId } = state;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const objects = selectedScene
    ? [...selectedScene.objects].sort((a, b) => b.zIndex - a.zIndex)
    : [];

  const selectedId = selectedObjectIds[0] ?? null;

  const select = (id: string) => dispatch({ type: 'SELECT_OBJECT', objectId: id });

  const toggleVisibility = useCallback((obj: SceneObject) => {
    if (!selectedSceneId) return;
    dispatch({ type: 'UPDATE_OBJECT', sceneId: selectedSceneId, objectId: obj.id, updates: { visible: !obj.visible } });
  }, [selectedSceneId, dispatch]);

  const toggleLock = useCallback((obj: SceneObject) => {
    if (!selectedSceneId) return;
    dispatch({ type: 'UPDATE_OBJECT', sceneId: selectedSceneId, objectId: obj.id, updates: { locked: !obj.locked } });
  }, [selectedSceneId, dispatch]);

  const deleteObj = useCallback((obj: SceneObject) => {
    if (!selectedSceneId) return;
    dispatch({ type: 'DELETE_OBJECT', sceneId: selectedSceneId, objectId: obj.id });
    if (selectedId === obj.id) dispatch({ type: 'SELECT_OBJECT', objectId: null });
  }, [selectedSceneId, selectedId, dispatch]);

  const duplicate = useCallback((obj: SceneObject) => {
    if (!selectedSceneId) return;
    const newObj: SceneObject = {
      ...obj,
      id: crypto.randomUUID(),
      name: obj.name + ' Copy',
      x: obj.x + 12,
      y: obj.y + 12,
      zIndex: Date.now(),
    };
    dispatch({ type: 'ADD_OBJECT', sceneId: selectedSceneId, object: newObj });
    dispatch({ type: 'SELECT_OBJECT', objectId: newObj.id });
  }, [selectedSceneId, dispatch]);

  const moveUp = useCallback((obj: SceneObject) => {
    if (!selectedSceneId || !selectedScene) return;
    const sorted = [...selectedScene.objects].sort((a, b) => b.zIndex - a.zIndex);
    const idx = sorted.findIndex(o => o.id === obj.id);
    if (idx <= 0) return;
    const above = sorted[idx - 1];
    const newZ = above.zIndex + 1;
    dispatch({ type: 'UPDATE_OBJECT', sceneId: selectedSceneId, objectId: obj.id, updates: { zIndex: newZ } });
  }, [selectedSceneId, selectedScene, dispatch]);

  const moveDown = useCallback((obj: SceneObject) => {
    if (!selectedSceneId || !selectedScene) return;
    const sorted = [...selectedScene.objects].sort((a, b) => b.zIndex - a.zIndex);
    const idx = sorted.findIndex(o => o.id === obj.id);
    if (idx >= sorted.length - 1) return;
    const below = sorted[idx + 1];
    const newZ = Math.max(0, below.zIndex - 1);
    dispatch({ type: 'UPDATE_OBJECT', sceneId: selectedSceneId, objectId: obj.id, updates: { zIndex: newZ } });
  }, [selectedSceneId, selectedScene, dispatch]);

  const startRename = useCallback((obj: SceneObject) => {
    setEditingId(obj.id);
    setEditingName(obj.name);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const commitRename = useCallback(() => {
    if (!selectedSceneId || !editingId) return;
    dispatch({ type: 'UPDATE_OBJECT', sceneId: selectedSceneId, objectId: editingId, updates: { name: editingName.trim() || 'Object' } });
    setEditingId(null);
  }, [selectedSceneId, editingId, editingName, dispatch]);

  if (!selectedScene) {
    return <div className="empty-state"><div>Select a scene to view layers.</div></div>;
  }

  return (
    <div className="flex-col" style={{ height: '100%' }}>
      <div style={{ padding: '8px 10px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Layers — {selectedScene.name}
        </span>
      </div>
      <div className="sidebar-content">
        {objects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div>No objects.<br />Add images, text, or shapes.</div>
          </div>
        ) : (
          <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {objects.map((obj, idx) => (
              <div
                key={obj.id}
                className={`layer-item ${selectedId === obj.id ? 'selected' : ''}`}
                onClick={() => select(obj.id)}
                style={{ opacity: obj.visible ? 1 : 0.4 }}
              >
                <span className="layer-item-icon">{typeIcon(obj.type)}</span>

                {editingId === obj.id ? (
                  <input
                    ref={inputRef}
                    className="layer-item-name editing"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="layer-item-name"
                    onDoubleClick={e => { e.stopPropagation(); startRename(obj); }}
                  >
                    {obj.name}
                  </span>
                )}

                <div className="layer-item-actions">
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ width: 18, height: 18, padding: 0 }}
                    onClick={e => { e.stopPropagation(); moveUp(obj); }}
                    title="Move up"
                  >
                    <IconArrowUp size={10} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ width: 18, height: 18, padding: 0 }}
                    onClick={e => { e.stopPropagation(); moveDown(obj); }}
                    title="Move down"
                  >
                    <IconArrowDown size={10} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ width: 18, height: 18, padding: 0 }}
                    onClick={e => { e.stopPropagation(); toggleVisibility(obj); }}
                    title={obj.visible ? 'Hide' : 'Show'}
                  >
                    {obj.visible ? <IconEye size={10} /> : <IconEyeOff size={10} />}
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ width: 18, height: 18, padding: 0 }}
                    onClick={e => { e.stopPropagation(); toggleLock(obj); }}
                    title={obj.locked ? 'Unlock' : 'Lock'}
                  >
                    {obj.locked ? <IconLock size={10} /> : <IconUnlock size={10} />}
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ width: 18, height: 18, padding: 0 }}
                    onClick={e => { e.stopPropagation(); duplicate(obj); }}
                    title="Duplicate"
                  >
                    <IconDuplicate size={10} />
                  </button>
                  <button
                    className="btn btn-danger btn-icon"
                    style={{ width: 18, height: 18, padding: 0 }}
                    onClick={e => { e.stopPropagation(); deleteObj(obj); }}
                    title="Delete"
                  >
                    <IconTrash size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
