import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createBroadcastMiddleware } from './broadcastMiddleware';
import createTauriStoreAdapter from './tauriStoreAdapter';

interface Project {
    id: string
    name: string
    model: string
    contextLength: number
    systemPrompt: string
}

interface ProjectStore {
    projects: Project[]
    selectedProjectId: string | null
    addProject: (project: Omit<Project, 'id'>, callback?: (id: string) => void) => void
    removeProject: (id: string) => void
    updateProject: (id: string, updates: Partial<Omit<Project, 'id'>>) => void
    selectProject: (id: string) => void
}

const broadcastMiddleware = createBroadcastMiddleware<ProjectStore>({
    channelName: 'project-channel'
});

export const useProjectStore = create<ProjectStore>()(
    persist<ProjectStore>(
        broadcastMiddleware(
            (set) => ({
                projects: [],
                selectedProjectId: null,
                addProject: (project, callback) => {
                    const newId = crypto.randomUUID()
                    set((state) => ({
                        projects: [...state.projects, { ...project, id: newId }],
                    }));
                    if (callback) callback(newId);
                },
                removeProject: (id) => set((state) => ({
                    projects: state.projects.filter(p => p.id !== id),
                    selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId
                })),
                updateProject: (id, updates) => set((state) => ({
                    projects: state.projects.map(project =>
                        project.id === id ? { ...project, ...updates } : project
                    )
                })),
                selectProject: (id) => set({ selectedProjectId: id })
            })
        ),
        {
            name: 'projects-storage',
            storage: createJSONStorage(() => createTauriStoreAdapter('projects')),
        }
    )
);