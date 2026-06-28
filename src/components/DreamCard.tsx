"use client";

import Link from "next/link";
import { ArrowRight, Clock, Trash2 } from "lucide-react";
import clsx from "clsx";
import ProgressBar from "./ProgressBar";
import { calculateProgress } from "@/lib/utils";
import type { Dream } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  captured: "bg-yellow-500/20 text-yellow-400",
  expanded: "bg-blue-500/20 text-blue-400",
  refined: "bg-dream-500/20 text-dream-400",
  active: "bg-emerald-500/20 text-emerald-400",
  completed: "bg-emerald-500/20 text-emerald-400",
};

interface DreamCardProps {
  dream: Dream;
  onDelete?: (id: string) => void;
}

export default function DreamCard({ dream, onDelete }: DreamCardProps) {
  const progress = dream.roadmap
    ? calculateProgress(dream.roadmap.milestones)
    : 0;

  return (
    <Link href={`/dreams/${dream.id}`}>
      <div className="glass rounded-2xl p-5 hover:border-dream-500/30 transition-all duration-300 group cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate group-hover:text-dream-300 transition-colors">
              {dream.title}
            </h3>
            <p className="text-xs text-white/40 mt-0.5 line-clamp-2">
              {dream.rawInput}
            </p>
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(dream.id);
              }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span
            className={clsx(
              "text-[10px] font-medium px-2 py-0.5 rounded-full capitalize",
              STATUS_COLORS[dream.status] ?? "bg-white/10 text-white/50"
            )}
          >
            {dream.status}
          </span>
          <span className="text-[10px] text-white/30 capitalize">{dream.inputType}</span>
          <span className="text-[10px] text-white/30 capitalize">{dream.personaStyle}</span>
        </div>

        {dream.roadmap && (
          <div className="mt-auto">
            <ProgressBar progress={progress} size="sm" />
            <div className="flex items-center justify-between mt-2 text-[10px] text-white/30">
              <span>
                {dream.roadmap.milestones.filter((m) => m.completed).length}/
                {dream.roadmap.milestones.length} milestones
              </span>
              {dream.roadmap.estimatedDuration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {dream.roadmap.estimatedDuration}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 mt-3 text-xs text-dream-400 opacity-0 group-hover:opacity-100 transition-opacity">
          View roadmap <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}
