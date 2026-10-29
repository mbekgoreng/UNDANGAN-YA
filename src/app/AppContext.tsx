// ============================================================
// Global application state via React Context + useReducer
// ============================================================
import React, {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  Project,
  Scene,
  SceneObject,
  AssetItem,
  EventInfo,
  MusicSettings,
  ExportConfig,
} from '../schemas/project';
import { buildTemplateProject } from '../engine/scene/templateFactory';

// ---- History for undo/redo ----
const MAX_HISTORY = 50;

interface HistoryState {
  past: Project[];
  present: Project;
  future: Project[];
}

// ---- App State ----
export interface AppState {
  project: Project;
  history: HistoryState;
  selectedSceneId: string | null;
  selectedObjectIds: string[];
  activeTab: 'assets' | 'layers' | 'scenes' | 'templates';
  assets: AssetItem[];
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  isPlaying: boolean;
  currentTime: number;
  zoom: number;
  showPreview: boolean;
  showExportDialog: boolean;
  showProjectManager: boolean;
  showEventPanel: boolean;
}

type Action =
  | { type: 'SET_PROJECT'; project: Project }
  | { type: 'LOAD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT_META'; meta: Partial<Project['meta']> }
  | { type: 'SET_CANVAS'; canvas: Partial<Project['canvas']> }
  | { type: 'SET_EVENT_INFO'; event: Partial<EventInfo> }
  | { type: 'SET_MUSIC'; music: MusicSettings }
  | { type: 'SET_EXPORT_CONFIG'; exportConfig: Partial<ExportConfig> }
  | { type: 'UPDATE_OBJECTS_BATCH'; sceneId: string; updates: Record<string, Partial<SceneObject>> }
  | { type: 'ADD_SCENE'; scene: Scene }
  | { type: 'UPDATE_SCENE'; sceneId: string; updates: Partial<Scene> }
  | { type: 'DELETE_SCENE'; sceneId: string }
  | { type: 'REORDER_SCENES'; scenes: Scene[] }
  | { type: 'ADD_OBJECT'; sceneId: string; object: SceneObject }
  | { type: 'UPDATE_OBJECT'; sceneId: string; objectId: string; updates: Partial<SceneObject> }
  | { type: 'DELETE_OBJECT'; sceneId: string; objectId: string }
  | { type: 'REORDER_OBJECTS'; sceneId: string; objects: SceneObject[] }
  | { type: 'SELECT_SCENE'; sceneId: string | null }
  | { type: 'SELECT_OBJECT'; objectId: string | null }
  | { type: 'SELECT_OBJECTS'; objectIds: string[] }
  | { type: 'SET_ACTIVE_TAB'; tab: AppState['activeTab'] }
  | { type: 'SET_ASSETS'; assets: AssetItem[] }
  | { type: 'ADD_ASSET'; asset: AssetItem }
  | { type: 'REMOVE_ASSET'; assetId: string }
  | { type: 'SET_SAVE_STATUS'; status: AppState['saveStatus'] }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'TOGGLE_PREVIEW'; show?: boolean }
  | { type: 'TOGGLE_EXPORT_DIALOG'; show?: boolean }
  | { type: 'TOGGLE_PROJECT_MANAGER'; show?: boolean }
  | { type: 'TOGGLE_EVENT_PANEL'; show?: boolean }
  | { type: 'UNDO' }
  | { type: 'REDO' };

function projectReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_PROJECT': {
      // Replace the whole project WITHOUT touching history or marking the
      // project dirty — used when restoring a saved project at startup, so
      // merely opening the app never writes anything to storage.
      return {
        ...state,
        project: action.project,
        history: { past: [], present: action.project, future: [] },
        selectedSceneId: action.project.scenes[0]?.id ?? null,
        selectedObjectIds: [],
        saveStatus: 'saved',
      };
    }
    case 'UNDO': {
      if (state.history.past.length === 0) return state;
      const prev = state.history.past[state.history.past.length - 1];
      return {
        ...state,
        project: prev,
        history: {
          past: state.history.past.slice(0, -1),
          present: prev,
          future: [state.project, ...state.history.future].slice(0, MAX_HISTORY),
        },
        saveStatus: 'unsaved',
      };
    }
    case 'REDO': {
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      return {
        ...state,
        project: next,
        history: {
          past: [...state.history.past, state.project].slice(-MAX_HISTORY),
          present: next,
          future: state.history.future.slice(1),
        },
        saveStatus: 'unsaved',
      };
    }
    default:
      break;
  }

  // For all project-modifying actions, push current to past
  const modifiesProject = [
    'SET_PROJECT','UPDATE_PROJECT_META','SET_CANVAS',
    'SET_EVENT_INFO','SET_MUSIC','SET_EXPORT_CONFIG','UPDATE_OBJECTS_BATCH',
    'ADD_SCENE','UPDATE_SCENE','DELETE_SCENE','REORDER_SCENES',
    'ADD_OBJECT','UPDATE_OBJECT','DELETE_OBJECT','REORDER_OBJECTS',
  ].includes(action.type);

  let newProject = state.project;

  switch (action.type) {
    case 'SET_PROJECT':
      newProject = action.project;
      break;
    case 'UPDATE_PROJECT_META':
      newProject = {
        ...state.project,
        meta: { ...state.project.meta, ...action.meta, updatedAt: new Date().toISOString() },
      };
      break;
    case 'SET_CANVAS':
      newProject = {
        ...state.project,
        canvas: { ...state.project.canvas, ...action.canvas },
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    case 'SET_EVENT_INFO':
      newProject = {
        ...state.project,
        event: { ...(state.project.event ?? { dateISO: '', venueName: '', venueAddress: '', mapsUrl: '', rsvpWhatsapp: '', giftAccounts: [] }), ...action.event },
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    case 'SET_MUSIC':
      newProject = {
        ...state.project,
        music: action.music,
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    case 'SET_EXPORT_CONFIG':
      newProject = {
        ...state.project,
        exportConfig: { ...state.project.exportConfig, ...action.exportConfig },
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    case 'UPDATE_OBJECTS_BATCH': {
      newProject = {
        ...state.project,
        scenes: state.project.scenes.map(s =>
          s.id === action.sceneId
            ? {
                ...s,
                objects: s.objects.map(o =>
                  action.updates[o.id] ? { ...o, ...action.updates[o.id] } as SceneObject : o
                ),
              }
            : s
        ),
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    }
    case 'ADD_SCENE':
      newProject = {
        ...state.project,
        scenes: [...state.project.scenes, action.scene],
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    case 'UPDATE_SCENE':
      newProject = {
        ...state.project,
        scenes: state.project.scenes.map(s =>
          s.id === action.sceneId ? { ...s, ...action.updates } : s
        ),
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    case 'DELETE_SCENE':
      newProject = {
        ...state.project,
        scenes: state.project.scenes.filter(s => s.id !== action.sceneId),
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    case 'REORDER_SCENES':
      newProject = {
        ...state.project,
        scenes: action.scenes,
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    case 'ADD_OBJECT': {
      newProject = {
        ...state.project,
        scenes: state.project.scenes.map(s =>
          s.id === action.sceneId
            ? { ...s, objects: [...s.objects, action.object] }
            : s
        ),
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    }
    case 'UPDATE_OBJECT': {
      newProject = {
        ...state.project,
        scenes: state.project.scenes.map(s =>
          s.id === action.sceneId
            ? {
                ...s,
                objects: s.objects.map(o =>
                  o.id === action.objectId ? { ...o, ...action.updates } as SceneObject : o
                ),
              }
            : s
        ),
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    }
    case 'DELETE_OBJECT': {
      newProject = {
        ...state.project,
        scenes: state.project.scenes.map(s =>
          s.id === action.sceneId
            ? { ...s, objects: s.objects.filter(o => o.id !== action.objectId) }
            : s
        ),
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    }
    case 'REORDER_OBJECTS': {
      newProject = {
        ...state.project,
        scenes: state.project.scenes.map(s =>
          s.id === action.sceneId ? { ...s, objects: action.objects } : s
        ),
        meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
      };
      break;
    }
    default:
      break;
  }

  const newHistory: HistoryState = modifiesProject
    ? {
        past: [...state.history.past, state.project].slice(-MAX_HISTORY),
        present: newProject,
        future: [],
      }
    : state.history;

  // Non-project state updates
  let extra: Partial<AppState> = {};
  switch (action.type) {
    case 'SELECT_SCENE':
      extra = { selectedSceneId: action.sceneId, selectedObjectIds: [] };
      break;
    case 'SELECT_OBJECT':
      extra = { selectedObjectIds: action.objectId ? [action.objectId] : [] };
      break;
    case 'SELECT_OBJECTS':
      extra = { selectedObjectIds: action.objectIds };
      break;
    case 'SET_ACTIVE_TAB':
      extra = { activeTab: action.tab };
      break;
    case 'SET_ASSETS':
      extra = { assets: action.assets };
      break;
    case 'ADD_ASSET':
      extra = { assets: [...state.assets, action.asset] };
      break;
    case 'REMOVE_ASSET':
      extra = { assets: state.assets.filter(a => a.id !== action.assetId) };
      break;
    case 'SET_SAVE_STATUS':
      extra = { saveStatus: action.status };
      break;
    case 'SET_PLAYING':
      extra = { isPlaying: action.playing };
      break;
    case 'SET_CURRENT_TIME':
      extra = { currentTime: action.time };
      break;
    case 'SET_ZOOM':
      extra = { zoom: Math.max(0.1, Math.min(3, action.zoom)) };
      break;
    case 'TOGGLE_PREVIEW':
      extra = { showPreview: action.show !== undefined ? action.show : !state.showPreview };
      break;
    case 'TOGGLE_EXPORT_DIALOG':
      extra = { showExportDialog: action.show !== undefined ? action.show : !state.showExportDialog };
      break;
    case 'TOGGLE_PROJECT_MANAGER':
      extra = { showProjectManager: action.show !== undefined ? action.show : !state.showProjectManager };
      break;
    case 'TOGGLE_EVENT_PANEL':
      extra = { showEventPanel: action.show !== undefined ? action.show : !state.showEventPanel };
      break;
    default:
      break;
  }

  return {
    ...state,
    ...extra,
    project: newProject,
    history: newHistory,
    saveStatus: modifiesProject ? 'unsaved' : (extra.saveStatus ?? state.saveStatus),
  };
}

// ---- Context ----
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  selectedScene: Scene | null;
  selectedObject: SceneObject | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const defaultProject = buildTemplateProject('javanese-gold', 'Pernikahan Raden & Dian');
  const initialState: AppState = {
    project: defaultProject,
    history: {
      past: [],
      present: defaultProject,
      future: [],
    },
    selectedSceneId: defaultProject.scenes[0]?.id ?? null,
    selectedObjectIds: [],
    activeTab: 'layers',
    assets: [],
    // The bootstrap template is NOT dirty: opening the app must not autosave
    // a fresh template copy on every visit (audit F-02). It becomes 'unsaved'
    // only when the user actually modifies it.
    saveStatus: 'saved',
    isPlaying: false,
    currentTime: 0,
    zoom: 1,
    showPreview: false,
    showExportDialog: false,
    showProjectManager: false,
    showEventPanel: false,
  };

  const [state, dispatch] = useReducer(projectReducer, initialState);

  const selectedScene = state.project.scenes.find(s => s.id === state.selectedSceneId) ?? null;
  const selectedObject =
    state.selectedObjectIds.length > 0
      ? selectedScene?.objects.find(o => o.id === state.selectedObjectIds[0]) ?? null
      : null;

  return (
    <AppContext.Provider value={{ state, dispatch, selectedScene, selectedObject }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useProject() {
  const { state } = useApp();
  return state.project;
}

export function useSelectedScene() {
  const { selectedScene } = useApp();
  return selectedScene;
}

export function useSelectedObject() {
  const { selectedObject } = useApp();
  return selectedObject;
}
