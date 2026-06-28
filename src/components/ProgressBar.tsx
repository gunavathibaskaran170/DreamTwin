import clsx from "clsx";

interface ProgressBarProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  progress,
  size = "md",
  showLabel = true,
  className,
}: ProgressBarProps) {
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className={clsx("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5 text-xs text-white/60">
          <span>Progress</span>
          <span className="text-dream-300 font-medium">{progress}%</span>
        </div>
      )}
      <div className={clsx("w-full rounded-full bg-white/10 overflow-hidden", heights[size])}>
        <div
          className={clsx(
            "h-full rounded-full bg-gradient-to-r from-dream-500 to-dream-400 transition-all duration-700 ease-out",
            progress === 100 && "from-emerald-500 to-emerald-400"
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
