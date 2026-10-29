// ============================================================
// Project Manager Dialog
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../app/AppContext';
import { listProjects, deleteProject, saveProject, loadProject } from '../../storage/db';
import { createDefaultProject } from '../../schemas/project';
import type { Project } from '../../schemas/project';
import { IconClose, IconPlus, IconTrash, IconDuplicate, IconFolder, IconImport, IconExport } from '../Icons';

export function ProjectManager() {
  const { state, dispatch } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(async () => {
    setLoading(true);
    const list = await listProjects();
    list.sort((a, b) => b.meta.updatedAt.localeCompare(a.meta.updatedAt));
    setProjects(list);
    setLoading(false);
  }, []);

  useEffect(() => { loadList(); }, []);

  const close = () => dispatch({ type: 'TOGGLE_PROJECT_MANAGER', show: false });

  const openProject = useCallback(async (project: Project) => {
    dispatch({ type: 'SET_PROJECT', project });
    dispatch({ type: 'SELECT_SCENE', sceneId: project.scenes[0]?.id ?? null });
    dispatch({ type: 'SET_SAVE_STATUS', status: 'saved' });
    close();
  }, [dispatch]);

  const newProject = useCallback(async () => {
    const name = prompt('New project name:', 'My Invitation');
    if (!name) return;
    const project = createDefaultProject(name);
    await saveProject(project);
    dispatch({ type: 'SET_PROJECT', project });
    dispatch({ type: 'SELECT_SCENE', sceneId: project.scenes[0]?.id ?? null });
    dispatch({ type: 'SET_SAVE_STATUS', status: 'saved' });
    close();
  }, [dispatch]);

  const duplicateProject = useCallback(async (project: Project) => {
    const newProj: Project = {
      ...project,
      meta: {
        ...project.meta,
        id: crypto.randomUUID(),
        name: project.meta.name + ' Copy',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    await saveProject(newProj);
    await loadList();
  }, [loadList]);

  const removeProject = useCallback(async (project: Project) => {
    if (!confirm(`Delete project "${project.meta.name}"? This cannot be undone.`)) return;
    await deleteProject(project.meta.id);
    await loadList();
  }, [loadList]);

  // Export project file
  const exportProjectFile = useCallback(async (project: Project) => {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.meta.name.replace(/[^a-z0-9]/gi, '-')}.undangya`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Import project file
  const importProjectFile = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.undangya,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const project: Project = JSON.parse(text);
        if (!project.meta?.id || !project.scenes) throw new Error('Invalid project file');
        // Assign new ID to avoid collision
        project.meta.id = crypto.randomUUID();
        project.meta.name = project.meta.name + ' (imported)';
        await saveProject(project);
        await loadList();
      } catch (err) {
        alert('Failed to import project: ' + (err as Error).message);
      }
    };
    input.click();
  }, [loadList]);

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        className="modal"
        style={{ width: 520, maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="toolbar-logo-mark" style={{ width: 22, height: 22, fontSize: 10 }}>U</div>
            <div className="modal-title">Projects</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={importProjectFile}>
              <IconImport size={11} /> Import
            </button>
            <button className="btn btn-primary btn-sm" onClick={newProject}>
              <IconPlus size={11} /> New Project
            </button>
            <button className="btn btn-ghost btn-icon" onClick={close}><IconClose size={14} /></button>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>Loading…</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <div>No projects yet.<br />Create your first invitation!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Current project highlight */}
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                Current: <strong style={{ color: 'var(--text-primary)' }}>{state.project.meta.name}</strong>
              </div>
              {projects.map(p => {
                const isCurrent = p.meta.id === state.project.meta.id;
                return (
                  <div
                    key={p.meta.id}
                    className="project-card"
                    style={{ border: isCurrent ? '1px solid var(--accent-dim)' : undefined, cursor: 'pointer' }}
                    onClick={() => openProject(p)}
                  >
                    {/* Mini thumbnail */}
                    <div
                      className="project-card-thumb"
                      style={{ background: p.scenes[0]?.backgroundColor ?? '#1a1a2e' }}
                    />
                    <div className="project-card-info">
                      <div className="project-card-name">
                        {p.meta.name}
                        {isCurrent && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--accent)', background: 'var(--accent-muted)', padding: '1px 5px', borderRadius: 3 }}>current</span>}
                      </div>
                      <div className="project-card-meta">
                        {p.scenes.length} scenes · {p.canvas.width}×{p.canvas.height} · Updated {formatDate(p.meta.updatedAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ width: 24, height: 24, padding: 0 }}
                        onClick={() => exportProjectFile(p)}
                        title="Export project file"
                      >
                        <IconExport size={11} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ width: 24, height: 24, padding: 0 }}
                        onClick={() => duplicateProject(p)}
                        title="Duplicate"
                      >
                        <IconDuplicate size={11} />
                      </button>
                      <button
                        className="btn btn-danger btn-icon"
                        style={{ width: 24, height: 24, padding: 0 }}
                        onClick={() => removeProject(p)}
                        title="Delete"
                      >
                        <IconTrash size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
