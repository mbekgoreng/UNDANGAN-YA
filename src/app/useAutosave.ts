// ============================================================
// Autosave + project persistence hook
// ============================================================
import { useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { saveProject, listProjects, loadProject } from '../storage/db';

const AUTOSAVE_DELAY = 1500; // ms

export function useAutosave() {
  const { state, dispatch } = useApp();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.saveStatus !== 'unsaved') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      dispatch({ type: 'SET_SAVE_STATUS', status: 'saving' });
      try {
        await saveProject(state.project);
        dispatch({ type: 'SET_SAVE_STATUS', status: 'saved' });
      } catch (err) {
        console.error('Autosave failed:', err);
        dispatch({ type: 'SET_SAVE_STATUS', status: 'error' });
      }
    }, AUTOSAVE_DELAY);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.project, state.saveStatus]);
}

export async function loadProjectList() {
  return listProjects();
}

export async function loadProjectById(id: string) {
  return loadProject(id);
}
