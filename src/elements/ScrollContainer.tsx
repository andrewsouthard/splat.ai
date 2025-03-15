import { ReactNode, useEffect, useRef, useState } from "react";
import { Message } from "../types";
import debounce from "lodash-es/debounce";

interface ScrollContainerProps {
  children: ReactNode;
  messages: Message[];
  className?: string;
}

export default function ScrollContainer({
  children,
  messages,
  className = "",
}: ScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = debounce(() => {
    if (containerRef.current) {
      // Use requestAnimationFrame to ensure we get the final scroll height
      requestAnimationFrame(() => {
        // Add a small timeout to ensure all content is rendered
        setTimeout(() => {
          containerRef.current?.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: "instant",
          });
        }, 50);
      });
    }
  });

  useEffect(() => {
    if (shouldAutoScroll) scrollToBottom();
  }, [messages, containerRef.current?.scrollHeight]);

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

    const scrollContainer = containerRef.current;
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
    <div
      ref={containerRef}
      className={`overflow-y-scroll h-full scroll-smooth w-full ${className}`}
    >
      {children}
    </div>
  );
}
