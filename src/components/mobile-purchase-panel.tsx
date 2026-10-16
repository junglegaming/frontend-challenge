import { useEffect, useRef, type ReactNode } from "react";

export function MobilePurchasePanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () =>
      document.documentElement.style.setProperty(
        "--mobile-panel-height",
        `${element.getBoundingClientRect().height}px`,
      );
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--mobile-panel-height");
    };
  }, []);
  return (
    <div ref={ref} className={`mobile-purchase-panel ${className}`}>
      {children}
    </div>
  );
}
