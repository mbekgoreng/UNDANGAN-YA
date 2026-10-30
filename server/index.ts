// ============================================================
// UndangYa! HTML Visual Studio — Local Express Backend Server
// Restricts strictly to loopback (127.0.0.1) for complete local filesystem security
// ============================================================
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import {
  openOrCreateWorkingCopy,
  saveProjectMeta,
  listProjects,
  analyzeProjectHealth,
  scanDirectory,
  compilePatchesToCss,
  createSnapshot,
  exportProjectZip,
  exportProjectToDirectory,
  safeResolve,
  type CssPatch,
  type ProjectMetadata,
} from './projectService';
import { createSampleInvitation } from './sampleInvitation';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Multer for asset uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// Cache for loaded projects
const activeProjects = new Map<string, ProjectMetadata>();

function getProject(id: string): ProjectMetadata {
  let proj = activeProjects.get(id);
  if (!proj) {
    const list = listProjects();
    const found = list.find(p => p.id === id);
    if (!found) throw new Error(`Project not found: ${id}`);
    const metaPath = path.join(found.workingPath, '.undangya-project.json');
    proj = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    activeProjects.set(id, proj!);
  }
  return proj!;
}

// Ensure sample project exists on startup
const SAMPLE_DIR = path.resolve(process.cwd(), 'samples/javanese-wedding-flawed');
createSampleInvitation(SAMPLE_DIR);

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', studio: 'UndangYa! HTML Visual Studio', version: '1.0.0' });
});

// 2. List projects
app.get('/api/projects', (req, res) => {
  try {
    const list = listProjects();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Open project from local path
app.post('/api/projects/open', (req, res) => {
  try {
    const { dirPath, name } = req.body;
    if (!dirPath || typeof dirPath !== 'string') {
      return res.status(400).json({ error: 'dirPath is required' });
    }
    const meta = openOrCreateWorkingCopy(dirPath, name);
    activeProjects.set(meta.id, meta);
    res.json(meta);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Open built-in sample project
app.post('/api/projects/open-sample', (req, res) => {
  try {
    createSampleInvitation(SAMPLE_DIR);
    const meta = openOrCreateWorkingCopy(SAMPLE_DIR, 'Pernikahan Raden & Dian (Sample AI Flawed)');
    activeProjects.set(meta.id, meta);
    res.json(meta);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get project details & file tree
app.get('/api/projects/:id', (req, res) => {
  try {
    const meta = getProject(req.params.id);
    const files = scanDirectory(meta.workingPath);
    const health = analyzeProjectHealth(meta.workingPath, meta.entryHtml);
    res.json({ meta, files, health });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// 6. Serve project files for iframe preview (preserving relative asset links!)
app.get(/^\/api\/projects\/([^/]+)\/serve(?:\/(.*))?$/, (req, res) => {
  try {
    const projectId = req.params[0];
    const meta = getProject(projectId);
    let subPath = req.params[1];
    if (!subPath || subPath === '/' || subPath === '') {
      subPath = meta.entryHtml;
    }
    // Remove leading slash if needed
    if (subPath.startsWith('/')) subPath = subPath.slice(1);

    const fullPath = safeResolve(meta.workingPath, subPath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send(`File not found: ${subPath}`);
    }

    const ext = path.extname(fullPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.htm': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    };

    if (mimeMap[ext]) {
      res.setHeader('Content-Type', mimeMap[ext]);
    }

    // Permissive headers for local preview iframe
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  } catch (err: any) {
    res.status(500).send(`Server error: ${err.message}`);
  }
});

// 7. Save / update CSS patch
app.post('/api/projects/:id/patch', (req, res) => {
  try {
    const meta = getProject(req.params.id);
    const { selector, properties, mediaQuery, elementDescription } = req.body;

    if (!selector || !properties) {
      return res.status(400).json({ error: 'selector and properties are required' });
    }

    // Find existing patch for selector + mediaQuery or add new
    const existingIndex = meta.patches.findIndex(
      p => p.selector === selector && (p.mediaQuery || '') === (mediaQuery || '')
    );

    const patch: CssPatch = {
      id: existingIndex >= 0 ? meta.patches[existingIndex].id : 'patch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      selector,
      elementDescription,
      mediaQuery: mediaQuery ? mediaQuery.trim() : undefined,
      properties,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      meta.patches[existingIndex] = patch;
    } else {
      meta.patches.push(patch);
    }

    meta.updatedAt = new Date().toISOString();

    // Recompile overrides css
    const overridesCss = compilePatchesToCss(meta.patches);
    const overridesPath = path.join(meta.workingPath, 'undangya-overrides.css');
    fs.writeFileSync(overridesPath, overridesCss, 'utf-8');

    saveProjectMeta(meta);
    res.json({ success: true, patch, patchesCount: meta.patches.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Delete CSS patch
app.delete('/api/projects/:id/patch/:patchId', (req, res) => {
  try {
    const meta = getProject(req.params.id);
    meta.patches = meta.patches.filter(p => p.id !== req.params.patchId);
    meta.updatedAt = new Date().toISOString();

    const overridesCss = compilePatchesToCss(meta.patches);
    const overridesPath = path.join(meta.workingPath, 'undangya-overrides.css');
    fs.writeFileSync(overridesPath, overridesCss, 'utf-8');

    saveProjectMeta(meta);
    res.json({ success: true, patchesCount: meta.patches.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Upload / Import new Asset file into project
app.post('/api/projects/:id/asset', upload.single('asset'), (req, res) => {
  try {
    const meta = getProject(req.params.id);
    if (!req.file) {
      return res.status(400).json({ error: 'No asset file provided' });
    }

    // Determine target assets folder (prefer assets/ or images/ or create assets/)
    let targetSubDir = 'assets';
    if (fs.existsSync(path.join(meta.workingPath, 'images'))) {
      targetSubDir = 'images';
    }
    const targetFolder = path.join(meta.workingPath, targetSubDir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const safeFilename = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const destinationPath = path.join(targetFolder, safeFilename);

    fs.writeFileSync(destinationPath, req.file.buffer);

    const relativePath = path.join(targetSubDir, safeFilename).replace(/\\/g, '/');
    res.json({
      success: true,
      filename: safeFilename,
      relativePath,
      size: req.file.size,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Insert element into HTML (e.g. newly placed asset)
app.post('/api/projects/:id/insert-element', (req, res) => {
  try {
    const meta = getProject(req.params.id);
    const { containerSelector, elementHtml } = req.body;

    const htmlPath = safeResolve(meta.workingPath, meta.entryHtml);
    let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // Create a snapshot before modifying HTML
    createSnapshot(meta, `Before insert element: ${containerSelector || 'body'}`);

    if (containerSelector && containerSelector.startsWith('#')) {
      const id = containerSelector.slice(1);
      const regex = new RegExp(`(<[^>]+id=["']${id}["'][^>]*>)`, 'i');
      if (regex.test(htmlContent)) {
        htmlContent = htmlContent.replace(regex, `$1\n    ${elementHtml}\n`);
      } else {
        htmlContent = htmlContent.replace('</body>', `  ${elementHtml}\n</body>`);
      }
    } else {
      htmlContent = htmlContent.replace('</body>', `  ${elementHtml}\n</body>`);
    }

    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    meta.updatedAt = new Date().toISOString();
    saveProjectMeta(meta);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Create Snapshot
app.post('/api/projects/:id/snapshot', (req, res) => {
  try {
    const meta = getProject(req.params.id);
    const label = req.body.label || 'Manual Snapshot';
    createSnapshot(meta, label);
    res.json({ success: true, snapshots: meta.snapshots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Restore Snapshot
app.post('/api/projects/:id/restore-snapshot', (req, res) => {
  try {
    const meta = getProject(req.params.id);
    const { snapshotId } = req.body;
    const snap = meta.snapshots.find(s => s.id === snapshotId);
    if (!snap || !fs.existsSync(snap.path)) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    // Copy snapshot contents back to workingPath
    const entries = fs.readdirSync(snap.path, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.undangya-snapshots') continue;
      const srcP = path.join(snap.path, entry.name);
      const dstP = path.join(meta.workingPath, entry.name);
      if (entry.isDirectory()) {
        fs.cpSync(srcP, dstP, { recursive: true });
      } else {
        fs.copyFileSync(srcP, dstP);
      }
    }

    res.json({ success: true, message: `Restored to ${snap.label}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Export Project as ZIP
app.get('/api/projects/:id/export-zip', async (req, res) => {
  try {
    const meta = getProject(req.params.id);
    const zipBuffer = await exportProjectZip(meta);
    const safeName = meta.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}-corrected.zip"`);
    res.send(zipBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Export Project to Directory
app.post('/api/projects/:id/export-dir', (req, res) => {
  try {
    const meta = getProject(req.params.id);
    const { destinationDir } = req.body;
    if (!destinationDir) {
      return res.status(400).json({ error: 'destinationDir is required' });
    }

    exportProjectToDirectory(meta, destinationDir);
    res.json({ success: true, destinationDir });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start loopback server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[UndangYa! HTML Visual Studio] Backend running at http://127.0.0.1:${PORT}`);
});
