// ============================================================
// Canvas renderer for video export — draws a scene at a given
// time exactly like the Timeline preview (same animation engine),
// including scene transitions mapped from the CSS library.
// ============================================================
import type { Project, Scene, SceneObject, ImageObject, TextObject, ShapeObject, BackgroundObject, SceneTransition } from '../../schemas/project';
import { computeAnimatedState } from '../animation/presets';
import { getAssetObjectURL } from '../../storage/db';

// ---------- Pure helpers (unit-testable) ----------

export interface FitRect { dx: number; dy: number; dw: number; dh: number }

/** objectFit: contain — fit whole image inside box */
export function containRect(imgW: number, imgH: number, boxW: number, boxH: number): FitRect {
  if (!imgW || !imgH) return { dx: 0, dy: 0, dw: boxW, dh: boxH };
  const s = Math.min(boxW / imgW, boxH / imgH);
  const dw = imgW * s;
  const dh = imgH * s;
  return { dx: (boxW - dw) / 2, dy: (boxH - dh) / 2, dw, dh };
}

/** objectFit: cover — fill box, crop overflow (drawImage source rect) */
export function coverSourceRect(imgW: number, imgH: number, boxW: number, boxH: number): { sx: number; sy: number; sw: number; sh: number } {
  if (!imgW || !imgH) return { sx: 0, sy: 0, sw: imgW, sh: imgH };
  const imgRatio = imgW / imgH;
  const boxRatio = boxW / boxH;
  if (imgRatio > boxRatio) {
    const sw = imgH * boxRatio;
    return { sx: (imgW - sw) / 2, sy: 0, sw, sh: imgH };
  }
  const sh = imgW / boxRatio;
  return { sx: 0, sy: (imgH - sh) / 2, sw: imgW, sh };
}

/** Greedy word wrap matching CSS pre-wrap + break-word closely enough for export */
export function wrapTextLines(measure: (s: string) => number, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (paragraph === '') { lines.push(''); continue; }
    let current = '';
    for (const word of paragraph.split(' ')) {
      const candidate = current ? current + ' ' + word : word;
      if (measure(candidate) <= maxWidth || current === '') {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

export interface TransitionState {
  alpha: number;
  tx: number;
  ty: number;
  scale: number;
  scaleX: number;
  scaleY: number;
  rotateDeg: number;
  blurPx: number;
  brightness: number;
  clip: 'left' | 'up' | null;
  clipRatio: number;
}

const IDENTITY_T: TransitionState = {
  alpha: 1, tx: 0, ty: 0, scale: 1, scaleX: 1, scaleY: 1,
  rotateDeg: 0, blurPx: 0, brightness: 1, clip: null, clipRatio: 1,
};

export function transitionDuration(t: SceneTransition): number {
  if (t === 'fadeSlow') return 1.6;
  if (t === 'popIn') return 0.7;
  return 0.8;
}

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeOutBack = (p: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

/** Map a CSS scene transition to canvas state at progress p (0..1 of its reveal) */
export function sceneTransitionState(t: SceneTransition, pRaw: number, w: number, h: number): TransitionState {
  const p = Math.max(0, Math.min(1, pRaw));
  if (t === 'none' || p >= 1) return { ...IDENTITY_T };
  const e = easeOutCubic(p);
  const rem = 1 - e;
  const s: TransitionState = { ...IDENTITY_T };
  switch (t) {
    case 'fade': s.alpha = e; s.ty = 24 * rem; break;
    case 'fadeSlow': s.alpha = e; break;
    case 'blackFade': s.alpha = e; s.brightness = e; break;
    case 'whiteFade': s.alpha = e; s.brightness = 1 + 1.6 * rem; break;
    case 'blurIn': s.alpha = e; s.blurPx = 16 * rem; break;
    case 'rise': s.alpha = e; s.ty = 56 * rem; break;
    case 'drop': s.alpha = e; s.ty = -56 * rem; break;
    case 'slideLeft': s.alpha = e; s.tx = 72 * rem; break;
    case 'slideRight': s.alpha = e; s.tx = -72 * rem; break;
    case 'slideFull': s.alpha = e; s.tx = w * rem; break;
    case 'wipeLeft': s.clip = 'left'; s.clipRatio = e; break;
    case 'wipeUp': s.clip = 'up'; s.clipRatio = e; break;
    case 'cameraIn': s.alpha = e; s.scale = 1 + 0.22 * rem; break;
    case 'cameraOut': s.alpha = e; s.scale = 0.82 + 0.18 * e; break;
    case 'zoomSpin': s.alpha = e; s.scale = 0.85 + 0.15 * e; s.rotateDeg = -6 * rem; break;
    case 'spin': s.alpha = e; s.scale = 0.92 + 0.08 * e; s.rotateDeg = 10 * rem; break;
    // 3D flips approximated by axis compression (canvas has no perspective)
    case 'flipX': s.alpha = e; s.scaleY = Math.max(0.05, Math.cos((55 * rem * Math.PI) / 180)); break;
    case 'flipY': s.alpha = e; s.scaleX = Math.max(0.05, Math.cos((55 * rem * Math.PI) / 180)); break;
    case 'swing': s.alpha = e; s.rotateDeg = -8 * rem; s.ty = -10 * rem; break;
    case 'popIn': s.alpha = Math.min(1, e * 1.6); s.scale = 0.55 + 0.45 * easeOutBack(p); break;
    case 'fallIn': s.alpha = e; s.ty = -140 * rem; break;
    case 'shake': s.alpha = Math.min(1, p * 3); s.tx = Math.sin(p * Math.PI * 5) * 9 * (1 - p); break;
    case 'glitch': s.alpha = Math.min(1, p * 3); s.tx = Math.sin(p * 40) * 6 * (1 - p); s.ty = Math.cos(p * 34) * 2 * (1 - p); break;
    case 'flash': s.alpha = 0.3 + 0.7 * e; s.brightness = 1 + 1.6 * rem; break;
    default: break;
  }
  return s;
}

/** Pick the best MediaRecorder mime type; MP4 first, WebM fallback */
export function pickRecorderMime(isTypeSupported: (m: string) => boolean): { mime: string; ext: string } | null {
  const candidates: Array<{ mime: string; ext: string }> = [
    { mime: 'video/mp4;codecs="avc1.640028,mp4a.40.2"', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  for (const c of candidates) {
    try { if (isTypeSupported(c.mime)) return c; } catch { /* continue */ }
  }
  return null;
}

// ---------- Image preloading ----------

export async function preloadSceneImages(project: Project): Promise<Map<string, HTMLImageElement>> {
  const ids = new Set<string>();
  for (const scene of project.scenes) {
    if (scene.backgroundAssetId) ids.add(scene.backgroundAssetId);
    for (const obj of scene.objects) {
      if (obj.type === 'image') ids.add((obj as ImageObject).assetId);
      if (obj.type === 'background' && (obj as BackgroundObject).assetId) ids.add((obj as BackgroundObject).assetId!);
    }
  }
  const map = new Map<string, HTMLImageElement>();
  await Promise.all([...ids].map(async id => {
    const url = await getAssetObjectURL(id);
    if (!url) return;
    const img = new Image();
    img.src = url;
    try { await img.decode(); } catch { /* still try to use it */ }
    map.set(id, img);
  }));
  return map;
}

// ---------- Frame drawing ----------

function drawObject(
  ctx: CanvasRenderingContext2D,
  obj: SceneObject,
  sceneTime: number,
  images: Map<string, HTMLImageElement>,
  s: number,
) {
  if (!obj.visible) return;
  const anim = computeAnimatedState(obj.animation.preset, obj.animation, sceneTime, obj.opacity);
  const w = obj.width * s;
  const h = obj.height * s;
  const cx = (obj.x + obj.width / 2) * s;
  const cy = (obj.y + obj.height / 2) * s;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, anim.opacity));
  ctx.translate(cx, cy);
  ctx.rotate(((obj.rotation + anim.rotate) * Math.PI) / 180);
  ctx.translate(anim.translateX * s, anim.translateY * s);
  ctx.scale(anim.scaleX, anim.scaleY);

  if (obj.type === 'image') {
    const img = images.get((obj as ImageObject).assetId);
    if (img) {
      const o = obj as ImageObject;
      ctx.save();
      ctx.scale(o.flipX ? -1 : 1, o.flipY ? -1 : 1);
      const r = containRect(img.naturalWidth, img.naturalHeight, w, h);
      ctx.drawImage(img, -w / 2 + r.dx, -h / 2 + r.dy, r.dw, r.dh);
      ctx.restore();
    }
  } else if (obj.type === 'background') {
    const b = obj as BackgroundObject;
    ctx.fillStyle = b.fill;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    if (b.assetId) {
      const img = images.get(b.assetId);
      if (img) {
        const src = coverSourceRect(img.naturalWidth, img.naturalHeight, w, h);
        ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, -w / 2, -h / 2, w, h);
      }
    }
  } else if (obj.type === 'shape') {
    const sh = obj as ShapeObject;
    ctx.fillStyle = sh.fill;
    ctx.strokeStyle = sh.stroke;
    ctx.lineWidth = sh.strokeWidth * s;
    ctx.beginPath();
    if (sh.shapeType === 'ellipse') {
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    } else if (sh.shapeType === 'line') {
      ctx.rect(-w / 2, -h / 2, w, Math.max(h, 1));
    } else {
      const r = Math.min((sh.cornerRadius ?? 0) * s, w / 2, h / 2);
      ctx.roundRect(-w / 2, -h / 2, w, h, r);
    }
    if (sh.fill && sh.fill !== 'transparent') ctx.fill();
    if (sh.strokeWidth > 0) ctx.stroke();
  } else if (obj.type === 'text') {
    const t = obj as TextObject;
    const fontSize = t.fontSize * s;
    ctx.font = `${t.fontStyle} ${t.fontWeight} ${fontSize}px ${t.fontFamily}`;
    ctx.fillStyle = t.fill;
    try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${t.letterSpacing * s}px`; } catch { /* unsupported */ }
    const display = t.text.split('{nama}').join('Nama Tamu').split('{tamu}').join('Nama Tamu');
    const lines = wrapTextLines(str => ctx.measureText(str).width, display, w);
    const lineH = fontSize * t.lineHeight;
    const blockH = lines.length * lineH;
    let lineY = -blockH / 2 + lineH / 2;
    ctx.textBaseline = 'middle';
    for (const line of lines) {
      let lx = -w / 2;
      ctx.textAlign = 'left';
      if (t.textAlign === 'center') { ctx.textAlign = 'center'; lx = 0; }
      if (t.textAlign === 'right') { ctx.textAlign = 'right'; lx = w / 2; }
      ctx.fillText(line, lx, lineY);
      if (t.textDecoration === 'underline') {
        const tw = ctx.measureText(line).width;
        const ux = t.textAlign === 'center' ? -tw / 2 : t.textAlign === 'right' ? lx - tw : lx;
        ctx.fillRect(ux, lineY + fontSize * 0.62, tw, Math.max(1, fontSize * 0.06));
      }
      lineY += lineH;
    }
    try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px'; } catch { /* ignore */ }
  }
  ctx.restore();
}

/**
 * Draw one full frame: scene at global time t (seconds across all scenes).
 * Returns false when t is past the end.
 */
export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  project: Project,
  images: Map<string, HTMLImageElement>,
  t: number,
  scaleFactor: number,
): boolean {
  const { canvas, scenes } = project;
  const W = canvas.width * scaleFactor;
  const H = canvas.height * scaleFactor;
  let acc = 0;
  let scene: Scene | null = null;
  let local = 0;
  for (const sc of scenes) {
    if (t < acc + sc.duration) { scene = sc; local = t - acc; break; }
    acc += sc.duration;
  }
  if (!scene) return false;

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // Scene transition state (reveal at scene start)
  const td = transitionDuration(scene.transition);
  const ts = sceneTransitionState(scene.transition, local / td, canvas.width, canvas.height);
  ctx.globalAlpha = ts.alpha;
  const filters: string[] = [];
  if (ts.blurPx > 0.1) filters.push(`blur(${ts.blurPx * scaleFactor}px)`);
  if (Math.abs(ts.brightness - 1) > 0.01) filters.push(`brightness(${ts.brightness})`);
  ctx.filter = filters.length ? filters.join(' ') : 'none';
  if (ts.clip) {
    ctx.beginPath();
    if (ts.clip === 'left') ctx.rect(0, 0, W * ts.clipRatio, H);
    else ctx.rect(0, H * (1 - ts.clipRatio), W, H * ts.clipRatio);
    ctx.clip();
  }
  ctx.translate(W / 2, H / 2);
  ctx.translate(ts.tx * scaleFactor, ts.ty * scaleFactor);
  ctx.scale(ts.scale * ts.scaleX, ts.scale * ts.scaleY);
  ctx.rotate((ts.rotateDeg * Math.PI) / 180);
  ctx.translate(-W / 2, -H / 2);

  // Background
  ctx.fillStyle = scene.backgroundColor;
  ctx.fillRect(-W * 0.3, -H * 0.3, W * 1.6, H * 1.6);
  if (scene.backgroundAssetId) {
    const bg = images.get(scene.backgroundAssetId);
    if (bg) {
      const src = coverSourceRect(bg.naturalWidth, bg.naturalHeight, W, H);
      ctx.drawImage(bg, src.sx, src.sy, src.sw, src.sh, 0, 0, W, H);
    }
  }

  const sorted = [...scene.objects].sort((a, b) => a.zIndex - b.zIndex);
  for (const obj of sorted) drawObject(ctx, obj, local, images, scaleFactor);

  ctx.restore();
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  return true;
}

export function totalDurationOf(project: Project): number {
  return project.scenes.reduce((acc, s) => acc + s.duration, 0);
}
