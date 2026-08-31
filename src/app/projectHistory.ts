import { createInitialProject, projectReducer, type ProjectAction } from './projectReducer'
import type { ProjectState } from './types'

export interface ProjectHistory {
  past: ProjectState[]
  present: ProjectState
  future: ProjectState[]
}

export type ProjectHistoryAction =
  | { type: 'commit'; action: ProjectAction }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset' }
  | { type: 'load'; project: ProjectState }

export function createProjectHistory(): ProjectHistory {
  return { past: [], present: createInitialProject(), future: [] }
}

export function projectHistoryReducer(
  state: ProjectHistory,
  action: ProjectHistoryAction,
): ProjectHistory {
  switch (action.type) {
    case 'commit': {
      const present = projectReducer(state.present, action.action)
      if (present === state.present) return state
      return { past: [...state.past, state.present], present, future: [] }
    }
    case 'undo': {
      const present = state.past.at(-1)
      if (!present) return state
      return {
        past: state.past.slice(0, -1),
        present,
        future: [state.present, ...state.future],
      }
    }
    case 'redo': {
      const [present, ...future] = state.future
      if (!present) return state
      return { past: [...state.past, state.present], present, future }
    }
    case 'reset':
      return {
        past: [...state.past, state.present],
        present: createInitialProject(),
        future: [],
      }
    case 'load':
      return {
        past: [...state.past, state.present],
        present: action.project,
        future: [],
      }
  }
}
