// ============================================================
// UndangYa! HTML Visual Studio — Global Application Context
// Coordinates DOM inspection, CSS patching, Viewports, and History
// ============================================================
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type {
  EditorMode,
  ViewportConfig,
  ViewportPreset,
  ProjectMetadata,
  ProjectFileInfo,
  ProjectHealth,
  SelectedElementInfo,
  DomNodeSummary,
  CssPatch,
} from '../types/visualStudio';
import { VIEWPORT_CONFIGS } from '../types/visualStudio';
import * as api from '../api/studioApi';

interface HistoryEntry {
  description: string;
  patches: CssPatch[];
}

interface StudioContextValue {
  project: ProjectMetadata | null;
  files: ProjectFileInfo[];
  health: ProjectHealth | null;
  selectedElement: SelectedElementInfo | null;
  editorMode: EditorMode;
  viewport: ViewportConfig;
  zoom: number;
  activeTab: 'project' | 'layers' | 'assets' | 'scenes' | 'history' | 'diagnostics';
  compareMode: 'edited' | 'original' | 'split';
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  domTree: DomNodeSummary[];
  activeMediaQuery: string;
  iframeKey: number;
  hoveredElementSelector: string | null;
  canUndo: boolean;
  canRedo: boolean;
  isBackendConnected: boolean;

  // Actions
  openProject: (dirPath: string) => Promise<void>;
  openSample: () => Promise<void>;
  selectElement: (info: SelectedElementInfo | null) => void;
  setHoveredElementSelector: (selector: string | null) => void;
  updateElementStyles: (styles: Record<string, string>, commitPatch?: boolean) => Promise<void>;
  updateElementText: (newText: string) => void;
  deleteSelectedElement: () => Promise<void>;
  duplicateSelectedElement: () => Promise<void>;
  setEditorMode: (mode: EditorMode) => void;
  setViewport: (preset: ViewportPreset, customW?: number, customH?: number) => void;
  setZoom: (zoom: number) => void;
  setActiveTab: (tab: 'project' | 'layers' | 'assets' | 'scenes' | 'history' | 'diagnostics') => void;
  setCompareMode: (mode: 'edited' | 'original' | 'split') => void;
  setActiveMediaQuery: (mq: string) => void;
  refreshIframe: () => void;
  revertPatch: (patchId: string) => Promise<void>;
  uploadAsset: (file: File) => Promise<{ relativePath: string; filename: string }>;
  insertAssetElement: (assetRelativePath: string, containerSelector: string) => Promise<void>;
  createSnapshot: (label: string) => Promise<void>;
  restoreSnapshot: (snapshotId: string) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  setDomTree: (tree: DomNodeSummary[]) => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ProjectMetadata | null>(null);
  const [files, setFiles] = useState<ProjectFileInfo[]>([]);
  const [health, setHealth] = useState<ProjectHealth | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('move');
  const [viewport, setViewportState] = useState<ViewportConfig>(VIEWPORT_CONFIGS.mobile);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<'project' | 'layers' | 'assets' | 'scenes' | 'history' | 'diagnostics'>('layers');
  const [compareMode, setCompareMode] = useState<'edited' | 'original' | 'split'>('edited');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [domTree, setDomTree] = useState<DomNodeSummary[]>([]);
  const [activeMediaQuery, setActiveMediaQuery] = useState<string>('');
  const [iframeKey, setIframeKey] = useState(1);
  const [hoveredElementSelector, setHoveredElementSelector] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  // Undo/Redo history of patches
  const historyPast = useRef<HistoryEntry[]>([]);
  const historyFuture = useRef<HistoryEntry[]>([]);

  const refreshProjectData = useCallback(async (id: string) => {
    try {
      const data = await api.getProjectDetails(id);
      setProject(data.meta);
      setFiles(data.files);
      setHealth(data.health);
    } catch (err) {
      console.error('Failed to refresh project data:', err);
    }
  }, []);

  // Open project by local path
  const openProject = useCallback(async (dirPath: string) => {
    setSaveStatus('saving');
    try {
      const meta = await api.openProjectByPath(dirPath);
      await refreshProjectData(meta.id);
      setSelectedElement(null);
      setIframeKey(k => k + 1);
      setSaveStatus('saved');
    } catch (err: any) {
      setSaveStatus('error');
      alert(`Gagal membuka proyek: ${err.message}`);
    }
  }, [refreshProjectData]);

  // Open built-in sample flawed invitation
  const openSample = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const meta = await api.openSampleProject();
      await refreshProjectData(meta.id);
      setSelectedElement(null);
      setIframeKey(k => k + 1);
      setSaveStatus('saved');
    } catch (err: any) {
      setSaveStatus('error');
      alert(`Gagal membuka sampel: ${err.message}`);
    }
  }, [refreshProjectData]);

  // Initial mount: check backend and open sample project if none open
  useEffect(() => {
    api.checkBackendHealth().then(connected => {
      setIsBackendConnected(connected);
      if (connected) {
        api.listProjects().then(list => {
          if (list.length > 0) {
            refreshProjectData(list[0].id);
          } else {
            openSample();
          }
        }).catch(() => openSample());
      }
    });
  }, [openSample, refreshProjectData]);

  const selectElement = useCallback((info: SelectedElementInfo | null) => {
    setSelectedElement(info);
  }, []);

  // Update styles for currently selected element (with patch saving)
  const updateElementStyles = useCallback(async (newProperties: Record<string, string>, commitPatch = true) => {
    if (!project || !selectedElement) return;

    if (commitPatch) {
      // Record undo snapshot
      historyPast.current.push({
        description: `Edit ${selectedElement.selector}`,
        patches: JSON.parse(JSON.stringify(project.patches)),
      });
      historyFuture.current = [];
      setSaveStatus('saving');

      try {
        const res = await api.saveCssPatch(project.id, {
          selector: selectedElement.selector,
          properties: newProperties,
          mediaQuery: activeMediaQuery || undefined,
          elementDescription: `${selectedElement.tagName} ${selectedElement.idAttr ? '#' + selectedElement.idAttr : ''}`.trim(),
        });

        // Update local project metadata
        setProject(prev => prev ? {
          ...prev,
          patches: prev.patches.some(p => p.id === res.patch.id)
            ? prev.patches.map(p => p.id === res.patch.id ? res.patch : p)
            : [...prev.patches, res.patch],
        } : null);

        // Update selectedElement computed values
        setSelectedElement(prev => prev ? {
          ...prev,
          computed: { ...prev.computed, ...newProperties },
        } : null);

        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
        console.error('Failed to save patch:', err);
      }
    }
  }, [project, selectedElement, activeMediaQuery]);

  // Update text content of selected element
  const updateElementText = useCallback((newText: string) => {
    if (!selectedElement) return;
    setSelectedElement(prev => prev ? { ...prev, textContent: newText } : null);
  }, [selectedElement]);

  // Delete selected element (safe hide via display: none patch)
  const deleteSelectedElement = useCallback(async () => {
    if (!selectedElement || !project) return;
    if (!confirm(`Sembunyikan elemen "${selectedElement.selector}"?`)) return;
    await updateElementStyles({ display: 'none' }, true);
    setSelectedElement(null);
  }, [selectedElement, project, updateElementStyles]);

  // Duplicate element
  const duplicateSelectedElement = useCallback(async () => {
    if (!selectedElement || !project) return;
    alert('Duplikasi elemen dapat dilakukan dengan menambahkan aset baru melalui tab Asset Library.');
  }, [selectedElement, project]);

  const setViewport = useCallback((preset: ViewportPreset, customW?: number, customH?: number) => {
    if (preset === 'custom' && customW && customH) {
      setViewportState({ preset: 'custom', width: customW, height: customH, label: `Custom (${customW}×${customH})` });
    } else {
      setViewportState(VIEWPORT_CONFIGS[preset] || VIEWPORT_CONFIGS.mobile);
    }
  }, []);

  const refreshIframe = useCallback(() => {
    setIframeKey(k => k + 1);
  }, []);

  // Revert / delete patch
  const revertPatch = useCallback(async (patchId: string) => {
    if (!project) return;
    setSaveStatus('saving');
    try {
      await api.deleteCssPatch(project.id, patchId);
      setProject(prev => prev ? {
        ...prev,
        patches: prev.patches.filter(p => p.id !== patchId),
      } : null);
      refreshIframe();
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
      console.error('Revert patch failed:', err);
    }
  }, [project, refreshIframe]);

  // Upload asset
  const uploadAsset = useCallback(async (file: File) => {
    if (!project) throw new Error('No project active');
    const res = await api.uploadProjectAsset(project.id, file);
    await refreshProjectData(project.id);
    return res;
  }, [project, refreshProjectData]);

  // Insert asset element into HTML
  const insertAssetElement = useCallback(async (assetRelativePath: string, containerSelector: string) => {
    if (!project) return;
    setSaveStatus('saving');
    const imgId = 'asset_' + Date.now().toString(36);
    const elementHtml = `<img src="${assetRelativePath}" id="${imgId}" class="undangya-inserted-asset" alt="Decor" style="position: absolute; top: 100px; left: 50%; transform: translateX(-50%); width: 140px; z-index: 10;" />`;

    try {
      await api.insertElementIntoHtml(project.id, containerSelector, elementHtml);
      await refreshProjectData(project.id);
      refreshIframe();
      setSaveStatus('saved');
    } catch (err: any) {
      setSaveStatus('error');
      alert(`Gagal menyisipkan aset: ${err.message}`);
    }
  }, [project, refreshProjectData, refreshIframe]);

  // Snapshot
  const createSnapshot = useCallback(async (label: string) => {
    if (!project) return;
    await api.createProjectSnapshot(project.id, label);
    await refreshProjectData(project.id);
  }, [project, refreshProjectData]);

  const restoreSnapshot = useCallback(async (snapshotId: string) => {
    if (!project) return;
    if (!confirm('Pulihkan snapshot ini? Perubahan terkini yang belum disimpan akan dikembalikan.')) return;
    setSaveStatus('saving');
    await api.restoreProjectSnapshot(project.id, snapshotId);
    await refreshProjectData(project.id);
    refreshIframe();
    setSaveStatus('saved');
  }, [project, refreshProjectData, refreshIframe]);

  // Undo / Redo
  const undo = useCallback(async () => {
    if (!project || historyPast.current.length === 0) return;
    const last = historyPast.current.pop()!;
    historyFuture.current.push({
      description: 'Reverted',
      patches: JSON.parse(JSON.stringify(project.patches)),
    });

    setSaveStatus('saving');
    // Apply patches from last
    // For simplicity, overwrite project patches
    setProject(prev => prev ? { ...prev, patches: last.patches } : null);
    refreshIframe();
    setSaveStatus('saved');
  }, [project, refreshIframe]);

  const redo = useCallback(async () => {
    if (!project || historyFuture.current.length === 0) return;
    const next = historyFuture.current.pop()!;
    historyPast.current.push({
      description: 'Redo',
      patches: JSON.parse(JSON.stringify(project.patches)),
    });

    setSaveStatus('saving');
    setProject(prev => prev ? { ...prev, patches: next.patches } : null);
    refreshIframe();
    setSaveStatus('saved');
  }, [project, refreshIframe]);

  const canUndo = historyPast.current.length > 0;
  const canRedo = historyFuture.current.length > 0;

  return (
    <StudioContext.Provider
      value={{
        project,
        files,
        health,
        selectedElement,
        editorMode,
        viewport,
        zoom,
        activeTab,
        compareMode,
        saveStatus,
        domTree,
        activeMediaQuery,
        iframeKey,
        hoveredElementSelector,
        canUndo,
        canRedo,
        isBackendConnected,
        openProject,
        openSample,
        selectElement,
        setHoveredElementSelector,
        updateElementStyles,
        updateElementText,
        deleteSelectedElement,
        duplicateSelectedElement,
        setEditorMode,
        setViewport,
        setZoom,
        setActiveTab,
        setCompareMode,
        setActiveMediaQuery,
        refreshIframe,
        revertPatch,
        uploadAsset,
        insertAssetElement,
        createSnapshot,
        restoreSnapshot,
        undo,
        redo,
        setDomTree,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
}
