import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Message } from '../types';

interface Conversation {
    id: string;
    messages: any[];
    summary: string;
}

interface ConversationStore {
    conversations: Conversation[];
    activeConversationId: string | null;
    addConversation: () => void;
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


export const useConversationStore = create<ConversationStore>()(
    persist(
        (set, get) => ({
            conversations: [],
            activeConversationId: null,
            addConversation: () => {
                // Don't do anything if this conversation is empty
               if(get().conversationMessages().length === 0) return;
                const newConvo = getBlankConversation();
                set((state) => ({
                    conversations: [...state.conversations, newConvo],
                    activeConversationId: newConvo.id,
                }));
            },
            setActiveConversationId: (id: string) => set({ activeConversationId: id }),
            conversationMessages: () =>
                get().conversations.find((c) => c.id === get().activeConversationId)
                    ?.messages || [],
            setConversationMessages: (messages: Message[]) =>
                set((state) => ({
                    conversations: state.conversations.map((convo) =>
                        convo.id === get().activeConversationId
                            ? { ...convo, messages }
                            : convo
                    ),
                })
                ),
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
        }),
        {
            name: 'conversation-storage',
            storage: createJSONStorage(() => window.localStorage),
        }
    )
);