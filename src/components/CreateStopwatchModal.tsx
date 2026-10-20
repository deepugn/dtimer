"use client";

import React, { useState, useEffect } from "react";
import { X, Timer, Check, Zap } from "lucide-react";
import { TagItem } from "./StopwatchCard";

interface TaskItem {
  id: string;
  title: string;
  status: string;
}

interface CreateStopwatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    color: string;
    taskId?: string | null;
    tagIds: string[];
    isFocusMode: boolean;
  }) => Promise<void>;
  initialData?: {
    id?: string;
    name: string;
    color: string;
    taskId?: string | null;
    tags: TagItem[];
    isFocusMode: boolean;
  } | null;
  availableTags: TagItem[];
  availableTasks: TaskItem[];
}

const COLOR_PRESETS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#EF4444", // Rose
  "#64748B", // Slate
];

export default function CreateStopwatchModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  availableTags,
  availableTasks,
}: CreateStopwatchModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [taskId, setTaskId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setColor(initialData.color || "#3B82F6");
      setTaskId(initialData.taskId || "");
      setSelectedTagIds(initialData.tags?.map((t) => t.id) || []);
      setIsFocusMode(Boolean(initialData.isFocusMode));
    } else {
      setName("");
      setColor("#3B82F6");
      setTaskId("");
      setSelectedTagIds([]);
      setIsFocusMode(false);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        color,
        taskId: taskId ? taskId : null,
        tagIds: selectedTagIds,
        isFocusMode,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {initialData?.id ? "Edit Stopwatch" : "Create New Stopwatch"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Stopwatch Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Office Work, Reading Book Chapter 4, Sprint Standup"
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Color Theme
            </label>
            <div className="flex items-center space-x-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    color === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Link to Task */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Link to Task (Optional)
            </label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="">No task linked (standalone timer)</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status})
                </option>
              ))}
            </select>
          </div>

          {/* Tags Multi-Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tags & Categories
            </label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
              {availableTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? "ring-2 ring-offset-1 ring-offset-slate-900 font-bold"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: `${tag.color}25`,
                      color: tag.color,
                      border: `1px solid ${tag.color}60`,
                    }}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.name}</span>
                    {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focus Mode Toggle */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Focus Mode (Exclusive Single Timer)</p>
                <p className="text-[11px] text-slate-400">
                  When this timer starts, automatically pause all other active timers
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isFocusMode}
              onChange={(e) => setIsFocusMode(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-700 border-slate-600 cursor-pointer"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {submitting ? "Saving..." : initialData?.id ? "Update Stopwatch" : "Create Stopwatch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
