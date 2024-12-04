import { ReactNode, useEffect, useRef, useState } from "react";
import { Message } from "../types";

interface ScrollContainerProps {
  children: ReactNode;
  messages: Message[];
  className?: string;
}

export function ScrollContainer({
  children,
  messages,
  className = "",
}: ScrollContainerProps) {
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldAutoScroll && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        setShouldAutoScroll(false);
      } else {
        const container = e.currentTarget as HTMLElement;
        const isAtBottom =
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
          10;

        if (isAtBottom) {
          setShouldAutoScroll(true);
        }
      }
    };

    const scrollContainer = document.querySelector(".overflow-y-auto");
    if (scrollContainer) {
      scrollContainer.addEventListener("wheel", handleScroll as EventListener);

      return () => {
        scrollContainer.removeEventListener(
          "wheel",
          handleScroll as EventListener
        );
      };
    }
  }, []);

  return (
    <div className={`overflow-y-auto h-screen ${className}`}>
      {children}
      <div ref={chatEndRef} />
    </div>
  );
}
