"use client";

import React, { useState } from "react";
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  Play,
  Trash2,
  Edit2,
  Check,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { TagItem } from "./StopwatchCard";
import { formatDurationHuman } from "@/lib/time-utils";

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  estimatedMinutes?: number | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
  completedAt?: string | null;
  totalTrackedMs?: number;
  tags: TagItem[];
  stopwatches?: {
    id: string;
    name: string;
    status: string;
    accumulatedMs: number;
    lastStartedAt: string | null;
  }[];
}

interface TaskBoardProps {
  tasks: TaskItem[];
  availableTags: TagItem[];
  onCreateTask: (data: any) => Promise<void>;
  onUpdateTask: (id: string, data: any) => Promise<void>;
  onCompleteTask: (id: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onStartStopwatchForTask: (task: TaskItem) => void;
}

export default function TaskBoard({
  tasks,
  availableTags,
  onCreateTask,
  onUpdateTask,
  onCompleteTask,
  onDeleteTask,
  onStartStopwatchForTask,
}: TaskBoardProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("60");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setEstimatedMinutes("60");
    setPriority("MEDIUM");
    setDueDate("");
    setSelectedTagIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setEstimatedMinutes(String(task.estimatedMinutes || "0"));
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setSelectedTagIds(task.tags.map((t) => t.id));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        estimatedMinutes: Number(estimatedMinutes) || 0,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        tagIds: selectedTagIds,
      };

      if (editingTask) {
        await onUpdateTask(editingTask.id, payload);
      } else {
        await onCreateTask(payload);
      }
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === "ALL") return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === st
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {st === "ALL"
                ? "All Tasks"
                : st === "IN_PROGRESS"
                ? "In Progress"
                : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* New Task Button */}
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No tasks found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create tasks like Office Work presentations, book chapters, or client deliverables to track your time against estimates.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all"
          >
            + Create First Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === "COMPLETED";
            const actualMinutes = Math.round((task.totalTrackedMs || 0) / 60000);
            const estMinutes = task.estimatedMinutes || 0;
            const progressPercent = estMinutes > 0 ? Math.min(100, (actualMinutes / estMinutes) * 100) : 0;

            return (
              <div
                key={task.id}
                className={`bg-slate-900/80 border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-lg ${
                  isCompleted
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  {/* Priority & Status Bar */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        task.priority === "HIGH"
                          ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          : task.priority === "MEDIUM"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-slate-700/30 text-slate-400 border-slate-700/50"
                      }`}
                    >
                      {task.priority} Priority
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h4
                    className={`text-base font-semibold leading-snug tracking-tight ${
                      isCompleted ? "line-through text-slate-400" : "text-white"
                    }`}
                  >
                    {task.title}
                  </h4>

                  {/* Description */}
                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {task.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
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

                  {/* Time Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Tracked: <strong className="text-slate-200">{formatDurationHuman(task.totalTrackedMs || 0)}</strong></span>
                      </span>
                      <span>Est: {estMinutes}m</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          progressPercent > 100
                            ? "bg-rose-500"
                            : isCompleted
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {!isCompleted ? (
                    <>
                      <button
                        onClick={() => onStartStopwatchForTask(task)}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Timer</span>
                      </button>

                      <button
                        onClick={() => onCompleteTask(task.id)}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs text-emerald-400 font-medium bg-emerald-950/40 py-1.5 px-3 rounded-xl border border-emerald-500/20">
                      <span className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Task Completed</span>
                      </span>
                      <button
                        onClick={() => onUpdateTask(task.id, { status: "IN_PROGRESS" })}
                        className="text-slate-400 hover:text-slate-200 underline text-[11px]"
                      >
                        Reopen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read Chapter 5 of DDIA, Finish Quarterly Report"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context or key checklist items..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estimated Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assign Tags
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        type="button"
                        key={tag.id}
                        onClick={() =>
                          setSelectedTagIds((prev) =>
                            prev.includes(tag.id)
                              ? prev.filter((id) => id !== tag.id)
                              : [...prev, tag.id]
                          )
                        }
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? "ring-2 ring-white font-bold"
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

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all"
                >
                  {submitting ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
