import { shallowReactive } from 'vue';
export interface TabView { id: string; name: string; path: string; preview: boolean; pinned: boolean; dirty: boolean }
export const documentWorkspace = shallowReactive({
  tabs: [] as TabView[], activeId: '', activePath: '', ready: false, busy: false,
  activate: (_id: string) => {},
  close: async (_id: string): Promise<boolean> => false,
  bulkClose: async (_kind: 'others' | 'right' | 'saved' | 'all', _id: string): Promise<void> => {},
  keepOpen: (_id: string) => {}, pin: (_id: string) => {},
  openPath: async (_path: string): Promise<void> => {},
  revealPath: async (_path: string): Promise<void> => {},
});
