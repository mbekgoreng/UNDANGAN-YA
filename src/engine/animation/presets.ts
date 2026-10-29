// ============================================================
// Animation presets engine
// ============================================================
import type { AnimationPreset, AnimationConfig, EasingType } from '../../schemas/project';

export function getEasingCSS(easing: EasingType): string {
  switch (easing) {
    case 'linear': return 'linear';
    case 'easeIn': return 'cubic-bezier(0.4, 0, 1, 1)';
    case 'easeOut': return 'cubic-bezier(0, 0, 0.2, 1)';
    case 'easeInOut': return 'cubic-bezier(0.4, 0, 0.2, 1)';
    case 'cubicBezier': return 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    default: return 'ease-out';
  }
}

export interface AnimatedState {
  opacity: number;
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotate: number;
}

const IDENTITY: AnimatedState = {
  opacity: 1,
  translateX: 0,
  translateY: 0,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
};

export function getStartState(preset: AnimationPreset, distance = 60): AnimatedState {
  switch (preset) {
    case 'fadeIn': return { ...IDENTITY, opacity: 0 };
    case 'slideUp': return { ...IDENTITY, opacity: 0, translateY: distance };
    case 'slideDown': return { ...IDENTITY, opacity: 0, translateY: -distance };
    case 'slideLeft': return { ...IDENTITY, opacity: 0, translateX: distance };
    case 'slideRight': return { ...IDENTITY, opacity: 0, translateX: -distance };
    case 'zoomIn': return { ...IDENTITY, opacity: 0, scaleX: 0.5, scaleY: 0.5 };
    case 'softPop': return { ...IDENTITY, opacity: 0, scaleX: 0.85, scaleY: 0.85 };
    case 'rotateIn': return { ...IDENTITY, opacity: 0, rotate: -20, scaleX: 0.8, scaleY: 0.8 };
    // Continuous — start = end = identity
    case 'gentleFloat':
    case 'gentleSway':
    case 'slowPulse':
    case 'subtleRotation':
    case 'verticalDrift':
      return { ...IDENTITY };
    // Exit
    case 'fadeOut': return { ...IDENTITY };
    case 'slideOut': return { ...IDENTITY };
    case 'zoomOut': return { ...IDENTITY };
    default: return { ...IDENTITY };
  }
}

export function getEndState(preset: AnimationPreset, distance = 60): AnimatedState {
  switch (preset) {
    case 'fadeOut': return { ...IDENTITY, opacity: 0 };
    case 'slideOut': return { ...IDENTITY, opacity: 0, translateY: -distance };
    case 'zoomOut': return { ...IDENTITY, opacity: 0, scaleX: 0.5, scaleY: 0.5 };
    // Wide exits for foreground layers parting sideways (e.g. trees)
    case 'slideOutLeft': return { ...IDENTITY, opacity: 0, translateX: -280 };
    case 'slideOutRight': return { ...IDENTITY, opacity: 0, translateX: 280 };
    default: return { ...IDENTITY };
  }
}

// Lerp helper
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function applyEasing(t: number, easing: EasingType): number {
  // Simple easing functions
  const clamp01 = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'linear': return clamp01;
    case 'easeIn': return clamp01 * clamp01;
    case 'easeOut': return 1 - (1 - clamp01) * (1 - clamp01);
    case 'easeInOut': return clamp01 < 0.5
      ? 2 * clamp01 * clamp01
      : 1 - Math.pow(-2 * clamp01 + 2, 2) / 2;
    case 'cubicBezier': return 1 - Math.pow(1 - clamp01, 3);
    default: return clamp01;
  }
}

/**
 * Given the current playback time and an animation config,
 * compute the current transform state.
 */
export function computeAnimatedState(
  preset: AnimationPreset,
  config: AnimationConfig,
  currentTime: number,
  objectOpacity: number,
): AnimatedState {
  if (preset === 'none') {
    return { ...IDENTITY, opacity: objectOpacity };
  }

  const { duration, delay, easing, loop, startTime } = config;
  const effectiveStart = startTime + delay;
  const effectiveEnd = effectiveStart + duration;

  let t = (currentTime - effectiveStart) / (duration || 1);

  if (loop) {
    t = t - Math.floor(t); // wrap 0-1
  } else {
    t = Math.max(0, Math.min(1, t));
  }

  const easedT = applyEasing(t, easing);

  // Entrance presets
  if (['fadeIn','slideUp','slideDown','slideLeft','slideRight','zoomIn','softPop','rotateIn','kenBurns'].includes(preset)) {
    const start = getStartState(preset);
    const end = preset === 'kenBurns'
      ? { ...IDENTITY, opacity: objectOpacity, scaleX: 1.15, scaleY: 1.15 }
      : { ...IDENTITY, opacity: objectOpacity };

    // Before animation starts (kenBurns backgrounds stay visible)
    if (currentTime < effectiveStart) {
      return preset === 'kenBurns' ? { ...start, opacity: objectOpacity } : { ...start, opacity: 0 };
    }
    // After animation ends
    if (!loop && currentTime >= effectiveEnd) return end;

    return {
      opacity: lerp(start.opacity * objectOpacity, end.opacity, easedT),
      translateX: lerp(start.translateX, end.translateX, easedT),
      translateY: lerp(start.translateY, end.translateY, easedT),
      scaleX: lerp(start.scaleX, end.scaleX, easedT),
      scaleY: lerp(start.scaleY, end.scaleY, easedT),
      rotate: lerp(start.rotate, end.rotate, easedT),
    };
  }

  // Exit presets
  if (['fadeOut','slideOut','zoomOut','slideOutLeft','slideOutRight'].includes(preset)) {
    const start = { ...IDENTITY, opacity: objectOpacity };
    const end = getEndState(preset);
    if (currentTime < effectiveStart) return start;
    if (!loop && currentTime >= effectiveEnd) return end;
    return {
      opacity: lerp(start.opacity, end.opacity, easedT),
      translateX: lerp(start.translateX, end.translateX, easedT),
      translateY: lerp(start.translateY, end.translateY, easedT),
      scaleX: lerp(start.scaleX, end.scaleX, easedT),
      scaleY: lerp(start.scaleY, end.scaleY, easedT),
      rotate: lerp(start.rotate, end.rotate, easedT),
    };
  }

  // Fly across — travels left→right across the canvas with a gentle
  // vertical wobble (butterflies, birds). Loops when loop is on; otherwise
  // flies once and stays off-canvas.
  if (preset === 'flyAcross') {
    const rel = currentTime - effectiveStart;
    if (rel < 0) return { ...IDENTITY, opacity: 0 };
    const p = loop ? ((rel % (duration || 1)) / (duration || 1)) : Math.min(1, rel / (duration || 1));
    return {
      ...IDENTITY,
      opacity: objectOpacity,
      translateX: -140 + p * 680,
      translateY: Math.sin(p * Math.PI * 4) * 12,
    };
  }

  // Continuous — time-driven oscillation
  const relativeTime = (currentTime - effectiveStart);
  const cycleT = (relativeTime % (duration || 1)) / (duration || 1);
  const sine = Math.sin(cycleT * Math.PI * 2);
  const cosine = Math.cos(cycleT * Math.PI * 2);

  switch (preset) {
    case 'gentleFloat':
      return { ...IDENTITY, opacity: objectOpacity, translateY: sine * 8 };
    case 'gentleSway':
      return { ...IDENTITY, opacity: objectOpacity, rotate: sine * 4 };
    case 'slowPulse':
      return { ...IDENTITY, opacity: objectOpacity, scaleX: 1 + sine * 0.05, scaleY: 1 + sine * 0.05 };
    case 'subtleRotation':
      return { ...IDENTITY, opacity: objectOpacity, rotate: cycleT * 360 };
    case 'verticalDrift':
      return { ...IDENTITY, opacity: objectOpacity, translateY: cosine * 12, translateX: sine * 4 };
    default:
      return { ...IDENTITY, opacity: objectOpacity };
  }
}

export const ANIMATION_PRESET_GROUPS = [
  {
    label: 'Entrance',
    presets: ['fadeIn','slideUp','slideDown','slideLeft','slideRight','zoomIn','softPop','rotateIn','kenBurns'] as AnimationPreset[],
  },
  {
    label: 'Continuous',
    presets: ['gentleFloat','gentleSway','slowPulse','subtleRotation','verticalDrift','flyAcross'] as AnimationPreset[],
  },
  {
    label: 'Exit',
    presets: ['fadeOut','slideOut','zoomOut','slideOutLeft','slideOutRight'] as AnimationPreset[],
  },
];

export const PRESET_LABELS: Record<AnimationPreset, string> = {
  none: 'None',
  fadeIn: 'Fade In',
  slideUp: 'Slide Up',
  slideDown: 'Slide Down',
  slideLeft: 'Slide Left',
  slideRight: 'Slide Right',
  zoomIn: 'Zoom In',
  softPop: 'Soft Pop',
  rotateIn: 'Rotate In',
  kenBurns: 'Zoom Pelan (Ken Burns)',
  gentleFloat: 'Gentle Float',
  gentleSway: 'Gentle Sway',
  slowPulse: 'Slow Pulse',
  subtleRotation: 'Subtle Rotation',
  verticalDrift: 'Vertical Drift',
  flyAcross: 'Terbang Melintas',
  fadeOut: 'Fade Out',
  slideOut: 'Slide Out',
  zoomOut: 'Zoom Out',
  slideOutLeft: 'Geser Keluar Kiri',
  slideOutRight: 'Geser Keluar Kanan',
};
