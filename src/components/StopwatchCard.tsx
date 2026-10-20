"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  Save,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Tag as TagIcon,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { formatTime, calculateCurrentElapsed } from "@/lib/time-utils";

export interface LapItem {
  id: string;
  lapNumber: number;
  splitTimeMs: number;
  lapTimeMs: number;
  note?: string | null;
  createdAt: string;
}

export interface TagItem {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface StopwatchItem {
  id: string;
  name: string;
  status: "RUNNING" | "PAUSED" | "STOPPED";
  accumulatedMs: number;
  lastStartedAt: string | null;
  color: string;
  isFocusMode: boolean;
  tags: TagItem[];
  task?: {
    id: string;
    title: string;
    status: string;
    estimatedMinutes?: number | null;
  } | null;
  laps: LapItem[];
}

interface StopwatchCardProps {
  stopwatch: StopwatchItem;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onLap: (id: string) => void;
  onLogSession: (stopwatch: StopwatchItem) => void;
  onEdit: (stopwatch: StopwatchItem) => void;
  onDelete: (id: string) => void;
}

export default function StopwatchCard({
  stopwatch,
  onStart,
  onPause,
  onReset,
  onLap,
  onLogSession,
  onEdit,
  onDelete,
}: StopwatchCardProps) {
  const [elapsed, setElapsed] = useState(
    calculateCurrentElapsed(
      stopwatch.accumulatedMs,
      stopwatch.status,
      stopwatch.lastStartedAt
    )
  );
  const [showMs, setShowMs] = useState(true);
  const [showLaps, setShowLaps] = useState(false);

  // High-precision live ticker
  useEffect(() => {
    let animId: number;

    const tick = () => {
      setElapsed(
        calculateCurrentElapsed(
          stopwatch.accumulatedMs,
          stopwatch.status,
          stopwatch.lastStartedAt
        )
      );
      if (stopwatch.status === "RUNNING") {
        animId = requestAnimationFrame(tick);
      }
    };

    if (stopwatch.status === "RUNNING") {
      animId = requestAnimationFrame(tick);
    } else {
      setElapsed(
        calculateCurrentElapsed(
          stopwatch.accumulatedMs,
          stopwatch.status,
          stopwatch.lastStartedAt
        )
      );
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [stopwatch.status, stopwatch.accumulatedMs, stopwatch.lastStartedAt]);

  const isRunning = stopwatch.status === "RUNNING";

  return (
    <div
      className={`relative bg-slate-900 border rounded-2xl p-5 transition-all shadow-xl ${
        isRunning
          ? "border-blue-500/80 running-glow bg-slate-900/90"
          : "border-slate-800 hover:border-slate-700 bg-slate-900/60"
      }`}
      style={{
        borderTopColor: stopwatch.color || "#3B82F6",
        borderTopWidth: "4px",
      }}
    >
      {/* Header: Name, Task Link, Edit/Delete Menu */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white truncate tracking-tight">
              {stopwatch.name}
            </h3>
            {stopwatch.isFocusMode && (
              <span
                title="Focus Mode active: starting this timer pauses all other timers"
                className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold"
              >
                <Zap className="w-2.5 h-2.5" />
                <span>Focus</span>
              </span>
            )}
          </div>

          {/* Linked Task */}
          {stopwatch.task ? (
            <div className="flex items-center space-x-1.5 mt-1 text-xs text-blue-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Task: {stopwatch.task.title}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">Standalone timer</p>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(stopwatch)}
            title="Edit stopwatch"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(stopwatch.id)}
            title="Delete stopwatch"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tags */}
      {stopwatch.tags && stopwatch.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {stopwatch.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                border: `1px solid ${tag.color}40`,
              }}
            >
              <span>{tag.icon}</span>
              <span>{tag.name}</span>
            </span>
          ))}
        </div>
      )}

      {/* Main Timer Display */}
      <div className="my-5 py-4 px-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-center relative overflow-hidden">
        {/* Subtle accent bar in background */}
        <div
          className="absolute inset-x-0 bottom-0 h-1 opacity-60"
          style={{ backgroundColor: stopwatch.color || "#3B82F6" }}
        />

        <div
          onClick={() => setShowMs(!showMs)}
          title="Click to toggle millisecond display"
          className="cursor-pointer select-none font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-white transition-transform active:scale-95"
        >
          {formatTime(elapsed, showMs)}
        </div>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
          {showMs ? "Click to hide ms" : "Click to show ms"}
        </p>
      </div>

      {/* Primary Control Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {isRunning ? (
          <button
            onClick={() => onPause(stopwatch.id)}
            className="col-span-2 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/20 transition-all hover:scale-[1.02]"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={() => onStart(stopwatch.id)}
            className="col-span-2 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{elapsed > 0 ? "Resume" : "Start"}</span>
          </button>
        )}

        <button
          onClick={() => onLap(stopwatch.id)}
          disabled={elapsed === 0}
          title="Record lap split"
          className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <Flag className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Lap</span>
        </button>

        <button
          onClick={() => onReset(stopwatch.id)}
          disabled={elapsed === 0}
          title="Reset timer to 0"
          className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Save Session to Unlimited History Action */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => onLogSession(stopwatch)}
          disabled={elapsed === 0}
          className="flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold py-1 px-2 rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save to History & Reset</span>
        </button>

        {stopwatch.laps && stopwatch.laps.length > 0 && (
          <button
            onClick={() => setShowLaps(!showLaps)}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 py-1 px-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span>{stopwatch.laps.length} Laps</span>
            {showLaps ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Expandable Laps Table */}
      {showLaps && stopwatch.laps && stopwatch.laps.length > 0 && (
        <div className="mt-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 grid grid-cols-4 pb-1.5 border-b border-slate-800">
            <span>Lap</span>
            <span>Split</span>
            <span>Lap Time</span>
            <span>Note</span>
          </div>
          <div className="divide-y divide-slate-800/60 font-mono text-xs">
            {stopwatch.laps.map((lap) => (
              <div key={lap.id} className="grid grid-cols-4 py-1.5 items-center text-slate-300">
                <span className="font-sans font-medium text-slate-400">#{lap.lapNumber}</span>
                <span className="text-white">{formatTime(lap.splitTimeMs, true)}</span>
                <span className="text-emerald-400">+{formatTime(lap.lapTimeMs, true)}</span>
                <span className="font-sans text-[11px] text-slate-400 truncate">
                  {lap.note || "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
