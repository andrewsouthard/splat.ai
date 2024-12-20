import { useEffect } from 'react';
import { useConversationStore } from '../store/conversationStore';
import { useShallow } from 'zustand/shallow';

export function useCommandN() {
  const { addConversation} = useConversationStore(
    useShallow((state) => ({
      addConversation: state.addConversation,
    }))
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'n') {
        e.preventDefault();
        addConversation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
