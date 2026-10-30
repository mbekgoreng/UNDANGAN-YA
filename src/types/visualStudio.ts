// ============================================================
// UndangYa! HTML Visual Studio — Data Types
// ============================================================

export type EditorMode = 'inspect' | 'move' | 'asset-place' | 'preview';

export type ViewportPreset = 'mobile-s' | 'mobile' | 'mobile-l' | 'tablet' | 'desktop' | 'custom';

export interface ViewportConfig {
  preset: ViewportPreset;
  width: number;
  height: number;
  label: string;
}

export const VIEWPORT_CONFIGS: Record<ViewportPreset, ViewportConfig> = {
  'mobile-s': { preset: 'mobile-s', width: 320, height: 640, label: 'Mobile S (320px)' },
  'mobile': { preset: 'mobile', width: 390, height: 844, label: 'Mobile (390px - Standard)' },
  'mobile-l': { preset: 'mobile-l', width: 430, height: 932, label: 'Mobile L (430px)' },
  'tablet': { preset: 'tablet', width: 768, height: 1024, label: 'Tablet (768px)' },
  'desktop': { preset: 'desktop', width: 1280, height: 800, label: 'Desktop (1280px)' },
  'custom': { preset: 'custom', width: 390, height: 844, label: 'Custom' },
};

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
  mediaQuery?: string;
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

export interface DomNodeSummary {
  id: string; // unique selector or path
  tagName: string;
  idAttr?: string;
  classNames: string[];
  textPreview?: string;
  isImage: boolean;
  isSection: boolean;
  children: DomNodeSummary[];
}

export interface SelectedElementInfo {
  selector: string;
  tagName: string;
  idAttr: string;
  classList: string[];
  xpath: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  computed: {
    position: string;
    top: string;
    left: string;
    right: string;
    bottom: string;
    width: string;
    height: string;
    opacity: string;
    transform: string;
    zIndex: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    color: string;
    lineHeight: string;
    letterSpacing: string;
    textAlign: string;
    display: string;
    objectFit: string;
    margin: string;
    padding: string;
    backgroundColor: string;
    borderRadius: string;
    animationName: string;
    animationDuration: string;
    animationDelay: string;
    animationTimingFunction: string;
  };
  isImage: boolean;
  isText: boolean;
  imageSrc?: string;
  textContent?: string;
  aspectRatio?: number;
}
