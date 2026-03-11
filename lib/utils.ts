import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely, resolving conflicts. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

/** Format a Date to Vietnamese locale (e.g. "Thứ Hai, 10/03"). */
export const formatDate = (date: Date): string =>
  date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });

/**
 * Format an "HH:MM" 24-hour time string for display.
 * Output example: "08:30" → "8:30 SA" (Vietnamese AM/PM) or "14:45" → "2:45 CH"
 * Falls back to the raw string if parsing fails.
 */
export const formatTime = (time: string): string => {
  const parts = time.split(':');
  if (parts.length !== 2) return time;
  const [hStr, mStr] = parts;
  const hours = parseInt(hStr ?? '0', 10);
  const minutes = parseInt(mStr ?? '0', 10);
  if (isNaN(hours) || isNaN(minutes)) return time;
  const d = new Date(2000, 0, 1, hours, minutes);
  return d.toLocaleTimeString('vi-VN', { hour: 'numeric', minute: '2-digit', hour12: true });
};

/** Calculate a score percentage (0–100). */
export const calculateScore = (correct: number, total: number): number =>
  total === 0 ? 0 : Math.round((correct / total) * 100);

/** Clamp a number between min and max. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));
