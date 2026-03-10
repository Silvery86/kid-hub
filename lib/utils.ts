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

/** Format an ISO time string "HH:MM" for display. */
export const formatTime = (time: string): string => time;

/** Calculate a score percentage (0–100). */
export const calculateScore = (correct: number, total: number): number =>
  total === 0 ? 0 : Math.round((correct / total) * 100);

/** Clamp a number between min and max. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));
