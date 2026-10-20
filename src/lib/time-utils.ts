export function formatTime(ms: number, includeMs = false): string {
  if (ms < 0 || isNaN(ms)) ms = 0;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10); // 2-digit ms

  const pad = (n: number, len = 2) => String(n).padStart(len, "0");

  if (hours > 0) {
    if (includeMs) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds)}`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  if (includeMs) {
    return `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatDurationHuman(ms: number): string {
  if (ms < 0 || isNaN(ms)) return "0m";

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

export function calculateCurrentElapsed(
  accumulatedMs: number,
  status: string,
  lastStartedAt: Date | string | null
): number {
  if (status !== "RUNNING" || !lastStartedAt) {
    return accumulatedMs;
  }
  const startTime = new Date(lastStartedAt).getTime();
  const now = Date.now();
  const additional = Math.max(0, now - startTime);
  return accumulatedMs + additional;
}
