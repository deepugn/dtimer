"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Timer,
  CheckSquare,
  History,
  BarChart3,
  Tags,
  Play,
  Pause,
  RotateCcw,
  Plus,
  LogOut,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  activeTab: "stopwatches" | "tasks" | "history" | "analytics";
  setActiveTab: (tab: "stopwatches" | "tasks" | "history" | "analytics") => void;
  activeTimersCount: number;
  onOpenNewStopwatch: () => void;
  onOpenNewTask: () => void;
  onOpenTagManager: () => void;
  onBatchAction: (action: "START_ALL" | "PAUSE_ALL" | "RESET_ALL") => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  activeTimersCount,
  onOpenNewStopwatch,
  onOpenNewTask,
  onOpenTagManager,
  onBatchAction,
}: NavbarProps) {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-white tracking-tight">DTimer</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Multi-Stopwatch & Productivity Intelligence</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab("stopwatches")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "stopwatches"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Stopwatches</span>
              {activeTimersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {activeTimersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "tasks"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tasks & Projects</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "history"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Unlimited History</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "analytics"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboards</span>
            </button>
          </nav>

          {/* Quick Actions & User Profile */}
          <div className="flex items-center space-x-2.5">
            {/* Global Controls */}
            <div className="hidden lg:flex items-center space-x-1 bg-slate-800/60 p-1 rounded-lg border border-slate-700/60">
              <button
                onClick={() => onBatchAction("START_ALL")}
                title="Start all stopwatches"
                className="p-1.5 text-emerald-400 hover:bg-slate-700 rounded transition-all"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onBatchAction("PAUSE_ALL")}
                title="Pause all stopwatches"
                className="p-1.5 text-amber-400 hover:bg-slate-700 rounded transition-all"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onBatchAction("RESET_ALL")}
                title="Reset all stopwatches"
                className="p-1.5 text-rose-400 hover:bg-slate-700 rounded transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tags Button */}
            <button
              onClick={onOpenTagManager}
              title="Manage categories & tags"
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all text-xs flex items-center space-x-1.5"
            >
              <Tags className="w-4 h-4 text-purple-400" />
              <span className="hidden xl:inline">Tags</span>
            </button>

            {/* Admin Console Link (Visible only to ADMIN users) */}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center space-x-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm"
                title="Go to SaaS Admin Console"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* New Stopwatch Button */}
            <button
              onClick={onOpenNewStopwatch}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Timer</span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 p-1.5 pr-2.5 rounded-xl transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center font-bold text-xs text-white">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[100px] truncate">
                  {user?.name || "User"}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2.5 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <div className="mt-1.5 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                      <Sparkles className="w-3 h-3" />
                      <span>{user?.tier || "PRO"} PLAN</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    {user?.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-purple-300 hover:bg-purple-500/10 transition-colors mb-0.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span>Admin Console</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("stopwatches")}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              activeTab === "stopwatches" ? "text-blue-400 font-bold" : "text-slate-400"
            }`}
          >
            <Timer className="w-4 h-4 mb-1" />
            <span>Timers</span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              activeTab === "tasks" ? "text-blue-400 font-bold" : "text-slate-400"
            }`}
          >
            <CheckSquare className="w-4 h-4 mb-1" />
            <span>Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              activeTab === "history" ? "text-blue-400 font-bold" : "text-slate-400"
            }`}
          >
            <History className="w-4 h-4 mb-1" />
            <span>History</span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              activeTab === "analytics" ? "text-blue-400 font-bold" : "text-slate-400"
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-1" />
            <span>Dashboards</span>
          </button>
        </div>
      </div>
    </header>
  );
}
