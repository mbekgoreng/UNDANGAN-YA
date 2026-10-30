// ============================================================
// UndangYa! HTML Visual Studio — Project Management Engine
// Safe, local-first backend service for inspecting & repairing HTML invitations
// ============================================================
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

export interface ProjectFileInfo {
  name: string;
  relativePath: string;
  size: number;
  type: 'html' | 'css' | 'js' | 'image' | 'font' | 'other';
  extension: string;
}

export interface ProjectHealth {
  entryHtml: string;
  htmlFiles: string[];
  cssFiles: string[];
  jsFiles: string[];
  imageFiles: string[];
  missingResources: string[];
  externalDependencies: string[];
  totalElementsCount: number;
  selectableElementsCount: number;
  hasOverridesCss: boolean;
  issues: Array<{ severity: 'warning' | 'info' | 'error'; message: string; file?: string }>;
}

export interface CssPatch {
  id: string;
  selector: string;
  elementDescription?: string;
  mediaQuery?: string; // e.g. '@media (max-width: 480px)'
  properties: Record<string, string>;
  timestamp: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  originalPath: string;
  workingPath: string;
  entryHtml: string;
  createdAt: string;
  updatedAt: string;
  snapshots: Array<{ id: string; timestamp: string; label: string; path: string }>;
  patches: CssPatch[];
}

const STORAGE_ROOT = path.resolve(process.cwd(), '.undangya-projects');
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

// Security: Prevent path traversal
export function safeResolve(baseDir: string, relativePath: string): string {
  const resolved = path.resolve(baseDir, relativePath);
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new Error('Access denied: Path traversal detected');
  }
  return resolved;
}

// Scan directory recursively
export function scanDirectory(dir: string, baseDir = dir): ProjectFileInfo[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: ProjectFileInfo[] = [];

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.undangya-snapshots') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath, baseDir));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      let type: ProjectFileInfo['type'] = 'other';
      if (['.html', '.htm'].includes(ext)) type = 'html';
      else if (['.css'].includes(ext)) type = 'css';
      else if (['.js', '.mjs'].includes(ext)) type = 'js';
      else if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext)) type = 'image';
      else if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) type = 'font';

      const stat = fs.statSync(fullPath);
      files.push({
        name: entry.name,
        relativePath: rel,
        size: stat.size,
        type,
        extension: ext,
      });
    }
  }

  return files;
}

// Copy directory recursively
export function copyDir(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.undangya-snapshots') {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Analyze HTML project health
export function analyzeProjectHealth(workingPath: string, entryHtml: string): ProjectHealth {
  const files = scanDirectory(workingPath);
  const htmlFiles = files.filter(f => f.type === 'html').map(f => f.relativePath);
  const cssFiles = files.filter(f => f.type === 'css').map(f => f.relativePath);
  const jsFiles = files.filter(f => f.type === 'js').map(f => f.relativePath);
  const imageFiles = files.filter(f => f.type === 'image').map(f => f.relativePath);

  const missingResources: string[] = [];
  const externalDependencies: string[] = [];
  const issues: ProjectHealth['issues'] = [];

  const mainHtmlPath = safeResolve(workingPath, entryHtml);
  let totalElements = 0;
  let selectableElements = 0;
  let hasOverridesCss = false;

  if (fs.existsSync(mainHtmlPath)) {
    const htmlContent = fs.readFileSync(mainHtmlPath, 'utf-8');
    hasOverridesCss = htmlContent.includes('undangya-overrides.css');

    // Extract links, images, scripts
    const linkMatches = Array.from(htmlContent.matchAll(/<link[^>]+href=["']([^"']+)["']/gi));
    for (const match of linkMatches) {
      const href = match[1];
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
        externalDependencies.push(href);
      } else {
        const local = href.split('?')[0].split('#')[0];
        if (!fs.existsSync(safeResolve(workingPath, local))) {
          missingResources.push(local);
          issues.push({ severity: 'warning', message: `Linked stylesheet not found: ${local}`, file: entryHtml });
        }
      }
    }

    const imgMatches = Array.from(htmlContent.matchAll(/<img[^>]+src=["']([^"']+)["']/gi));
    for (const match of imgMatches) {
      const src = match[1];
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
        externalDependencies.push(src);
      } else if (!src.startsWith('data:')) {
        const local = src.split('?')[0].split('#')[0];
        if (!fs.existsSync(safeResolve(workingPath, local))) {
          missingResources.push(local);
          issues.push({ severity: 'error', message: `Image asset missing: ${local}`, file: entryHtml });
        }
      }
    }

    const scriptMatches = Array.from(htmlContent.matchAll(/<script[^>]+src=["']([^"']+)["']/gi));
    for (const match of scriptMatches) {
      const src = match[1];
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
        externalDependencies.push(src);
      } else {
        const local = src.split('?')[0].split('#')[0];
        if (!fs.existsSync(safeResolve(workingPath, local))) {
          missingResources.push(local);
          issues.push({ severity: 'warning', message: `Local script file not found: ${local}`, file: entryHtml });
        }
      }
    }

    // Rough counts
    const tagMatches = htmlContent.match(/<([a-zA-Z0-9-]+)(\s|>)/g) || [];
    totalElements = tagMatches.length;
    selectableElements = (htmlContent.match(/<(img|div|section|p|h1|h2|h3|h4|span|svg|picture|button|a)(\s|>)/gi) || []).length;
  } else {
    issues.push({ severity: 'error', message: `Main entry HTML not found: ${entryHtml}` });
  }

  return {
    entryHtml,
    htmlFiles,
    cssFiles,
    jsFiles,
    imageFiles,
    missingResources,
    externalDependencies,
    totalElementsCount: totalElements,
    selectableElementsCount: selectableElements,
    hasOverridesCss,
    issues,
  };
}

// Generate CSS from patches
export function compilePatchesToCss(patches: CssPatch[]): string {
  const baseRules: Record<string, Record<string, string>> = {};
  const mediaRules: Record<string, Record<string, Record<string, string>>> = {};

  for (const patch of patches) {
    if (patch.mediaQuery && patch.mediaQuery.trim()) {
      const mq = patch.mediaQuery.trim();
      if (!mediaRules[mq]) mediaRules[mq] = {};
      if (!mediaRules[mq][patch.selector]) mediaRules[mq][patch.selector] = {};
      Object.assign(mediaRules[mq][patch.selector], patch.properties);
    } else {
      if (!baseRules[patch.selector]) baseRules[patch.selector] = {};
      Object.assign(baseRules[patch.selector], patch.properties);
    }
  }

  let css = `/* ============================================================
   UndangYa! HTML Visual Studio — Generated Overrides
   Safe non-destructive CSS patches. Do not edit manually.
   ============================================================ */\n\n`;

  // Base rules
  for (const [selector, props] of Object.entries(baseRules)) {
    css += `${selector} {\n`;
    for (const [prop, val] of Object.entries(props)) {
      if (val !== undefined && val !== null && val !== '') {
        css += `  ${prop}: ${val} !important;\n`;
      }
    }
    css += `}\n\n`;
  }

  // Media query rules
  for (const [mq, selectors] of Object.entries(mediaRules)) {
    css += `${mq} {\n`;
    for (const [selector, props] of Object.entries(selectors)) {
      css += `  ${selector} {\n`;
      for (const [prop, val] of Object.entries(props)) {
        if (val !== undefined && val !== null && val !== '') {
          css += `    ${prop}: ${val} !important;\n`;
        }
      }
      css += `  }\n`;
    }
    css += `}\n\n`;
  }

  return css;
}

// Ensure overrides stylesheet is linked into HTML
export function injectOverridesLink(htmlContent: string): string {
  if (htmlContent.includes('undangya-overrides.css')) {
    return htmlContent;
  }
  const linkTag = '\n  <link rel="stylesheet" href="undangya-overrides.css" id="undangya-overrides-link" />\n';
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', `${linkTag}</head>`);
  }
  return `${linkTag}${htmlContent}`;
}

// Create project working copy
export function openOrCreateWorkingCopy(originalPath: string, name?: string): ProjectMetadata {
  if (!fs.existsSync(originalPath)) {
    throw new Error(`Directory not found: ${originalPath}`);
  }

  const stat = fs.statSync(originalPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${originalPath}`);
  }

  const files = scanDirectory(originalPath);
  const htmlFiles = files.filter(f => f.type === 'html');
  if (htmlFiles.length === 0) {
    throw new Error('No HTML files detected in the project directory.');
  }

  const defaultEntry = htmlFiles.find(f => f.name.toLowerCase() === 'index.html')?.relativePath || htmlFiles[0].relativePath;
  const projectName = name || path.basename(originalPath) || 'My Invitation Project';
  const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const workingPath = path.join(STORAGE_ROOT, projectId);
  copyDir(originalPath, workingPath);

  // Read existing metadata or initialize new
  const metaPath = path.join(workingPath, '.undangya-project.json');
  let meta: ProjectMetadata;

  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      meta.workingPath = workingPath;
      meta.updatedAt = new Date().toISOString();
    } catch {
      meta = createNewMeta(projectId, projectName, originalPath, workingPath, defaultEntry);
    }
  } else {
    meta = createNewMeta(projectId, projectName, originalPath, workingPath, defaultEntry);
  }

  // Create initial snapshot
  createSnapshot(meta, 'Original State');

  // Inject overrides stylesheet into HTML
  const mainHtmlPath = safeResolve(workingPath, meta.entryHtml);
  if (fs.existsSync(mainHtmlPath)) {
    const rawHtml = fs.readFileSync(mainHtmlPath, 'utf-8');
    const updatedHtml = injectOverridesLink(rawHtml);
    fs.writeFileSync(mainHtmlPath, updatedHtml, 'utf-8');
  }

  // Write overrides css if not exists
  const overridesCssPath = path.join(workingPath, 'undangya-overrides.css');
  if (!fs.existsSync(overridesCssPath)) {
    fs.writeFileSync(overridesCssPath, compilePatchesToCss(meta.patches), 'utf-8');
  }

  saveProjectMeta(meta);
  return meta;
}

function createNewMeta(
  id: string,
  name: string,
  originalPath: string,
  workingPath: string,
  entryHtml: string
): ProjectMetadata {
  return {
    id,
    name,
    originalPath,
    workingPath,
    entryHtml,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    snapshots: [],
    patches: [],
  };
}

export function saveProjectMeta(meta: ProjectMetadata) {
  const metaPath = path.join(meta.workingPath, '.undangya-project.json');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
}

export function createSnapshot(meta: ProjectMetadata, label: string) {
  const snapId = 'snap_' + Date.now();
  const snapDir = path.join(meta.workingPath, '.undangya-snapshots', snapId);
  fs.mkdirSync(snapDir, { recursive: true });

  copyDir(meta.workingPath, snapDir);

  meta.snapshots.push({
    id: snapId,
    timestamp: new Date().toISOString(),
    label,
    path: snapDir,
  });

  saveProjectMeta(meta);
}

export function listProjects(): Array<{ id: string; name: string; workingPath: string; updatedAt: string }> {
  if (!fs.existsSync(STORAGE_ROOT)) return [];
  const entries = fs.readdirSync(STORAGE_ROOT, { withFileTypes: true });
  const result: Array<{ id: string; name: string; workingPath: string; updatedAt: string }> = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const workingPath = path.join(STORAGE_ROOT, entry.name);
    const metaPath = path.join(workingPath, '.undangya-project.json');

    if (fs.existsSync(metaPath)) {
      try {
        const meta: ProjectMetadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        result.push({
          id: meta.id,
          name: meta.name,
          workingPath,
          updatedAt: meta.updatedAt,
        });
      } catch {
        // ignore broken
      }
    }
  }

  return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// Export corrected project as ZIP
export async function exportProjectZip(meta: ProjectMetadata): Promise<Buffer> {
  const zip = new JSZip();
  const files = scanDirectory(meta.workingPath);

  for (const file of files) {
    const fullPath = safeResolve(meta.workingPath, file.relativePath);
    const content = fs.readFileSync(fullPath);
    zip.file(file.relativePath, content);
  }

  // Add validation report
  const health = analyzeProjectHealth(meta.workingPath, meta.entryHtml);
  const report = {
    studio: 'UndangYa! HTML Visual Studio v1.0.0',
    exportDate: new Date().toISOString(),
    projectName: meta.name,
    entryHtml: meta.entryHtml,
    appliedPatchesCount: meta.patches.length,
    health,
  };
  zip.file('project-report.json', JSON.stringify(report, null, 2));

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// Export corrected project to local directory
export function exportProjectToDirectory(meta: ProjectMetadata, destinationDir: string) {
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  copyDir(meta.workingPath, destinationDir);

  // Add validation report
  const health = analyzeProjectHealth(meta.workingPath, meta.entryHtml);
  const report = {
    studio: 'UndangYa! HTML Visual Studio v1.0.0',
    exportDate: new Date().toISOString(),
    projectName: meta.name,
    entryHtml: meta.entryHtml,
    appliedPatchesCount: meta.patches.length,
    health,
  };
  fs.writeFileSync(path.join(destinationDir, 'project-report.json'), JSON.stringify(report, null, 2), 'utf-8');
}
