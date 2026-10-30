// ============================================================
// UndangYa! HTML Visual Studio — API Client
// Communicates with local loopback backend
// ============================================================
import type { ProjectMetadata, ProjectFileInfo, ProjectHealth, CssPatch } from '../types/visualStudio';

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}

export async function listProjects(): Promise<Array<{ id: string; name: string; workingPath: string; updatedAt: string }>> {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error('Failed to list projects');
  return res.json();
}

export async function openProjectByPath(dirPath: string, name?: string): Promise<ProjectMetadata> {
  const res = await fetch('/api/projects/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dirPath, name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Failed to open project' }));
    throw new Error(data.error || 'Failed to open project');
  }
  return res.json();
}

export async function openSampleProject(): Promise<ProjectMetadata> {
  const res = await fetch('/api/projects/open-sample', { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Failed to open sample' }));
    throw new Error(data.error || 'Failed to open sample');
  }
  return res.json();
}

export async function getProjectDetails(id: string): Promise<{ meta: ProjectMetadata; files: ProjectFileInfo[]; health: ProjectHealth }> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error('Failed to load project details');
  return res.json();
}

export async function saveCssPatch(
  projectId: string,
  patch: {
    selector: string;
    properties: Record<string, string>;
    mediaQuery?: string;
    elementDescription?: string;
  }
): Promise<{ success: boolean; patch: CssPatch; patchesCount: number }> {
  const res = await fetch(`/api/projects/${projectId}/patch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Failed to save patch' }));
    throw new Error(data.error || 'Failed to save patch');
  }
  return res.json();
}

export async function deleteCssPatch(projectId: string, patchId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/projects/${projectId}/patch/${patchId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete patch');
  return res.json();
}

export async function uploadProjectAsset(projectId: string, file: File): Promise<{ success: boolean; relativePath: string; filename: string }> {
  const formData = new FormData();
  formData.append('asset', file);

  const res = await fetch(`/api/projects/${projectId}/asset`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Failed to upload asset' }));
    throw new Error(data.error || 'Failed to upload asset');
  }
  return res.json();
}

export async function insertElementIntoHtml(projectId: string, containerSelector: string, elementHtml: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/projects/${projectId}/insert-element`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ containerSelector, elementHtml }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Failed to insert element' }));
    throw new Error(data.error || 'Failed to insert element');
  }
  return res.json();
}

export async function createProjectSnapshot(projectId: string, label: string): Promise<{ success: boolean; snapshots: any[] }> {
  const res = await fetch(`/api/projects/${projectId}/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error('Failed to create snapshot');
  return res.json();
}

export async function restoreProjectSnapshot(projectId: string, snapshotId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/projects/${projectId}/restore-snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ snapshotId }),
  });
  if (!res.ok) throw new Error('Failed to restore snapshot');
  return res.json();
}

export async function exportProjectToDirectory(projectId: string, destinationDir: string): Promise<{ success: boolean; exportedPath: string }> {
  const res = await fetch(`/api/projects/${projectId}/export-dir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destinationDir }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Failed to export' }));
    throw new Error(data.error || 'Failed to export');
  }
  return res.json();
}

export function getExportZipUrl(projectId: string): string {
  return `/api/projects/${projectId}/export-zip`;
}

export function getProjectExportZipUrl(projectId: string): string {
  return `/api/projects/${projectId}/export-zip`;
}

export function getProjectServeUrl(projectId: string, relativePath?: string): string {
  if (!relativePath || relativePath === 'index.html') {
    return `/api/projects/${projectId}/serve/`;
  }
  return `/api/projects/${projectId}/serve/${relativePath}`;
}
