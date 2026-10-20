"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileCode,
  Tag as TagIcon,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";
import { TagItem } from "./StopwatchCard";
import { formatDurationHuman } from "@/lib/time-utils";

interface SessionItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  notes?: string | null;
  task?: { id: string; title: string; status: string } | null;
  tags: TagItem[];
}

interface UnlimitedHistoryViewProps {
  availableTags: TagItem[];
  availableTasks: { id: string; title: string }[];
}

export default function UnlimitedHistoryView({
  availableTags,
  availableTasks,
}: UnlimitedHistoryViewProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Manual Entry Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualDurationMinutes, setManualDurationMinutes] = useState("45");
  const [manualTaskId, setManualTaskId] = useState("");
  const [manualTagIds, setManualTagIds] = useState<string[]>([]);
  const [manualNotes, setManualNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = async (pageNum = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "15",
      });
      if (search.trim()) params.set("search", search.trim());
      if (selectedTag !== "ALL") params.set("tagId", selectedTag);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/sessions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        setPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotalRecords(data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(1);
  }, [selectedTag, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(1);
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to delete this historical session?")) return;
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSessions(page);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleExport = (format: "csv" | "json") => {
    const params = new URLSearchParams({ format });
    if (selectedTag !== "ALL") params.set("tagId", selectedTag);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    window.open(`/api/sessions/export?${params.toString()}`, "_blank");
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle.trim(),
          durationMinutes: Number(manualDurationMinutes) || 0,
          taskId: manualTaskId || null,
          tagIds: manualTagIds,
          notes: manualNotes.trim() || null,
        }),
      });

      if (res.ok) {
        setIsManualModalOpen(false);
        setManualTitle("");
        setManualDurationMinutes("45");
        setManualNotes("");
        setManualTagIds([]);
        fetchSessions(1);
      }
    } catch (err) {
      console.error("Failed to log manual session:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Unlimited History Ledger</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                {totalRecords} Total Sessions
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Complete historical record of all your work, reading, and productivity sessions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Manual Entry</span>
          </button>

          <button
            onClick={() => handleExport("csv")}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport("json")}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>

        {/* Tag Filter */}
        <div>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Categories / Tags</option>
            {availableTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Title & Context</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4">Linked Task</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading historical sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No session logs found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-white max-w-xs">
                      <p className="truncate">{s.title}</p>
                      {s.notes && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{s.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {s.tags.map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px]"
                            style={{
                              backgroundColor: `${t.color}20`,
                              color: t.color,
                              border: `1px solid ${t.color}40`,
                            }}
                          >
                            <span>{t.icon}</span>
                            <span>{t.name}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {s.task ? (
                        <span className="text-blue-400 font-medium truncate block max-w-[140px]">
                          {s.task.title}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {formatDurationHuman(s.durationMs)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(s.startTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        title="Delete log entry"
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages} ({totalRecords} records)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchSessions(page - 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchSessions(page + 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-4">Log Time Retroactively</h3>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Offline Client Call, Physical Book Reading"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Duration (Minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={manualDurationMinutes}
                  onChange={(e) => setManualDurationMinutes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Link to Task (Optional)
                </label>
                <select
                  value={manualTaskId}
                  onChange={(e) => setManualTaskId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">No task linked</option>
                  {availableTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Summary
                </label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Key accomplishments or session summary..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all"
                >
                  {submitting ? "Saving..." : "Record Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
