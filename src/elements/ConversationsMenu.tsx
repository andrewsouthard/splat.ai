import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/shallow";
import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import clsx from "clsx";
import SearchBox from "./SearchBox";

export default function ConversationsMenu() {
  const {
    conversations,
    setActiveConversationId,
    activeConversationId,
    addConversation,
  } = useConversationStore(
    useShallow((state) => ({
      conversations: state.conversations,
      setActiveConversationId: state.setActiveConversationId,
      activeConversationId: state.activeConversationId,
      addConversation: state.addConversation,
    }))
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<number>();
  const searchConversationsRef = useRef<HTMLInputElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolling(true);
    if (scrollTimerRef?.current) clearTimeout(scrollTimerRef.current);

    scrollTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 2000);
  };

  useEffect(() => {
    const unlistenAdd = listen("new-conversation", () => {
      addConversation();
    });
    const unlistenFindAll = listen("find-all", () => {
      focusSearchAll();
    });
    return () => {
      unlistenAdd.then((unlistenFn) => unlistenFn());
      unlistenFindAll.then((unlistenFn) => unlistenFn());
    };
  }, []);

  const focusSearchAll = () => {
    searchConversationsRef.current?.focus();
  };

  useEffect(() => {
    if (conversations.length === 0) {
      addConversation();
    }
  }, [conversations]);

  const onConversationClick = (id: string) => {
    setActiveConversationId(id);
  };

  const filteredConversations =
    searchQuery.length > 2
      ? conversations.filter((convo) =>
          convo.messages
            .map((m) => m.content.toLowerCase())
            .join("")
            .includes(searchQuery.toLowerCase())
        )
      : conversations;

  return (
    <div
      className={clsx(
        `z-10 bg-gray-100 overflow-y-scroll max-w-[280px]`,
        "h-full w-full",
        {
          "scrollbar-hide": !isScrolling,
        }
      )}
      onScroll={handleScroll}
    >
      <div className="sticky top-[0px] p-2 px-3 z-10 bg-gray-100">
        <SearchBox
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={setSearchQuery}
          ref={searchConversationsRef}
        />
      </div>
      <div className="shadow-sm">
        {filteredConversations
          .map((convo, index) => (
            <div className={`w-full px-3 mb-3`} key={`${index}`}>
              <button
                onClick={() => onConversationClick(convo.id)}
                className={clsx(
                  `w-full rounded p-3 text-left flex items-center gap-2`,
                  {
                    "bg-blue-500 text-white": convo.id === activeConversationId,
                    "bg-white": convo.id !== activeConversationId,
                  }
                )}
              >
                <div className="flex-grow">{convo.summary}</div>
              </button>
            </div>
          ))
          .reverse()}
      </div>
    </div>
  );
}
