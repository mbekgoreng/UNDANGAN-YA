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
  const animProps: Record<string, { from: string; mid?: string; to: string }> = {
    fadeIn: { from: 'opacity:0', to: 'opacity:1' },
    slideUp: { from: 'opacity:0;transform:translateY(50px)', to: 'opacity:1;transform:translateY(0)' },
    slideDown: { from: 'opacity:0;transform:translateY(-50px)', to: 'opacity:1;transform:translateY(0)' },
    slideLeft: { from: 'opacity:0;transform:translateX(50px)', to: 'opacity:1;transform:translateX(0)' },
    slideRight: { from: 'opacity:0;transform:translateX(-50px)', to: 'opacity:1;transform:translateX(0)' },
    zoomIn: { from: 'opacity:0;transform:scale(0.6)', to: 'opacity:1;transform:scale(1)' },
    softPop: { from: 'opacity:0;transform:scale(0.85)', to: 'opacity:1;transform:scale(1)' },
    rotateIn: { from: 'opacity:0;transform:rotate(-18deg) scale(0.8)', to: 'opacity:1;transform:rotate(0) scale(1)' },
    kenBurns: { from: 'transform:scale(1)', to: 'transform:scale(1.15)' },
    fadeOut: { from: 'opacity:1', to: 'opacity:0' },
    slideOut: { from: 'opacity:1;transform:translateY(0)', to: 'opacity:0;transform:translateY(-50px)' },
    zoomOut: { from: 'opacity:1;transform:scale(1)', to: 'opacity:0;transform:scale(0.6)' },
    slideOutLeft: { from: 'opacity:1;transform:translateX(0)', to: 'opacity:0;transform:translateX(-280px)' },
    slideOutRight: { from: 'opacity:1;transform:translateX(0)', to: 'opacity:0;transform:translateX(280px)' },
    gentleFloat: { from: 'transform:translateY(0)', to: 'transform:translateY(-8px)' },
    gentleSway: { from: 'transform:rotate(-4deg)', to: 'transform:rotate(4deg)' },
    slowPulse: { from: 'transform:scale(1)', to: 'transform:scale(1.05)' },
    subtleRotation: { from: 'transform:rotate(0deg)', to: 'transform:rotate(360deg)' },
    verticalDrift: { from: 'transform:translate(0,0)', to: 'transform:translate(4px,-10px)' },
    flyAcross: {
      from: 'transform:translate(-140px,0)',
      mid: 'transform:translate(200px,-14px)',
      to: 'transform:translate(540px,0)',
    },
  };

  const p = animProps[preset];
  if (!p) return '';
  const mid = p.mid ? ` 50% { ${p.mid} }` : '';
  return `@keyframes ${name} { from { ${p.from} }${mid} to { ${p.to} } }`;
}

function sanitizeCubicBezier(value?: string): string | null {
  if (!value) return null;
  const parts = value.split(',').map(s => parseFloat(s.trim()));
  if (parts.length !== 4 || parts.some(n => !Number.isFinite(n))) return null;
  return `cubic-bezier(${parts.join(',')})`;
}

function objectToCSS(obj: SceneObject, canvasW: number, canvasH: number, extraTransform?: string, includeAnimations = true): string {
  const anim = obj.animation;
  const hasAnim = includeAnimations && anim.preset !== 'none';
  const easingCSS = (anim.easing === 'cubicBezier' && sanitizeCubicBezier(anim.cubicBezier)) || (
    anim.easing === 'easeOut' ? 'cubic-bezier(0,0,0.2,1)' :
    anim.easing === 'easeIn' ? 'cubic-bezier(0.4,0,1,1)' :
    anim.easing === 'easeInOut' ? 'cubic-bezier(0.4,0,0.2,1)' : 'linear');

  const isContinuous = ['gentleFloat','gentleSway','slowPulse','subtleRotation','verticalDrift'].includes(anim.preset);
  const animIterations = (hasAnim && (anim.loop || isContinuous)) ? 'infinite' : '1';

  const xPct = (obj.x / canvasW * 100).toFixed(3);
  const yPct = (obj.y / canvasH * 100).toFixed(3);
  const wPct = (obj.width / canvasW * 100).toFixed(3);
  const hPct = (obj.height / canvasH * 100).toFixed(3);

  const transformParts: string[] = [];
  if (obj.rotation !== 0) transformParts.push(`rotate(${obj.rotation}deg)`);
  if (extraTransform) transformParts.push(extraTransform);

  const lines = [
    `position:absolute;`,
    `left:${xPct}%;top:${yPct}%;`,
    `width:${wPct}%;height:${hPct}%;`,
    `transform-origin:center center;`,
    transformParts.length ? `transform:${transformParts.join(' ')};` : '',
    `opacity:${obj.opacity};`,
  ];

  if (hasAnim) {
    const name = `anim-${anim.preset}-${Math.round(anim.delay * 100)}-${Math.round(anim.duration * 100)}`;
    const delay = anim.startTime + anim.delay;
    lines.push(`animation:${name} ${anim.duration}s ${easingCSS} ${delay}s ${animIterations} ${isContinuous ? 'alternate' : ''} both;`);
  }

  return lines.filter(Boolean).join('');
}

function renderObject(obj: SceneObject, assetFilenames: Map<string, string>, canvasW: number, canvasH: number, includeAnimations = true): string {
  if (obj.type === 'image') {
    const imgObj = obj as ImageObject;
    const filename = assetFilenames.get(imgObj.assetId) ?? '';
    // F-04: apply flip as a real CSS transform (composed with rotation in
    // objectToCSS). The old `data-flip` attribute was never read by the
    // exported runtime, so flipped images silently exported unflipped.
    const flipParts: string[] = [];
    if (imgObj.flipX) flipParts.push('scaleX(-1)');
    if (imgObj.flipY) flipParts.push('scaleY(-1)');
    const css = objectToCSS(obj, canvasW, canvasH, flipParts.length ? flipParts.join(' ') : undefined, includeAnimations);
    return `<img class="inv-obj" style="${css}" src="assets/${filename}" alt="${obj.name}" loading="lazy" />`;
  }

  const css = objectToCSS(obj, canvasW, canvasH, undefined, includeAnimations);

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
    const hasGuestToken = /\{nama\}|\{tamu\}/.test(t.text);
    return `<div class="inv-obj ${isButton ? 'btn-buka-undangan' : ''}"${hasGuestToken ? ' data-guest="1"' : ''} style="${css}${textCSS}">${text}</div>`;
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
  musicFilename?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatEventDateId(dateISO: string): string {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

// Functional sections appended after the designed scenes: countdown, event
// details (maps + calendar), RSVP via WhatsApp, and digital envelope (amplop).
function buildEventSections(project: Project, assetFilenames: Map<string, string>): string {
  const ev = project.event ?? { dateISO: '', venueName: '', venueAddress: '', mapsUrl: '', rsvpWhatsapp: '', giftAccounts: [] };
  const hasCountdown = !!ev.dateISO;
  const hasDetail = !!(ev.dateISO || ev.venueName || ev.venueAddress || ev.mapsUrl);
  const hasRsvp = !!ev.rsvpWhatsapp;
  const qrisFile = ev.qrisAssetId ? assetFilenames.get(ev.qrisAssetId) : undefined;
  const hasAmplop = (ev.giftAccounts?.length ?? 0) > 0 || !!qrisFile;
  if (!hasCountdown && !hasDetail && !hasRsvp && !hasAmplop) return '';

  const parts: string[] = [];

  if (hasCountdown || hasDetail) {
    parts.push(`<section class="func-section" id="acara">
      <h2 class="func-title">Waktu &amp; Tempat</h2>
      ${ev.dateISO ? `<div class="func-date">${escapeHtml(formatEventDateId(ev.dateISO))} WIB</div>` : ''}
      ${ev.venueName ? `<div class="func-venue">${escapeHtml(ev.venueName)}</div>` : ''}
      ${ev.venueAddress ? `<div class="func-address">${escapeHtml(ev.venueAddress)}</div>` : ''}
      ${hasCountdown ? `<div class="countdown" data-countdown="${escapeHtml(ev.dateISO)}">
        <div class="cd-box"><span class="cd-num" data-cd="d">0</span><span class="cd-label">Hari</span></div>
        <div class="cd-box"><span class="cd-num" data-cd="h">0</span><span class="cd-label">Jam</span></div>
        <div class="cd-box"><span class="cd-num" data-cd="m">0</span><span class="cd-label">Menit</span></div>
        <div class="cd-box"><span class="cd-num" data-cd="s">0</span><span class="cd-label">Detik</span></div>
      </div>` : ''}
      <div class="func-actions">
        ${ev.mapsUrl ? `<a class="func-btn" href="${escapeHtml(ev.mapsUrl)}" target="_blank" rel="noopener">📍 Buka Google Maps</a>` : ''}
        ${ev.dateISO ? `<button class="func-btn" id="btn-calendar" type="button">🗓 Simpan ke Kalender</button>` : ''}
      </div>
    </section>`);
  }

  if (hasRsvp) {
    parts.push(`<section class="func-section" id="rsvp">
      <h2 class="func-title">Konfirmasi Kehadiran</h2>
      <div class="rsvp-form">
        <input class="func-input" id="rsvp-name" type="text" placeholder="Nama Anda" />
        <select class="func-input" id="rsvp-attend">
          <option value="Hadir">Saya akan hadir</option>
          <option value="Belum pasti">Belum pasti</option>
          <option value="Berhalangan">Berhalangan hadir</option>
        </select>
        <textarea class="func-input" id="rsvp-msg" rows="3" placeholder="Ucapan &amp; doa (opsional)"></textarea>
        <button class="func-btn func-btn-primary" id="btn-rsvp" type="button" data-wa="${escapeHtml(ev.rsvpWhatsapp.replace(/[^0-9]/g, ''))}">Kirim via WhatsApp</button>
      </div>
    </section>`);
  }

  if (hasAmplop) {
    const accounts = (ev.giftAccounts ?? []).map(a => `
        <div class="amplop-card">
          <div class="amplop-bank">${escapeHtml(a.label)}</div>
          <div class="amplop-number">${escapeHtml(a.number)}</div>
          <div class="amplop-holder">a.n. ${escapeHtml(a.holder)}</div>
          <button class="func-btn" type="button" data-copy="${escapeHtml(a.number)}">Salin Nomor</button>
        </div>`).join('');
    parts.push(`<section class="func-section" id="amplop">
      <h2 class="func-title">Amplop Digital</h2>
      <div class="func-address">Kehadiran Anda adalah hadiah terindah. Namun bila ingin memberi tanda kasih, kami sediakan:</div>
      ${accounts}
      ${qrisFile ? `<div class="amplop-card"><div class="amplop-bank">QRIS</div><img class="qris-img" src="assets/${qrisFile}" alt="QRIS" loading="lazy" /></div>` : ''}
    </section>`);
  }

  return parts.join('\n');
}

function minifyCss(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').trim();
}

function minifyHtml(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\n\s*\n/g, '\n').trim();
}

function minifyJs(js: string): string {
  return js.split('\n').filter(line => {
    const t = line.trim();
    return t !== '' && !t.startsWith('//');
  }).join('\n');
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

const SCENE_TRANSITION_CSS = `
/* Scene transitions — CapCut-style reveal library */
.scene {
  transition: opacity 0.8s ease, transform 0.8s ease, filter 0.8s ease, clip-path 0.8s ease;
}
.scene[class*="trans-"].scene-hidden { opacity: 0; }
.scene.trans-fade.scene-hidden { transform: translateY(24px); }
.scene.trans-fadeSlow { transition-duration: 1.6s; }
.scene.trans-fadeSlow.scene-hidden { opacity: 0; }
.scene.trans-blackFade.scene-hidden { filter: brightness(0); }
.scene.trans-whiteFade.scene-hidden { filter: brightness(2.6); }
.scene.trans-blurIn.scene-hidden { filter: blur(16px); }
.scene.trans-rise.scene-hidden { transform: translateY(56px); }
.scene.trans-drop.scene-hidden { transform: translateY(-56px); }
.scene.trans-slideLeft.scene-hidden { transform: translateX(72px); }
.scene.trans-slideRight.scene-hidden { transform: translateX(-72px); }
.scene.trans-slideFull.scene-hidden { transform: translateX(100%); }
.scene.trans-wipeLeft.scene-hidden { clip-path: inset(0 0 0 100%); opacity: 1; }
.scene.trans-wipeUp.scene-hidden { clip-path: inset(100% 0 0 0); opacity: 1; }
.scene.trans-cameraIn.scene-hidden { transform: scale(1.22); }
.scene.trans-cameraOut.scene-hidden { transform: scale(0.82); }
.scene.trans-zoomSpin.scene-hidden { transform: scale(0.85) rotate(-6deg); }
.scene.trans-spin.scene-hidden { transform: scale(0.92) rotate(10deg); }
.scene.trans-flipX.scene-hidden { transform: perspective(900px) rotateX(55deg); }
.scene.trans-flipY.scene-hidden { transform: perspective(900px) rotateY(55deg); }
.scene.trans-swing { transform-origin: top center; }
.scene.trans-swing.scene-hidden { transform: perspective(900px) rotateX(-38deg); }
.scene.trans-popIn {
  transition: opacity 0.7s cubic-bezier(0.2,1.6,0.4,1), transform 0.7s cubic-bezier(0.2,1.6,0.4,1), filter 0.7s ease, clip-path 0.7s ease;
}
.scene.trans-popIn.scene-hidden { transform: scale(0.55); }
.scene.trans-fallIn { transition-timing-function: cubic-bezier(0.2,0.9,0.3,1.15); }
.scene.trans-fallIn.scene-hidden { transform: translateY(-140px); }
.scene.trans-shake.scene-visible { animation: sceneShake 0.55s ease both; }
.scene.trans-glitch.scene-visible { animation: sceneGlitch 0.5s steps(2) both; }
.scene.trans-flash.scene-visible { animation: sceneFlash 0.7s ease both; }
@keyframes sceneShake {
  0% { transform: translateX(0); } 20% { transform: translateX(-9px); }
  40% { transform: translateX(8px); } 60% { transform: translateX(-5px); }
  80% { transform: translateX(3px); } 100% { transform: translateX(0); }
}
@keyframes sceneGlitch {
  0% { transform: translate(0); filter: none; }
  25% { transform: translate(-6px,2px); filter: hue-rotate(40deg); }
  50% { transform: translate(5px,-2px); }
  75% { transform: translate(-3px,1px); filter: hue-rotate(-30deg); }
  100% { transform: translate(0); filter: none; }
}
@keyframes sceneFlash {
  0% { filter: brightness(2.6); opacity: 0.3; }
  100% { filter: brightness(1); opacity: 1; }
}
`;

export async function prepareExportData(project: Project): Promise<PreparedExportData> {
  const { canvas, scenes, meta } = project;
  const includeAnimations = project.exportConfig?.includeAnimations !== false;
  const doMinify = project.exportConfig?.minify === true;
  const eventInfo = project.event ?? { dateISO: '', venueName: '', venueAddress: '', mapsUrl: '', rsvpWhatsapp: '', giftAccounts: [] };
  const musicInfo = project.music ?? {};

  // Collect all asset IDs used in scenes (objects + scene backgrounds + QRIS)
  const usedAssetIds = new Set<string>();
  for (const scene of scenes) {
    if (scene.backgroundAssetId) usedAssetIds.add(scene.backgroundAssetId);
    for (const obj of scene.objects) {
      if (obj.type === 'image') usedAssetIds.add((obj as ImageObject).assetId);
    }
  }
  if (eventInfo.qrisAssetId) usedAssetIds.add(eventInfo.qrisAssetId);

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

  // Background music (stored as its own asset so ZIP/folder/single-file agree)
  let musicFilename: string | undefined;
  if (musicInfo.assetId) {
    const blob = await loadAssetBlob(musicInfo.assetId);
    if (blob) {
      const ext = blob.type.includes('mpeg') || blob.type.includes('mp3') ? 'mp3' :
        blob.type.includes('ogg') ? 'ogg' :
        blob.type.includes('wav') ? 'wav' : 'm4a';
      musicFilename = `music.${ext}`;
      assetBlobs.set(musicInfo.assetId, blob);
      assetFilenames.set(musicInfo.assetId, musicFilename);
    }
  }

  // Keyframes
  const keyframeRules = new Set<string>();
  if (includeAnimations) {
    for (const scene of scenes) {
      for (const obj of scene.objects) {
        if (obj.animation.preset !== 'none') {
          keyframeRules.add(buildKeyframeRule(obj.animation.preset, obj.animation.delay, obj.animation.duration));
        }
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
${includeAnimations ? SCENE_TRANSITION_CSS : ""}
/* Functional sections (countdown, RSVP, amplop) */
.func-section {
  position: relative;
  width: 100%;
  padding: 56px 28px;
  text-align: center;
  background: #101014;
  border-top: 1px solid rgba(201,168,76,0.25);
}
.func-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 600;
  color: #e8cf8f;
  margin-bottom: 14px;
}
.func-date { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.func-venue { font-size: 15px; color: #e8cf8f; margin-bottom: 4px; }
.func-address { font-size: 13px; color: rgba(240,236,228,0.75); line-height: 1.6; margin-bottom: 12px; }
.countdown { display: flex; justify-content: center; gap: 8px; margin: 18px 0 6px; }
.cd-box {
  background: rgba(201,168,76,0.12);
  border: 1px solid rgba(201,168,76,0.4);
  border-radius: 8px;
  min-width: 62px;
  padding: 8px 4px;
  display: flex; flex-direction: column;
}
.cd-num { font-size: 22px; font-weight: 700; color: #e8cf8f; }
.cd-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(240,236,228,0.7); }
.func-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 16px; }
.func-btn {
  display: inline-block;
  background: transparent;
  border: 1px solid #c9a84c;
  color: #e8cf8f;
  border-radius: 999px;
  padding: 9px 18px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
}
.func-btn-primary { background: #c9a84c; color: #141414; font-weight: 700; }
.rsvp-form { display: flex; flex-direction: column; gap: 10px; max-width: 320px; margin: 0 auto; }
.func-input {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(201,168,76,0.35);
  border-radius: 8px;
  color: #f0ece4;
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  width: 100%;
}
.func-input option { color: #141414; }
.amplop-card {
  background: rgba(201,168,76,0.08);
  border: 1px solid rgba(201,168,76,0.35);
  border-radius: 12px;
  padding: 16px;
  margin: 12px auto;
  max-width: 320px;
  display: flex; flex-direction: column; gap: 6px; align-items: center;
}
.amplop-bank { font-weight: 700; color: #e8cf8f; letter-spacing: 1px; }
.amplop-number { font-size: 18px; font-weight: 600; letter-spacing: 1px; }
.amplop-holder { font-size: 12px; color: rgba(240,236,228,0.7); }
.qris-img { max-width: 220px; width: 100%; border-radius: 8px; background: #fff; }
/* Music toggle */
#music-toggle {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1000;
  width: 46px; height: 46px;
  border-radius: 50%;
  border: 1px solid #c9a84c;
  background: rgba(16,16,20,0.85);
  color: #e8cf8f;
  font-size: 18px;
  cursor: pointer;
}
${Array.from(keyframeRules).join('\n')}
`;

  // HTML Scenes
  const scenesHTML = scenes.map((scene, idx) => {
    const objectsHTML = [...scene.objects]
      .filter(o => o.visible)
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(obj => renderObject(obj, assetFilenames, canvas.width, canvas.height, includeAnimations))
      .join('\n      ');

    const bgFile = scene.backgroundAssetId ? assetFilenames.get(scene.backgroundAssetId) : undefined;
    const bgStyle = bgFile
      ? `background:${scene.backgroundColor} url('assets/${bgFile}') center/cover no-repeat;`
      : `background:${scene.backgroundColor};`;
    const effectiveTransition = includeAnimations ? scene.transition : 'none';
    const initiallyHidden = effectiveTransition !== 'none';

    return `
    <!-- Scene: ${escapeHtml(scene.name)} -->
    <section class="scene trans-${effectiveTransition} ${initiallyHidden ? 'scene-hidden' : 'scene-visible'}" id="scene-${idx}" style="${bgStyle}">
      ${objectsHTML}
    </section>`;
  }).join('\n');

  const eventSections = buildEventSections(project, assetFilenames);
  const musicHTML = musicFilename
    ? `\n  <audio id="bg-music" loop preload="auto" src="assets/${musicFilename}"></audio>\n  <button id="music-toggle" type="button" title="Musik nyala/matikan" style="display:none;">♪</button>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.name.replace(/</g, '&lt;')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Great+Vibes&family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  ${includeAnimations ? '<canvas id="petals-canvas"></canvas>' : ''}
  <main class="inv-wrapper">
${scenesHTML}
${eventSections}
  </main>${musicHTML}
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

  // 4. Guest name personalization: ?to=Nama+Tamu replaces {nama}/{tamu} tokens
  var guestName = '';
  try {
    guestName = new URLSearchParams(window.location.search).get('to') || '';
  } catch (e) { guestName = ''; }
  var guestDisplay = guestName.trim() !== '' ? guestName : 'Tamu Undangan';
  document.querySelectorAll('[data-guest]').forEach(function(el) {
    el.textContent = el.textContent.split('{nama}').join(guestDisplay).split('{tamu}').join(guestDisplay);
  });
  var rsvpNameInput = document.getElementById('rsvp-name');
  if (rsvpNameInput && guestName.trim() !== '') rsvpNameInput.value = guestName;

  // 5. Countdown
  var cdEl = document.querySelector('[data-countdown]');
  if (cdEl) {
    var target = new Date(cdEl.getAttribute('data-countdown')).getTime();
    var pad = function(n) { return (n < 10 ? '0' : '') + n; };
    var tickCd = function() {
      var diff = Math.max(0, target - Date.now());
      var d = Math.floor(diff / 86400000);
      var h = Math.floor(diff % 86400000 / 3600000);
      var m = Math.floor(diff % 3600000 / 60000);
      var s = Math.floor(diff % 60000 / 1000);
      var map = { d: d, h: pad(h), m: pad(m), s: pad(s) };
      cdEl.querySelectorAll('[data-cd]').forEach(function(span) {
        span.textContent = map[span.getAttribute('data-cd')];
      });
    };
    tickCd();
    setInterval(tickCd, 1000);
  }

  // 6. Add to calendar (.ics download)
  var calBtn = document.getElementById('btn-calendar');
  if (calBtn && cdEl) {
    calBtn.addEventListener('click', function() {
      var start = new Date(cdEl.getAttribute('data-countdown'));
      var end = new Date(start.getTime() + 2 * 3600000);
      var fmt = function(dt) { return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; };
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
        'DTSTART:' + fmt(start), 'DTEND:' + fmt(end),
        'SUMMARY:' + document.title,
        'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var blob = new Blob([ics], { type: 'text/calendar' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'acara.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  // 7. RSVP via WhatsApp
  var rsvpBtn = document.getElementById('btn-rsvp');
  if (rsvpBtn) {
    rsvpBtn.addEventListener('click', function() {
      var wa = rsvpBtn.getAttribute('data-wa');
      var name = (document.getElementById('rsvp-name').value || 'Tamu').trim();
      var attend = document.getElementById('rsvp-attend').value;
      var msg = document.getElementById('rsvp-msg').value.trim();
      var text = 'Halo, saya ' + name + '. Konfirmasi kehadiran: ' + attend + '.' + (msg ? ' Ucapan: ' + msg : '');
      window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(text), '_blank');
    });
  }

  // 8. Copy buttons (amplop digital)
  document.querySelectorAll('[data-copy]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var value = btn.getAttribute('data-copy');
      var done = function() { btn.textContent = 'Tersalin ✓'; setTimeout(function() { btn.textContent = 'Salin Nomor'; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done).catch(done);
      } else { done(); }
    });
  });

  // 9. Background music: starts on 'Buka Undangan', floating toggle
  var music = document.getElementById('bg-music');
  var musicBtn = document.getElementById('music-toggle');
  if (music && musicBtn) {
    var startMusic = function() {
      music.play().then(function() { musicBtn.style.display = 'block'; }).catch(function() {});
    };
    document.querySelectorAll('.btn-buka-undangan').forEach(function(btn) {
      btn.addEventListener('click', startMusic);
    });
    musicBtn.addEventListener('click', function() {
      if (music.paused) { music.play(); musicBtn.textContent = '♪'; }
      else { music.pause(); musicBtn.textContent = '✕'; }
    });
  }
})();
`;

  if (doMinify) {
    return {
      html: minifyHtml(html),
      css: minifyCss(css),
      js: minifyJs(js),
      assetBlobs,
      assetFilenames,
      projectName: meta.name,
      musicFilename,
    };
  }

  return {
    html,
    css,
    js,
    assetBlobs,
    assetFilenames,
    projectName: meta.name,
    musicFilename,
  };
}

/**
 * Publish as ONE self-contained HTML file: styles, runtime and every asset
 * (images, QRIS, music) inlined as data URLs. The file can be opened
 * directly, shared, or uploaded to any static host as-is.
 */
export async function exportSingleFileHtml(project: Project): Promise<void> {
  const data = await prepareExportData(project);
  let html = data.html;

  // Inline every asset reference (longest filenames first to avoid
  // partial-prefix collisions)
  const entries = [...data.assetFilenames.entries()]
    .sort((a, b) => (b[1].length - a[1].length));
  for (const [id, filename] of entries) {
    const blob = data.assetBlobs.get(id);
    if (!blob) continue;
    const dataUrl = await blobToDataUrl(blob);
    html = html.split(`assets/${filename}`).join(dataUrl);
  }

  html = html.replace(
    '<link rel="stylesheet" href="styles.css" />',
    `<style>${data.css}</style>`
  );
  html = html.replace(
    '<script src="invitation.js"></script>',
    `<script>${data.js}</script>`
  );

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const safeName = (data.projectName || 'undangan-digital').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}-publish.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
