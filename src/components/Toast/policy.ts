import type { ToastMessage, ToastTone } from './message';

const BASE_MS = 4000;
const ACTION_MS = 8000;
const MAX_MS = 8000;
const WORDS_IN_BASE = 8;
const WORDS_PER_SECOND = 10;

// How long a toast stays by itself; null keeps it until it is closed or resolved.
export const toastDuration = ({ tone, text, action }: ToastMessage): number | null => {
  if (tone === 'error') return null;
  if (action) return ACTION_MS;

  const words = text.split(/\s+/).filter(Boolean).length;
  const extraSeconds = Math.ceil(Math.max(0, words - WORDS_IN_BASE) / WORDS_PER_SECOND);

  return Math.min(MAX_MS, BASE_MS + extraSeconds * 1000);
};

const RANK: Record<ToastTone, number> = { success: 0, info: 0, warning: 1, error: 2 };

// A new message never pushes out one that asks more of the user: success and info give way to a warning, and
// everything to an error.
export const canReplaceToast = (current: ToastMessage, next: ToastMessage) => RANK[next.tone] >= RANK[current.tone];
