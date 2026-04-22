import { Loader2, ArrowDown } from "lucide-react";

export default function PullToRefreshIndicator({ pullDistance, refreshing, threshold }) {
  if (!refreshing && pullDistance <= 0) return null;
  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className="fixed top-14 left-0 right-0 flex justify-center z-50 pointer-events-none transition-all"
      style={{ transform: `translateY(${refreshing ? 8 : pullDistance * 0.4}px)`, opacity: refreshing ? 1 : progress }}
    >
      <div className="bg-card border border-border shadow-md rounded-full w-9 h-9 flex items-center justify-center">
        {refreshing ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : (
          <ArrowDown
            className="w-4 h-4 text-primary transition-transform"
            style={{ transform: `rotate(${progress * 180}deg)` }}
          />
        )}
      </div>
    </div>
  );
}