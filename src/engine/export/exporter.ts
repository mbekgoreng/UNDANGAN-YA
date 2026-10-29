// ============================================================
// Static Website Exporter — Produces Standalone Digital Invitation Website
// Generates clean HTML5, CSS3 with Keyframe Animations, JS Runtime with Petals & Scroll Reveal
// Supports 1-Click ZIP Download & Direct Directory Export
// ============================================================
import JSZip from 'jszip';
import type { Project, SceneObject, TextObject, ShapeObject, ImageObject } from '../../schemas/project';
import { loadAssetBlob } from '../../storage/db';

function buildKeyframeRule(preset: string, delay: number, duration: number): string {
  const name = `anim-${preset}-${Math.round(delay * 100)}-${Math.round(duration * 100)}`;
  const animProps: Record<string, { from: string; to: string }> = {
    fadeIn: { from: 'opacity:0', to: 'opacity:1' },
    slideUp: { from: 'opacity:0;transform:translateY(50px)', to: 'opacity:1;transform:translateY(0)' },
    slideDown: { from: 'opacity:0;transform:translateY(-50px)', to: 'opacity:1;transform:translateY(0)' },
    slideLeft: { from: 'opacity:0;transform:translateX(50px)', to: 'opacity:1;transform:translateX(0)' },
    slideRight: { from: 'opacity:0;transform:translateX(-50px)', to: 'opacity:1;transform:translateX(0)' },
    zoomIn: { from: 'opacity:0;transform:scale(0.6)', to: 'opacity:1;transform:scale(1)' },
    softPop: { from: 'opacity:0;transform:scale(0.85)', to: 'opacity:1;transform:scale(1)' },
    rotateIn: { from: 'opacity:0;transform:rotate(-18deg) scale(0.8)', to: 'opacity:1;transform:rotate(0) scale(1)' },
    fadeOut: { from: 'opacity:1', to: 'opacity:0' },
    slideOut: { from: 'opacity:1;transform:translateY(0)', to: 'opacity:0;transform:translateY(-50px)' },
    zoomOut: { from: 'opacity:1;transform:scale(1)', to: 'opacity:0;transform:scale(0.6)' },
    gentleFloat: { from: 'transform:translateY(0)', to: 'transform:translateY(-8px)' },
    gentleSway: { from: 'transform:rotate(-4deg)', to: 'transform:rotate(4deg)' },
    slowPulse: { from: 'transform:scale(1)', to: 'transform:scale(1.05)' },
    subtleRotation: { from: 'transform:rotate(0deg)', to: 'transform:rotate(360deg)' },
    verticalDrift: { from: 'transform:translate(0,0)', to: 'transform:translate(4px,-10px)' },
  };

  const p = animProps[preset];
  if (!p) return '';
  return `@keyframes ${name} { from { ${p.from} } to { ${p.to} } }`;
}

function objectToCSS(obj: SceneObject, canvasW: number, canvasH: number): string {
  const anim = obj.animation;
  const hasAnim = anim.preset !== 'none';
  const easingCSS = anim.easing === 'easeOut' ? 'cubic-bezier(0,0,0.2,1)' :
    anim.easing === 'easeIn' ? 'cubic-bezier(0.4,0,1,1)' :
    anim.easing === 'easeInOut' ? 'cubic-bezier(0.4,0,0.2,1)' : 'linear';

  const isContinuous = ['gentleFloat','gentleSway','slowPulse','subtleRotation','verticalDrift'].includes(anim.preset);
  const animIterations = (hasAnim && (anim.loop || isContinuous)) ? 'infinite' : '1';

  const xPct = (obj.x / canvasW * 100).toFixed(3);
  const yPct = (obj.y / canvasH * 100).toFixed(3);
  const wPct = (obj.width / canvasW * 100).toFixed(3);
  const hPct = (obj.height / canvasH * 100).toFixed(3);

  const lines = [
    `position:absolute;`,
    `left:${xPct}%;top:${yPct}%;`,
    `width:${wPct}%;height:${hPct}%;`,
    `transform-origin:center center;`,
    obj.rotation !== 0 ? `transform:rotate(${obj.rotation}deg);` : '',
    `opacity:${obj.opacity};`,
  ];

  if (hasAnim) {
    const name = `anim-${anim.preset}-${Math.round(anim.delay * 100)}-${Math.round(anim.duration * 100)}`;
    const delay = anim.startTime + anim.delay;
    lines.push(`animation:${name} ${anim.duration}s ${easingCSS} ${delay}s ${animIterations} ${isContinuous ? 'alternate' : ''} both;`);
  }

  return lines.filter(Boolean).join('');
}

function renderObject(obj: SceneObject, assetFilenames: Map<string, string>, canvasW: number, canvasH: number): string {
  const css = objectToCSS(obj, canvasW, canvasH);

  if (obj.type === 'image') {
    const imgObj = obj as ImageObject;
    const filename = assetFilenames.get(imgObj.assetId) ?? '';
    const flipStyle = `${imgObj.flipX ? 'scaleX(-1)' : ''} ${imgObj.flipY ? 'scaleY(-1)' : ''}`.trim();
    return `<img class="inv-obj" style="${css}" src="assets/${filename}" alt="${obj.name}" loading="lazy" ${flipStyle ? `data-flip="${flipStyle}"` : ''} />`;
  }

  if (obj.type === 'text') {
    const t = obj as TextObject;
    const isButton = t.name.toLowerCase().includes('buka') || t.text.toLowerCase().includes('buka undangan');
    const textCSS = [
      `font-family:${t.fontFamily};`,
      `font-size:${t.fontSize}px;`,
      `font-weight:${t.fontWeight};`,
      `font-style:${t.fontStyle};`,
      `text-align:${t.textAlign};`,
      `line-height:${t.lineHeight};`,
      `letter-spacing:${t.letterSpacing}px;`,
      `color:${t.fill};`,
      `white-space:pre-wrap;word-break:break-word;overflow:hidden;`,
      `display:flex;align-items:center;`,
      t.textAlign === 'center' ? 'justify-content:center;' : t.textAlign === 'right' ? 'justify-content:flex-end;' : 'justify-content:flex-start;',
      isButton ? 'cursor:pointer;' : '',
    ].join('');
    const text = t.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<div class="inv-obj ${isButton ? 'btn-buka-undangan' : ''}" style="${css}${textCSS}">${text}</div>`;
  }

  if (obj.type === 'shape') {
    const s = obj as ShapeObject;
    const isButton = s.name.toLowerCase().includes('buka') || s.name.toLowerCase().includes('button');
    const shapeCSS = [
      `background:${s.fill};`,
      `border:${s.strokeWidth}px solid ${s.stroke};`,
      `border-radius:${s.shapeType === 'ellipse' ? '50%' : `${s.cornerRadius ?? 0}px`};`,
      `box-sizing:border-box;`,
      isButton ? 'cursor:pointer;' : '',
    ].join('');
    return `<div class="inv-obj ${isButton ? 'btn-buka-undangan' : ''}" style="${css}${shapeCSS}"></div>`;
  }

  return '';
}

export interface PreparedExportData {
  html: string;
  css: string;
  js: string;
  assetBlobs: Map<string, Blob>;
  assetFilenames: Map<string, string>;
  projectName: string;
}

export async function prepareExportData(project: Project): Promise<PreparedExportData> {
  const { canvas, scenes, meta } = project;

  // Collect all asset IDs used in scenes
  const usedAssetIds = new Set<string>();
  for (const scene of scenes) {
    for (const obj of scene.objects) {
      if (obj.type === 'image') usedAssetIds.add((obj as ImageObject).assetId);
    }
  }

  const assetFilenames = new Map<string, string>();
  const assetBlobs = new Map<string, Blob>();

  for (const id of usedAssetIds) {
    const blob = await loadAssetBlob(id);
    if (!blob) continue;
    const ext = blob.type.includes('svg') ? 'svg' :
      blob.type.includes('png') ? 'png' :
      blob.type.includes('webp') ? 'webp' : 'jpg';
    const filename = `${id.replace(/[^a-z0-9_-]/gi, '_').slice(0, 20)}.${ext}`;
    assetFilenames.set(id, filename);
    assetBlobs.set(id, blob);
  }

  // Keyframes
  const keyframeRules = new Set<string>();
  for (const scene of scenes) {
    for (const obj of scene.objects) {
      if (obj.animation.preset !== 'none') {
        keyframeRules.add(buildKeyframeRule(obj.animation.preset, obj.animation.delay, obj.animation.duration));
      }
    }
  }

  // CSS
  const css = `/* ============================================================
   UndangYa! Motion Studio Lite — Exported Invitation
   ============================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html {
  font-size: 16px;
  scroll-behavior: smooth;
  background: #0a0a0c;
}
body {
  background: #0a0a0c;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f0ece4;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  overflow-x: hidden;
}
.inv-wrapper {
  position: relative;
  width: ${canvas.width}px;
  max-width: 100vw;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 50px rgba(0,0,0,0.9);
}
.scene {
  position: relative;
  width: ${canvas.width}px;
  max-width: 100%;
  height: ${canvas.height}px;
  overflow: hidden;
  flex-shrink: 0;
}
@media (max-width: ${canvas.width}px) {
  .scene {
    width: 100vw;
    height: calc(100vw * ${canvas.height / canvas.width});
  }
}
.inv-obj {
  position: absolute;
  user-select: none;
}
/* Falling Petals Canvas */
#petals-canvas {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: ${canvas.width}px;
  max-width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 999;
}
/* Scene reveal */
.scene-hidden .inv-obj {
  animation-play-state: paused !important;
}
.scene-visible .inv-obj {
  animation-play-state: running !important;
}
${Array.from(keyframeRules).join('\n')}
`;

  // HTML Scenes
  const scenesHTML = scenes.map((scene, idx) => {
    const objectsHTML = [...scene.objects]
      .filter(o => o.visible)
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(obj => renderObject(obj, assetFilenames, canvas.width, canvas.height))
      .join('\n      ');

    return `
    <!-- Scene: ${scene.name} -->
    <section class="scene scene-hidden" id="scene-${idx}" style="background:${scene.backgroundColor};">
      ${objectsHTML}
    </section>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.name.replace(/</g, '&lt;')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <canvas id="petals-canvas"></canvas>
  <main class="inv-wrapper">
${scenesHTML}
  </main>
  <script src="invitation.js"></script>
</body>
</html>`;

  // Runtime JS
  const js = `// ============================================================
// UndangYa! Runtime — Scroll Reveal & Ambient Falling Petals
// ============================================================
(function() {
  // 1. Scroll-Triggered Scene Animations
  var scenes = document.querySelectorAll('.scene');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('scene-hidden');
          entry.target.classList.add('scene-visible');
        }
      });
    }, { threshold: 0.15 });

    scenes.forEach(function(s) { observer.observe(s); });
  } else {
    scenes.forEach(function(s) { s.classList.remove('scene-hidden'); });
  }

  // 2. Smooth Scroll for 'Buka Undangan' button
  document.querySelectorAll('.btn-buka-undangan').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var nextScene = document.getElementById('scene-1');
      if (nextScene) {
        nextScene.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 3. Ambient Falling Petals Canvas System
  var cvs = document.getElementById('petals-canvas');
  if (cvs && cvs.getContext) {
    var ctx = cvs.getContext('2d');
    var w = cvs.clientWidth || 390;
    var h = window.innerHeight;
    cvs.width = w;
    cvs.height = h;

    var petals = [];
    var colors = [
      'rgba(255, 248, 230, 0.75)',
      'rgba(240, 215, 140, 0.65)',
      'rgba(255, 230, 235, 0.70)',
      'rgba(201, 168, 76, 0.60)'
    ];

    for (var i = 0; i < 24; i++) {
      petals.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 5 + Math.random() * 7,
        speedY: 0.8 + Math.random() * 1.3,
        speedX: (Math.random() - 0.5) * 0.7,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        opacity: 0.4 + Math.random() * 0.45,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    function animatePetals() {
      ctx.clearRect(0, 0, w, h);
      for (var j = 0; j < petals.length; j++) {
        var p = petals[j];
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.015) * 0.4;
        p.rot += p.rotSpeed;

        if (p.y > h + 15) { p.y = -15; p.x = Math.random() * w; }
        if (p.x < -15) p.x = w + 10;
        if (p.x > w + 15) p.x = -10;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.quadraticCurveTo(p.size * 0.8, -p.size * 0.3, p.size * 0.4, p.size * 0.6);
        ctx.quadraticCurveTo(0, p.size, -p.size * 0.4, p.size * 0.6);
        ctx.quadraticCurveTo(-p.size * 0.8, -p.size * 0.3, 0, -p.size);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(animatePetals);
    }
    animatePetals();

    window.addEventListener('resize', function() {
      w = cvs.clientWidth || 390;
      h = window.innerHeight;
      cvs.width = w;
      cvs.height = h;
    });
  }
})();
`;

  return {
    html,
    css,
    js,
    assetBlobs,
    assetFilenames,
    projectName: meta.name,
  };
}

/**
 * 1-Click ZIP Download (Works reliably on all browsers)
 */
export async function exportInvitationZip(project: Project): Promise<void> {
  const data = await prepareExportData(project);
  const zip = new JSZip();

  // Root files
  zip.file('index.html', data.html);
  zip.file('styles.css', data.css);
  zip.file('invitation.js', data.js);

  // Assets directory
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    for (const [id, blob] of data.assetBlobs) {
      const filename = data.assetFilenames.get(id);
      if (filename) {
        assetsFolder.file(filename, blob);
      }
    }
  }

  // Generate zip blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const safeName = (data.projectName || 'undangan-digital').toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}-website.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export via File System Access API directly to a local directory (Chrome/Edge)
 */
export async function exportInvitationDirectory(project: Project): Promise<void> {
  const data = await prepareExportData(project);

  try {
    const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    const assetsDir = await dirHandle.getDirectoryHandle('assets', { create: true });

    // Write index.html
    const htmlHandle = await dirHandle.getFileHandle('index.html', { create: true });
    const htmlWriter = await htmlHandle.createWritable();
    await htmlWriter.write(data.html);
    await htmlWriter.close();

    // Write styles.css
    const cssHandle = await dirHandle.getFileHandle('styles.css', { create: true });
    const cssWriter = await cssHandle.createWritable();
    await cssWriter.write(data.css);
    await cssWriter.close();

    // Write invitation.js
    const jsHandle = await dirHandle.getFileHandle('invitation.js', { create: true });
    const jsWriter = await jsHandle.createWritable();
    await jsWriter.write(data.js);
    await jsWriter.close();

    // Write all assets
    for (const [id, blob] of data.assetBlobs) {
      const filename = data.assetFilenames.get(id);
      if (filename) {
        const assetHandle = await assetsDir.getFileHandle(filename, { create: true });
        const assetWriter = await assetHandle.createWritable();
        await assetWriter.write(blob);
        await assetWriter.close();
      }
    }

    alert(`✅ Website undangan berhasil diekspor ke folder terpilih!\n\nStruktur folder:\n├── index.html\n├── styles.css\n├── invitation.js\n└── assets/\n\nBuka folder dengan "npx serve ." untuk melihat hasil preview.`);
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    console.error('Directory export failed, falling back to ZIP:', err);
    await exportInvitationZip(project);
    alert('Browser tidak mengizinkan akses folder langsung. Paket undangan diunduh otomatis dalam format .ZIP!');
  }
}
