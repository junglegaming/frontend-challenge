import type { MouseEvent } from "react";
import { useRef, useState } from "react";

export function useNftCarousel(totalPages: number) {
  const containerRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });

  const [activePage, setActivePage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  function changePage(page: number) {
    const container = containerRef.current;

    if (!container || totalPages === 0) return;

    const nextPage = Math.max(0, Math.min(page, totalPages - 1));
    const maxScroll = container.scrollWidth - container.clientWidth;

    container.scrollTo({
      left: maxScroll * (nextPage / Math.max(totalPages - 1, 1)),
      behavior: "smooth",
    });

    setActivePage(nextPage);
  }

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    const container = containerRef.current;

    if (!container || event.button !== 0) return;

    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: container.scrollLeft,
    };

    setIsDragging(true);
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const container = containerRef.current;

    if (!container || !dragRef.current.active) return;

    const distance = event.clientX - dragRef.current.startX;

    if (Math.abs(distance) > 5) {
      dragRef.current.moved = true;
    }

    if (dragRef.current.moved) {
      event.preventDefault();

      container.scrollLeft = dragRef.current.scrollLeft - distance;
    }
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!dragRef.current.moved) return;

    event.preventDefault();
    event.stopPropagation();

    dragRef.current.moved = false;
  }

  function stopDragging() {
    dragRef.current.active = false;
    setIsDragging(false);
  }

  function handleScroll() {
    const container = containerRef.current;

    if (!container) return;

    const maxScroll = container.scrollWidth - container.clientWidth;

    if (maxScroll <= 0 || totalPages <= 1) {
      setActivePage(0);
      return;
    }

    setActivePage(
      Math.min(
        totalPages - 1,
        Math.round((container.scrollLeft / maxScroll) * (totalPages - 1)),
      ),
    );
  }

  return {
    containerRef,
    activePage,
    isDragging,
    changePage,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
    handleScroll,
  };
}
