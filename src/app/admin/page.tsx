"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  Clock,
  CheckCircle2,
  Timer,
  Search,
  ArrowLeft,
  Trash2,
  Sparkles,
  Activity,
  Layers,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatDurationHuman } from "@/lib/time-utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  tier: "FREE" | "PRO" | "ENTERPRISE";
  createdAt: string;
  lastActiveAt: string;
  totalTrackedMs: number;
  stopwatchesCount: number;
  tasksCount: number;
  completedTasksCount: number;
  sessionsCount: number;
  tagsCount: number;
}

interface AdminStats {
  totalUsers: number;
  totalTrackedMs: number;
  totalStopwatches: number;
  activeTimersCount: number;
  totalTasks: number;
  completedTasks: number;
}

interface ActivityItem {
  id: string;
  title: string;
  durationMs: number;
  createdAt: string;
  user: { id: string; name: string; email: string };
  tags: { name: string; color: string; icon: string }[];
  task?: { title: string } | null;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/admin/users?search=${encodeURIComponent(search.trim())}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setRecentActivity(statsData.recentActivity || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === "ADMIN") {
      fetchAdminData();
    }
  }, [user, authLoading]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleUpdateRole = async (userId: string, newRole: "USER" | "ADMIN") => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUpdateTier = async (userId: string, newTier: "FREE" | "PRO" | "ENTERPRISE") => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, tier: newTier } : u))
        );
      }
    } catch (err) {
      console.error("Failed to update tier:", err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${email}" and all their data?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Activity className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-xs">Verifying administrator credentials...</p>
      </div>
    );
  }

  // Non-admin Access Denied View
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-xs text-slate-400 mb-6">
            You must be logged in as an administrator (such as the demo admin account) to view registered users and system analytics.
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Application</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              title="Return to user stopwatch dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-white">DTimer Admin</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    SaaS Console
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">User Registry & Platform Activity Intelligence</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAdminData}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl border border-slate-700 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{user.name}</p>
              <p className="text-[10px] text-emerald-400 font-medium">Administrator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Registered Users */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Users</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Total active accounts</p>
          </div>

          {/* Total Platform Hours */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Tracked Time</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">
              {formatDurationHuman(stats?.totalTrackedMs || 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Across all users & sessions</p>
          </div>

          {/* Active Concurrent Timers */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Live Timers Ticking</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white flex items-center space-x-2">
              <span>{stats?.activeTimersCount || 0}</span>
              {(stats?.activeTimersCount || 0) > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Of {stats?.totalStopwatches || 0} total created
            </p>
          </div>

          {/* Completed Tasks */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tasks Completed</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">
              {stats?.completedTasks || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Of {stats?.totalTasks || 0} total tasks logged
            </p>
          </div>
        </div>

        {/* SECTION 1: USER REGISTRY TABLE */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <span>User Accounts Directory</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {users.length} Users
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Inspect registered users, activity hours, task metrics, and manage account tiers.
              </p>
            </div>

            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Subscription Tier</th>
                    <th className="py-3 px-4">Time Tracked</th>
                    <th className="py-3 px-4">Tasks</th>
                    <th className="py-3 px-4">Stopwatches</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Loading registered user directory...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No user accounts found matching your query.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* User Profile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {u.name ? u.name[0].toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{u.name}</p>
                              <p className="text-[11px] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Dropdown */}
                        <td className="py-3.5 px-4">
                          <select
                            disabled={updatingUserId === u.id}
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                            className={`text-[11px] font-semibold px-2 py-1 rounded-lg border focus:outline-none transition-all ${
                              u.role === "ADMIN"
                                ? "bg-purple-950/40 border-purple-500/40 text-purple-300"
                                : "bg-slate-800 border-slate-700 text-slate-300"
                            }`}
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>

                        {/* Subscription Tier */}
                        <td className="py-3.5 px-4">
                          <select
                            disabled={updatingUserId === u.id}
                            value={u.tier}
                            onChange={(e) => handleUpdateTier(u.id, e.target.value as any)}
                            className={`text-[11px] font-semibold px-2 py-1 rounded-lg border focus:outline-none transition-all ${
                              u.tier === "PRO"
                                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                                : u.tier === "ENTERPRISE"
                                ? "bg-blue-950/40 border-blue-500/40 text-blue-300"
                                : "bg-slate-800 border-slate-700 text-slate-400"
                            }`}
                          >
                            <option value="FREE">FREE</option>
                            <option value="PRO">PRO</option>
                            <option value="ENTERPRISE">ENTERPRISE</option>
                          </select>
                        </td>

                        {/* Total Tracked Time */}
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {formatDurationHuman(u.totalTrackedMs)}
                          <span className="block font-sans text-[10px] text-slate-500 font-normal">
                            {u.sessionsCount} sessions
                          </span>
                        </td>

                        {/* Tasks Done / Total */}
                        <td className="py-3.5 px-4 text-slate-300">
                          <span className="font-semibold text-white">
                            {u.completedTasksCount}
                          </span>{" "}
                          <span className="text-slate-500">/ {u.tasksCount} done</span>
                        </td>

                        {/* Stopwatches */}
                        <td className="py-3.5 px-4 text-slate-300">
                          {u.stopwatchesCount} timers
                        </td>

                        {/* Registered Date */}
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            title="Delete user"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 2: LIVE SYSTEM ACTIVITY STREAM */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Real-Time Activity Audit Feed</span>
            </h2>
            <p className="text-xs text-slate-400">
              Recent productivity blocks and timer sessions recorded across all platform users.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden shadow-lg">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No activity sessions recorded yet.
              </div>
            ) : (
              recentActivity.map((act) => (
                <div key={act.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {act.user.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {act.user.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({act.user.email})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate mt-0.5">
                        Logged: <strong className="text-slate-100">{act.title}</strong>
                        {act.task && (
                          <span className="text-blue-400 ml-1.5">
                            • Linked to task: {act.task.title}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 text-right">
                    {/* Tags */}
                    {act.tags && act.tags.length > 0 && (
                      <div className="hidden sm:flex items-center space-x-1">
                        {act.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px]"
                            style={{
                              backgroundColor: `${t.color}20`,
                              color: t.color,
                              border: `1px solid ${t.color}40`,
                            }}
                          >
                            {t.icon} {t.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-400 block">
                        +{formatDurationHuman(act.durationMs)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(act.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
