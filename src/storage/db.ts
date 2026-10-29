// ============================================================
// IndexedDB persistence layer using idb
// ============================================================
import { openDB, type IDBPDatabase } from 'idb';
import type { Project, AssetItem } from '../schemas/project';

const DB_NAME = 'undangya-studio';
const DB_VERSION = 1;

let _db: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        const ps = db.createObjectStore('projects', { keyPath: 'meta.id' });
        ps.createIndex('updatedAt', 'meta.updatedAt');
      }
      // Assets metadata store
      if (!db.objectStoreNames.contains('assets-meta')) {
        db.createObjectStore('assets-meta', { keyPath: 'id' });
      }
      // Assets blob store (binary data)
      if (!db.objectStoreNames.contains('assets-blob')) {
        db.createObjectStore('assets-blob', { keyPath: 'id' });
      }
    },
  });
  return _db;
}

// ---- Projects ----

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put('projects', project);
}

export async function loadProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function listProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAll('projects');
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
}

// ---- Assets ----

export async function saveAssetMeta(meta: AssetItem): Promise<void> {
  const db = await getDB();
  await db.put('assets-meta', meta);
}

export async function saveAssetBlob(id: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put('assets-blob', { id, blob });
}

export async function loadAssetMeta(id: string): Promise<AssetItem | undefined> {
  const db = await getDB();
  return db.get('assets-meta', id);
}

export async function loadAssetBlob(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  const record = await db.get('assets-blob', id);
  return record?.blob;
}

export async function listAssets(): Promise<AssetItem[]> {
  const db = await getDB();
  return db.getAll('assets-meta');
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('assets-meta', id);
  await db.delete('assets-blob', id);
}

export async function getAssetObjectURL(id: string): Promise<string | null> {
  const blob = await loadAssetBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
