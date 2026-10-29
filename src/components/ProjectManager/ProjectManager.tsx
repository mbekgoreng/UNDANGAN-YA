// ============================================================
// Project Manager Dialog
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../app/AppContext';
import { listProjects, deleteProject, saveProject, loadAssetBlob, saveAssetMeta, saveAssetBlob, listAssets } from '../../storage/db';
import { createDefaultProject } from '../../schemas/project';
import type { Project, AssetItem } from '../../schemas/project';

interface ProjectFileV2 {
  kind: 'undangya-project';
  version: 2;
  exportedAt: string;
  project: Project;
  assets: { meta: AssetItem; dataBase64: string }[];
}

function collectProjectAssetIds(project: Project): Set<string> {
  const ids = new Set<string>();
  for (const scene of project.scenes) {
    if (scene.backgroundAssetId) ids.add(scene.backgroundAssetId);
    for (const obj of scene.objects) {
      if (obj.type === 'image') ids.add((obj as { assetId: string }).assetId);
    }
  }
  if (project.event?.qrisAssetId) ids.add(project.event.qrisAssetId);
  if (project.music?.assetId) ids.add(project.music.assetId);
  return ids;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBlob(b64: string, mimeType: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}
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

  // Export project file — v2 format WITH all used assets embedded (images,
  // scene backgrounds, QRIS, music), so the file is fully portable.
  const exportProjectFile = useCallback(async (project: Project) => {
    const ids = collectProjectAssetIds(project);
    const assets: ProjectFileV2['assets'] = [];
    for (const id of ids) {
      const meta = state.assets.find(a => a.id === id);
      const blob = await loadAssetBlob(id);
      if (!meta || !blob) continue;
      assets.push({ meta, dataBase64: await blobToBase64(blob) });
    }
    const file: ProjectFileV2 = {
      kind: 'undangya-project',
      version: 2,
      exportedAt: new Date().toISOString(),
      project,
      assets,
    };
    const blob = new Blob([JSON.stringify(file)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.meta.name.replace(/[^a-z0-9]/gi, '-')}.undangya`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.assets]);

  // Import project file — accepts v2 bundles (restores assets too) and
  // legacy v1 plain-project JSON. Basic schema validation before saving.
  const importProjectFile = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.undangya,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        let project: Project;
        let bundledAssets: ProjectFileV2['assets'] = [];
        if (parsed && parsed.kind === 'undangya-project' && parsed.version === 2) {
          project = parsed.project as Project;
          bundledAssets = Array.isArray(parsed.assets) ? parsed.assets : [];
        } else {
          project = parsed as Project;
        }

        // Schema sanity checks (imported files are untrusted input)
        if (!project?.meta?.id || typeof project.meta.name !== 'string') throw new Error('File proyek tidak valid (meta).');
        if (!Array.isArray(project.scenes) || project.scenes.length === 0) throw new Error('File proyek tidak valid (scenes).');
        for (const s of project.scenes) {
          if (!s.id || !Array.isArray(s.objects)) throw new Error('File proyek tidak valid (isi scene).');
        }
        if (!project.canvas || typeof project.canvas.width !== 'number') throw new Error('File proyek tidak valid (canvas).');

        // Restore bundled assets first so scene references resolve
        for (const entry of bundledAssets) {
          if (!entry?.meta?.id || typeof entry.dataBase64 !== 'string') continue;
          await saveAssetMeta(entry.meta);
          await saveAssetBlob(entry.meta.id, base64ToBlob(entry.dataBase64, entry.meta.mimeType || 'application/octet-stream'));
        }
        if (bundledAssets.length > 0) {
          dispatch({ type: 'SET_ASSETS', assets: await listAssets() });
        }

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
  }, [loadList, dispatch]);

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
