// ============================================================
// UndangYa! Motion Studio Lite — Project Schema
// ============================================================

export type ObjectType = 'image' | 'text' | 'shape' | 'background';

export type ShapeType = 'rect' | 'ellipse' | 'line';

export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'cubicBezier';

export type AnimationPreset =
  // Entrance
  | 'fadeIn'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'zoomIn'
  | 'softPop'
  | 'rotateIn'
  // Continuous
  | 'gentleFloat'
  | 'gentleSway'
  | 'slowPulse'
  | 'subtleRotation'
  | 'verticalDrift'
  // Exit
  | 'fadeOut'
  | 'slideOut'
  | 'zoomOut'
  // None
  | 'none';

export interface AnimationConfig {
  preset: AnimationPreset;
  duration: number;   // seconds
  delay: number;      // seconds
  easing: EasingType;
  cubicBezier?: string; // "x1,y1,x2,y2" — used when easing === 'cubicBezier'
  loop: boolean;
  startTime: number;  // in timeline (seconds)
  endTime: number;    // in timeline (seconds)
}

export interface BaseObject {
  id: string;
  type: ObjectType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  groupId?: string; // objects sharing a groupId are selected/moved together
  animation: AnimationConfig;
}

export interface ImageObject extends BaseObject {
  type: 'image';
  assetId: string;      // reference to AssetItem.id
  flipX: boolean;
  flipY: boolean;
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  fill: string;         // color
  textDecoration: 'none' | 'underline';
}

export interface ShapeObject extends BaseObject {
  type: 'shape';
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number;
}

export interface BackgroundObject extends BaseObject {
  type: 'background';
  fill: string;
  assetId?: string;
}

export type SceneObject = ImageObject | TextObject | ShapeObject | BackgroundObject;

export interface Scene {
  id: string;
  name: string;
  duration: number;       // seconds
  transition: 'fade' | 'none';
  backgroundColor: string;
  backgroundAssetId?: string;
  objects: SceneObject[];
}

export interface CanvasSettings {
  width: number;
  height: number;
  preset: 'mobile' | 'portrait' | 'square' | 'custom';
  backgroundColor: string;
}

export interface ExportConfig {
  outputDir: string;
  minify: boolean;
  includeAnimations: boolean;
}

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  description?: string;
  author?: string;
}

export interface GiftAccount {
  id: string;
  label: string;   // e.g. "BCA", "DANA", "OVO"
  number: string;  // account / phone number
  holder: string;  // account holder name
}

export interface EventInfo {
  dateISO: string;        // local datetime "2027-02-20T08:00" or ''
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  rsvpWhatsapp: string;   // digits only, international format e.g. "62812..."
  giftAccounts: GiftAccount[];
  qrisAssetId?: string;   // AssetItem.id of QRIS image
}

export interface MusicSettings {
  assetId?: string;       // AssetItem.id of the audio file
  fileName?: string;
}

export const DEFAULT_EVENT_INFO: EventInfo = {
  dateISO: '',
  venueName: '',
  venueAddress: '',
  mapsUrl: '',
  rsvpWhatsapp: '',
  giftAccounts: [],
};

export interface Project {
  meta: ProjectMeta;
  canvas: CanvasSettings;
  scenes: Scene[];
  exportConfig: ExportConfig;
  event: EventInfo;
  music: MusicSettings;
}

// Asset catalog stored separately from project JSON
export type AssetCategory =
  | 'flora'
  | 'flowers'
  | 'birds'
  | 'architecture'
  | 'ornaments'
  | 'frames'
  | 'backgrounds'
  | 'textures'
  | 'misc'
  | 'photos'
  | 'fonts'
  | 'audio';

export interface AssetItem {
  id: string;
  name: string;
  category: AssetCategory;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  createdAt: string;
  // Blob data stored in IndexedDB separately, referenced by id
}

// ---- Default factory helpers ----

export const DEFAULT_ANIMATION: AnimationConfig = {
  preset: 'none',
  duration: 1,
  delay: 0,
  easing: 'easeOut',
  loop: false,
  startTime: 0,
  endTime: 1,
};

export function createDefaultScene(overrides?: Partial<Scene>): Scene {
  return {
    id: crypto.randomUUID(),
    name: 'Scene',
    duration: 5,
    transition: 'fade',
    backgroundColor: '#1a1a2e',
    objects: [],
    ...overrides,
  };
}

export function createDefaultProject(name = 'Untitled Invitation'): Project {
  return {
    meta: {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
    },
    canvas: {
      width: 390,
      height: 844,
      preset: 'mobile',
      backgroundColor: '#1a1a2e',
    },
    scenes: [
      createDefaultScene({ name: 'Opening', backgroundColor: '#1a1a2e' }),
      createDefaultScene({ name: 'Main Hero', backgroundColor: '#16213e' }),
      createDefaultScene({ name: 'Couple', backgroundColor: '#0f3460' }),
      createDefaultScene({ name: 'Event Details', backgroundColor: '#1a1a2e' }),
      createDefaultScene({ name: 'Gallery', backgroundColor: '#16213e' }),
      createDefaultScene({ name: 'Closing', backgroundColor: '#0f3460' }),
    ],
    exportConfig: {
      outputDir: 'dist-invitation',
      minify: true,
      includeAnimations: true,
    },
    event: { ...DEFAULT_EVENT_INFO, giftAccounts: [] },
    music: {},
  };
}
