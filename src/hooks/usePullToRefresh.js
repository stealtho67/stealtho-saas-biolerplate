import { useState, useEffect, useRef } from "react";

export function usePullToRefresh(onRefresh, containerRef) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const THRESHOLD = 70;

  useEffect(() => {
    const el = containerRef?.current || window;

    const onTouchStart = (e) => {
      const scrollTop = containerRef?.current
        ? containerRef.current.scrollTop
        : window.scrollY;
      if (scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      const dist = e.touches[0].clientY - startY.current;
      if (dist > 0 && dist < 150) {
        setPulling(true);
        setPullDistance(dist);
      }
    };

    const onTouchEnd = async () => {
      if (pullDistance >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPullDistance(0);
        setPulling(false);
        await onRefresh();
        setRefreshing(false);
      } else {
        setPulling(false);
        setPullDistance(0);
      }
      startY.current = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance, refreshing, onRefresh]);

  return { pulling, pullDistance, refreshing, threshold: THRESHOLD };
}