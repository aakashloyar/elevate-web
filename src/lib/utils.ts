import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDuration(seconds?: number | null) {
  if (seconds === undefined || seconds === null || !Number.isFinite(seconds) || seconds < 0) return "—";
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes} min ${String(remainingSeconds).padStart(2, "0")} sec`;
}

export const minutesFromSeconds = formatDuration;
