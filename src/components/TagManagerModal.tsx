"use client";

import React, { useState } from "react";
import { X, Tags, Plus, Trash2, Edit2, Check } from "lucide-react";
import { TagItem } from "./StopwatchCard";

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: TagItem[];
  onRefreshTags: () => void;
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#EF4444", // Rose
  "#64748B", // Slate
];

const PRESET_ICONS = ["💼", "📖", "⚡", "👥", "🎓", "✉️", "🏃", "☕", "💻", "🔬", "🎯", "🎨"];

export default function TagManagerModal({
  isOpen,
  onClose,
  tags,
  onRefreshTags,
}: TagManagerModalProps) {
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#3B82F6");
  const [tagIcon, setTagIcon] = useState("🏷️");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tagName.trim(),
          color: tagColor,
          icon: tagIcon,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create tag");
      }

      setTagName("");
      onRefreshTags();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category tag?")) return;
    try {
      await fetch(`/api/tags/${id}`, { method: "DELETE" });
      onRefreshTags();
    } catch (err) {
      console.error("Delete tag error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Tags className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Categories & Tags</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Existing Tags List */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Active Tags ({tags.length})
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-xs">{tag.icon}</span>
                  <span className="text-xs font-medium text-white">{tag.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Create Tag Form */}
        <form onSubmit={handleCreateTag} className="mt-5 pt-4 border-t border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300">Create New Tag</h4>

          <div>
            <input
              type="text"
              required
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Tag name (e.g. Deep Work, Fitness)"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Select Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ICONS.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => setTagIcon(icon)}
                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                    tagIcon === icon
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Select Color</label>
            <div className="flex items-center space-x-2">
              {PRESET_COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setTagColor(color)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    tagColor === color ? "ring-2 ring-white scale-110" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {tagColor === color && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/25 transition-all disabled:opacity-50"
          >
            {submitting ? "Adding Tag..." : "+ Add Category Tag"}
          </button>
        </form>
      </div>
    </div>
  );
}
