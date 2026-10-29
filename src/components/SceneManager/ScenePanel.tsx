// ============================================================
// Scene Manager Panel
// ============================================================
import React, { useState, useCallback } from 'react';
import { useApp } from '../../app/AppContext';
import { createDefaultScene } from '../../schemas/project';
import { IconPlus, IconTrash, IconDuplicate, IconArrowUp, IconArrowDown } from '../Icons';

export function ScenePanel() {
  const { state, dispatch, selectedScene } = useApp();
  const { project, selectedSceneId } = state;
  const scenes = project.scenes;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const addScene = useCallback(() => {
    const scene = createDefaultScene({ name: `Scene ${scenes.length + 1}` });
    dispatch({ type: 'ADD_SCENE', scene });
    dispatch({ type: 'SELECT_SCENE', sceneId: scene.id });
  }, [scenes.length, dispatch]);

  const deleteScene = useCallback((id: string) => {
    if (scenes.length <= 1) { alert('A project must have at least one scene.'); return; }
    if (!confirm('Delete this scene?')) return;
    dispatch({ type: 'DELETE_SCENE', sceneId: id });
    if (selectedSceneId === id) {
      const remaining = scenes.filter(s => s.id !== id);
      dispatch({ type: 'SELECT_SCENE', sceneId: remaining[0]?.id ?? null });
    }
  }, [scenes, selectedSceneId, dispatch]);

  const duplicate = useCallback((id: string) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene) return;
    const newScene = {
      ...scene,
      id: crypto.randomUUID(),
      name: scene.name + ' Copy',
      objects: scene.objects.map(o => ({ ...o, id: crypto.randomUUID() })),
    };
    dispatch({ type: 'ADD_SCENE', scene: newScene });
    dispatch({ type: 'SELECT_SCENE', sceneId: newScene.id });
  }, [scenes, dispatch]);

  const moveUp = useCallback((idx: number) => {
    if (idx <= 0) return;
    const arr = [...scenes];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    dispatch({ type: 'REORDER_SCENES', scenes: arr });
  }, [scenes, dispatch]);

  const moveDown = useCallback((idx: number) => {
    if (idx >= scenes.length - 1) return;
    const arr = [...scenes];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    dispatch({ type: 'REORDER_SCENES', scenes: arr });
  }, [scenes, dispatch]);

  const commitRename = useCallback(() => {
    if (!editingId) return;
    dispatch({ type: 'UPDATE_SCENE', sceneId: editingId, updates: { name: editingName.trim() || 'Scene' } });
    setEditingId(null);
  }, [editingId, editingName, dispatch]);

  return (
    <div className="flex-col" style={{ height: '100%' }}>
      <div style={{ padding: '8px 8px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Scenes
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-icon btn-sm" onClick={addScene} title="Add scene">
          <IconPlus size={12} />
        </button>
      </div>
      <div className="sidebar-content">
        {scenes.map((scene, idx) => (
          <div
            key={scene.id}
            className={`scene-item ${selectedSceneId === scene.id ? 'selected' : ''}`}
            onClick={() => dispatch({ type: 'SELECT_SCENE', sceneId: scene.id })}
          >
            {/* Thumbnail */}
            <div
              className="scene-thumb"
              style={{ background: scene.backgroundColor }}
            />

            <div className="scene-info">
              {editingId === scene.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--accent)',
                    borderRadius: 2,
                    padding: '1px 4px',
                    color: 'var(--text-primary)',
                    fontSize: 11,
                    fontFamily: 'var(--font-ui)',
                    width: '100%',
                    outline: 'none',
                  }}
                />
              ) : (
                <div
                  className="scene-name"
                  onDoubleClick={e => { e.stopPropagation(); setEditingId(scene.id); setEditingName(scene.name); }}
                >
                  {scene.name}
                </div>
              )}
              <div className="scene-meta">
                {scene.duration}s · {scene.objects.length} obj · {scene.transition}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button
                className="btn btn-ghost btn-icon"
                style={{ width: 18, height: 18, padding: 0 }}
                onClick={e => { e.stopPropagation(); moveUp(idx); }}
              >
                <IconArrowUp size={9} />
              </button>
              <button
                className="btn btn-ghost btn-icon"
                style={{ width: 18, height: 18, padding: 0 }}
                onClick={e => { e.stopPropagation(); moveDown(idx); }}
              >
                <IconArrowDown size={9} />
              </button>
              <button
                className="btn btn-ghost btn-icon"
                style={{ width: 18, height: 18, padding: 0 }}
                onClick={e => { e.stopPropagation(); duplicate(scene.id); }}
              >
                <IconDuplicate size={9} />
              </button>
              <button
                className="btn btn-danger btn-icon"
                style={{ width: 18, height: 18, padding: 0 }}
                onClick={e => { e.stopPropagation(); deleteScene(scene.id); }}
              >
                <IconTrash size={9} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
