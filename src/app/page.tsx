"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Timer,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Filter,
  CheckCircle2,
  Tags as TagsIcon,
  Activity,
  Layers,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import StopwatchCard, { StopwatchItem, TagItem } from "@/components/StopwatchCard";
import CreateStopwatchModal from "@/components/CreateStopwatchModal";
import TaskBoard, { TaskItem } from "@/components/TaskBoard";
import UnlimitedHistoryView from "@/components/UnlimitedHistoryView";
import AnalyticsView from "@/components/AnalyticsView";
import TagManagerModal from "@/components/TagManagerModal";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"stopwatches" | "tasks" | "history" | "analytics">("stopwatches");
  const [stopwatches, setStopwatches] = useState<StopwatchItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals
  const [isCreateStopwatchOpen, setIsCreateStopwatchOpen] = useState(false);
  const [editingStopwatch, setEditingStopwatch] = useState<StopwatchItem | null>(null);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  // Filter on stopwatches page
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("ALL");
  const [focusFilter, setFocusFilter] = useState<boolean>(false);

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch initial data
  const loadAllData = async () => {
    if (!user) return;
    try {
      const [swRes, tasksRes, tagsRes] = await Promise.all([
        fetch("/api/stopwatches"),
        fetch("/api/tasks"),
        fetch("/api/tags"),
      ]);

      if (swRes.ok) {
        const swData = await swRes.json();
        setStopwatches(swData.stopwatches || []);
      }
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData.tags || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // Stopwatch actions
  const handleStartStopwatch = async (id: string) => {
    // Optimistic update
    setStopwatches((prev) =>
      prev.map((sw) => {
        if (sw.id === id) {
          return { ...sw, status: "RUNNING", lastStartedAt: new Date().toISOString() };
        }
        if (sw.isFocusMode) {
          return { ...sw, status: "PAUSED", lastStartedAt: null };
        }
        return sw;
      })
    );

    try {
      const res = await fetch(`/api/stopwatches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START" }),
      });
      if (res.ok) {
        const data = await res.json();
        setStopwatches((prev) =>
          prev.map((sw) => (sw.id === id ? data.stopwatch : sw))
        );
      }
    } catch (err) {
      console.error("Failed to start stopwatch:", err);
      loadAllData();
    }
  };

  const handlePauseStopwatch = async (id: string) => {
    try {
      const res = await fetch(`/api/stopwatches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PAUSE" }),
      });
      if (res.ok) {
        const data = await res.json();
        setStopwatches((prev) =>
          prev.map((sw) => (sw.id === id ? data.stopwatch : sw))
        );
      }
    } catch (err) {
      console.error("Failed to pause stopwatch:", err);
    }
  };

  const handleResetStopwatch = async (id: string) => {
    try {
      const res = await fetch(`/api/stopwatches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET" }),
      });
      if (res.ok) {
        const data = await res.json();
        setStopwatches((prev) =>
          prev.map((sw) => (sw.id === id ? data.stopwatch : sw))
        );
      }
    } catch (err) {
      console.error("Failed to reset stopwatch:", err);
    }
  };

  const handleLapStopwatch = async (id: string) => {
    try {
      const res = await fetch(`/api/stopwatches/${id}/lap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setStopwatches((prev) =>
          prev.map((sw) => {
            if (sw.id === id) {
              return { ...sw, laps: [data.lap, ...sw.laps] };
            }
            return sw;
          })
        );
      }
    } catch (err) {
      console.error("Failed to record lap:", err);
    }
  };

  const handleLogSession = async (stopwatch: StopwatchItem) => {
    try {
      const res = await fetch(`/api/stopwatches/${stopwatch.id}/log-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: stopwatch.name,
          resetTimer: true,
        }),
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error("Failed to log session:", err);
    }
  };

  const handleDeleteStopwatch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this stopwatch?")) return;
    try {
      const res = await fetch(`/api/stopwatches/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStopwatches((prev) => prev.filter((sw) => sw.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete stopwatch:", err);
    }
  };

  const handleCreateOrUpdateStopwatch = async (data: any) => {
    try {
      if (editingStopwatch) {
        const res = await fetch(`/api/stopwatches/${editingStopwatch.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const updated = await res.json();
          setStopwatches((prev) =>
            prev.map((sw) => (sw.id === editingStopwatch.id ? updated.stopwatch : sw))
          );
        }
      } else {
        const res = await fetch("/api/stopwatches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const created = await res.json();
          setStopwatches((prev) => [created.stopwatch, ...prev]);
        }
      }
    } catch (err) {
      console.error("Failed to save stopwatch:", err);
    }
  };

  const handleBatchAction = async (action: "START_ALL" | "PAUSE_ALL" | "RESET_ALL") => {
    try {
      const res = await fetch("/api/stopwatches/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setStopwatches(data.stopwatches);
      }
    } catch (err) {
      console.error("Batch action failed:", err);
    }
  };

  // Task actions
  const handleCreateTask = async (data: any) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleUpdateTask = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/complete`, {
        method: "POST",
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error("Failed to complete task:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleStartStopwatchForTask = async (task: TaskItem) => {
    // Check if there is an existing stopwatch linked to this task
    let existing = stopwatches.find((sw) => sw.task?.id === task.id);
    if (!existing) {
      // Create new stopwatch for this task
      const primaryTagId = task.tags[0]?.id;
      const res = await fetch("/api/stopwatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: task.title,
          taskId: task.id,
          color: task.tags[0]?.color || "#3B82F6",
          tagIds: primaryTagId ? [primaryTagId] : [],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        existing = created.stopwatch;
        setStopwatches((prev) => [created.stopwatch, ...prev]);
      }
    }

    if (existing) {
      setActiveTab("stopwatches");
      handleStartStopwatch(existing.id);
    }
  };

  if (authLoading || (user && loadingData)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Activity className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-xs font-semibold tracking-wide uppercase">Initializing DTimer Cloud...</p>
      </div>
    );
  }

  if (!user) return null;

  const activeTimersCount = stopwatches.filter((s) => s.status === "RUNNING").length;

  const filteredStopwatches = stopwatches.filter((sw) => {
    if (selectedTagFilter !== "ALL") {
      const hasTag = sw.tags.some((t) => t.id === selectedTagFilter);
      if (!hasTag) return false;
    }
    if (focusFilter && !sw.isFocusMode) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeTimersCount={activeTimersCount}
        onOpenNewStopwatch={() => {
          setEditingStopwatch(null);
          setIsCreateStopwatchOpen(true);
        }}
        onOpenNewTask={() => setActiveTab("tasks")}
        onOpenTagManager={() => setIsTagManagerOpen(true)}
        onBatchAction={handleBatchAction}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VIEW 1: STOPWATCHES */}
        {activeTab === "stopwatches" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Filter & Summary Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>Active Stopwatches</span>
                  {activeTimersCount > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold animate-pulse">
                      {activeTimersCount} Ticking
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-400">
                  Run multiple concurrent or focused stopwatches for office work, reading, and study sessions.
                </p>
              </div>

              {/* Tag Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
                  <select
                    value={selectedTagFilter}
                    onChange={(e) => setSelectedTagFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 border-none focus:outline-none pr-2 py-1"
                  >
                    <option value="ALL" className="bg-slate-900">All Tags ({tags.length})</option>
                    {tags.map((t) => (
                      <option key={t.id} value={t.id} className="bg-slate-900">
                        {t.icon} {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setFocusFilter(!focusFilter)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    focusFilter
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Focus Mode Only</span>
                </button>
              </div>
            </div>

            {/* Stopwatch Cards Grid */}
            {filteredStopwatches.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <Timer className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-300">No stopwatches found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Create your first stopwatch for office work, book reading, or coding focus sessions.
                </p>
                <button
                  onClick={() => {
                    setEditingStopwatch(null);
                    setIsCreateStopwatchOpen(true);
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all"
                >
                  + Create New Stopwatch
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStopwatches.map((sw) => (
                  <StopwatchCard
                    key={sw.id}
                    stopwatch={sw}
                    onStart={handleStartStopwatch}
                    onPause={handlePauseStopwatch}
                    onReset={handleResetStopwatch}
                    onLap={handleLapStopwatch}
                    onLogSession={handleLogSession}
                    onEdit={(item) => {
                      setEditingStopwatch(item);
                      setIsCreateStopwatchOpen(true);
                    }}
                    onDelete={handleDeleteStopwatch}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: TASKS */}
        {activeTab === "tasks" && (
          <div className="animate-in fade-in duration-150">
            <TaskBoard
              tasks={tasks}
              availableTags={tags}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onCompleteTask={handleCompleteTask}
              onDeleteTask={handleDeleteTask}
              onStartStopwatchForTask={handleStartStopwatchForTask}
            />
          </div>
        )}

        {/* VIEW 3: UNLIMITED HISTORY */}
        {activeTab === "history" && (
          <div className="animate-in fade-in duration-150">
            <UnlimitedHistoryView availableTags={tags} availableTasks={tasks} />
          </div>
        )}

        {/* VIEW 4: ANALYTICS DASHBOARD */}
        {activeTab === "analytics" && (
          <div className="animate-in fade-in duration-150">
            <AnalyticsView />
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateStopwatchModal
        isOpen={isCreateStopwatchOpen}
        onClose={() => {
          setIsCreateStopwatchOpen(false);
          setEditingStopwatch(null);
        }}
        onSubmit={handleCreateOrUpdateStopwatch}
        initialData={editingStopwatch}
        availableTags={tags}
        availableTasks={tasks}
      />

      <TagManagerModal
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        tags={tags}
        onRefreshTags={loadAllData}
      />
    </div>
  );
}
