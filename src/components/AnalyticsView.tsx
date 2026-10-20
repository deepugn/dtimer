"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Clock,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  TrendingUp,
  Activity,
} from "lucide-react";
import { formatDurationHuman } from "@/lib/time-utils";

interface AnalyticsData {
  kpis: {
    todayMs: number;
    thisWeekMs: number;
    thisMonthMs: number;
    allTimeMs: number;
    totalSessionsCount: number;
    completedTasksCount: number;
    currentStreakDays: number;
  };
  tagBreakdown: {
    name: string;
    color: string;
    durationMs: number;
    durationMinutes: number;
    durationHours: number;
    percentage: number;
    count: number;
  }[];
  dailyTrends: {
    date: string;
    displayDate: string;
    totalMinutes: number;
    [key: string]: any;
  }[];
  hourlyDistribution: {
    hour: number;
    label: string;
    minutesTracked: number;
  }[];
  taskVariance: {
    taskId: string;
    title: string;
    estimatedMinutes: number;
    actualMinutes: number;
    varianceMinutes: number;
  }[];
}

export default function AnalyticsView() {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  if (loading && !data) {
    return (
      <div className="py-20 text-center text-slate-500">
        <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
        <p className="text-xs">Aggregating productivity metrics...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {
    todayMs: 0,
    thisWeekMs: 0,
    thisMonthMs: 0,
    allTimeMs: 0,
    totalSessionsCount: 0,
    completedTasksCount: 0,
    currentStreakDays: 0,
  };

  const tagBreakdown = data?.tagBreakdown || [];
  const dailyTrends = data?.dailyTrends || [];
  const hourlyDistribution = data?.hourlyDistribution || [];
  const taskVariance = data?.taskVariance || [];

  return (
    <div className="space-y-6">
      {/* Timeframe Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Productivity Dashboard</h2>
          <p className="text-xs text-slate-400">Deep time tracking analytics and category breakdowns</p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {(
            [
              { id: "today", label: "Today" },
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
              { id: "all", label: "All Time" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === item.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Time in Period */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {range === "today" ? "Today's Focus" : range === "7d" ? "This Week" : "Tracked Time"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatDurationHuman(
              range === "today"
                ? kpis.todayMs
                : range === "7d"
                ? kpis.thisWeekMs
                : kpis.allTimeMs
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            All-Time: {formatDurationHuman(kpis.allTimeMs)}
          </p>
        </div>

        {/* Focus Streak */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Streak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white flex items-center space-x-1.5">
            <span>{kpis.currentStreakDays}</span>
            <span className="text-sm font-normal text-amber-400">Days Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Consistent daily focus</p>
        </div>

        {/* Total Sessions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sessions</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {kpis.totalSessionsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Logged historical blocks</p>
        </div>

        {/* Tasks Completed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasks Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {kpis.completedTasksCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">With time audits</p>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Tag Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">Time Distribution by Category</h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown of time across tags for selected period</p>

          {tagBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No tagged sessions in this period
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="w-full sm:w-1/2 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tagBreakdown}
                      dataKey="durationMinutes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {tagBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#3B82F6"} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs shadow-xl">
                              <p className="font-bold text-white">{item.name}</p>
                              <p className="text-slate-300">
                                {formatDurationHuman(item.durationMs)} ({item.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Tag Legend List */}
              <div className="w-full sm:w-1/2 mt-4 sm:mt-0 space-y-2 max-h-56 overflow-y-auto pl-2">
                {tagBreakdown.map((t) => (
                  <div key={t.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-slate-200 truncate max-w-[120px]">{t.name}</span>
                    </div>
                    <div className="text-right font-mono text-slate-400">
                      <span className="text-white font-semibold">{t.durationHours}h</span> ({t.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Daily Time Trends (Bar Chart) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">Daily Focus Trends</h3>
          <p className="text-xs text-slate-400 mb-4">Minutes logged per day across categories</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrends}>
                <XAxis dataKey="displayDate" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="m" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs shadow-xl">
                          <p className="font-bold text-white">{label}</p>
                          <p className="text-blue-400 font-semibold">
                            Total: {item.totalMinutes} mins ({Number((item.totalMinutes / 60).toFixed(1))} hrs)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalMinutes" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Focus Hours (Hourly Distribution) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">Peak Productivity Hours</h3>
          <p className="text-xs text-slate-400 mb-4">Time of day when most focus sessions occur</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyDistribution.filter((_, idx) => idx >= 6 && idx <= 23)}>
                <XAxis dataKey="label" stroke="#64748B" fontSize={10} tickLine={false} interval={1} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="m" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs shadow-xl">
                          <p className="font-bold text-white">{item.label}</p>
                          <p className="text-purple-400 font-semibold">
                            {item.minutesTracked} minutes logged
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="minutesTracked" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Variance: Estimated vs Actual */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1">Estimated vs. Actual Task Variance</h3>
          <p className="text-xs text-slate-400 mb-4">Accuracy of time estimates on recently completed tasks</p>

          {taskVariance.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500">
              No completed tasks with estimates yet
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskVariance}>
                  <XAxis
                    dataKey="title"
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => (val.length > 12 ? `${val.slice(0, 10)}...` : val)}
                  />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="m" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs shadow-xl">
                            <p className="font-bold text-white mb-1">{item.title}</p>
                            <p className="text-slate-300">Estimated: {item.estimatedMinutes}m</p>
                            <p className="text-blue-400 font-semibold">Actual: {item.actualMinutes}m</p>
                            <p className={`font-semibold ${item.varianceMinutes > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                              Variance: {item.varianceMinutes > 0 ? `+${item.varianceMinutes}m over` : `${item.varianceMinutes}m under`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="estimatedMinutes" name="Estimated (min)" fill="#64748B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualMinutes" name="Actual (min)" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
