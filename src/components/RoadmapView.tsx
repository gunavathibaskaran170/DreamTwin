"use client";

import clsx from "clsx";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import type { Milestone } from "@/lib/types";

interface RoadmapViewProps {
  milestones: Milestone[];
  onToggle?: (milestoneId: string) => void;
  interactive?: boolean;
}

export default function RoadmapView({
  milestones,
  onToggle,
  interactive = true,
}: RoadmapViewProps) {
  const sorted = [...milestones].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-0">
      {sorted.map((milestone, index) => (
        <div key={milestone.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <button
              type="button"
              disabled={!interactive || !onToggle}
              onClick={() => onToggle?.(milestone.id)}
              className={clsx(
                "shrink-0 transition-all duration-200",
                interactive && onToggle && "hover:scale-110 cursor-pointer",
                !interactive && "cursor-default"
              )}
            >
              {milestone.completed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <Circle className="w-6 h-6 text-white/30 hover:text-dream-400" />
              )}
            </button>
            {index < sorted.length - 1 && (
              <div
                className={clsx(
                  "w-0.5 flex-1 min-h-[2rem] my-1",
                  milestone.completed ? "bg-emerald-500/40" : "bg-white/10"
                )}
              />
            )}
          </div>

          <div
            className={clsx(
              "pb-6 flex-1 group",
              milestone.completed && "opacity-60"
            )}
          >
            <div className="flex items-center gap-2">
              <h4
                className={clsx(
                  "font-medium text-sm",
                  milestone.completed
                    ? "line-through text-white/50"
                    : "text-white"
                )}
              >
                {milestone.title}
              </h4>
              {!milestone.completed && interactive && (
                <ChevronRight className="w-3 h-3 text-dream-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
              {milestone.description}
            </p>
            {milestone.completed && milestone.completedAt && (
              <p className="text-xs text-emerald-400/60 mt-1">
                ✓ Completed {new Date(milestone.completedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
