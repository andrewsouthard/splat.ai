import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Message } from '../types';
import { createBroadcastMiddleware } from './broadcastMiddleware';
import createTauriStoreAdapter from './tauriStoreAdapter';

interface Conversation {
    id: string;
    messages: any[];
    summary: string;
}

interface ConversationStore {
    conversations: Conversation[];
    activeConversationId: string | null;
    addConversation: () => void;
    deleteActiveConversation: () => void;
    setActiveConversationId: (id: string) => void;
    conversationMessages: () => Message[];
    setConversationMessages: (messages: Message[]) => void;
    setConversations: (conversations: Conversation[]) => void;
    updateConversationSummary: (id: string, summary: string) => void;
}


const getBlankConversation = () => ({
    id: crypto.randomUUID(),
    messages: [],
    summary: "New Conversation",
});

const broadcastMiddleware = createBroadcastMiddleware<ConversationStore>({
    channelName: 'conversations-channel'
});
export const useConversationStore = create<ConversationStore>()(
    persist(
        broadcastMiddleware(
            (set, get) => ({
                conversations: [],
                activeConversationId: null,
                addConversation: () => {
                    // Don't do anything if this conversation is empty unless there are no other conversations
                    if (get().conversationMessages().length === 0 && get().conversations.length > 0) return;
                    const newConvo = getBlankConversation();
                    set((state) => ({
                        conversations: [...state.conversations, newConvo],
                        activeConversationId: newConvo.id,
                    }));
                },
                deleteActiveConversation: () => {
                    const oldCoversationIdx = get().conversations.findIndex((c) => c.id === get().activeConversationId);
                    const newConversationIdx = Math.max(oldCoversationIdx - 1, 0)
                    set((state) => ({
                        activeConversationId: state.conversations[newConversationIdx].id,
                        conversations: state.conversations.filter((c, idx) => idx !== oldCoversationIdx),
                    }));
                },
                setActiveConversationId: (id: string) => set({ activeConversationId: id }),
                conversationMessages: () =>
                    get().conversations.find((c) => c.id === get().activeConversationId)
                        ?.messages || [],
                setConversationMessages: (messages: Message[]) => {
                    set((state) => ({
                        conversations: state.conversations.map((convo) =>
                            convo.id === get().activeConversationId
                                ? { ...convo, messages }
                                : convo
                        ),
                    }))
                },
                setConversations: (conversations) => {
                    localStorage.setItem('conversations', JSON.stringify(conversations));
                    set({ conversations });
                },
                updateConversationSummary: (id, summary) =>
                    set((state) => ({
                        conversations: state.conversations.map((convo) =>
                            convo.id === id ? { ...convo, summary } : convo
                        ),
                    })),
            })
        ),
        {
            name: 'conversation-storage',
            storage: createJSONStorage(() => createTauriStoreAdapter('conversation')),
        }
    )
);