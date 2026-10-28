export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

// What each type may offer: info never acts, a warning always does, and only an error, which has no timer, can be closed.
export type ToastContent =
  | { tone: 'success'; text: string; action?: ToastAction }
  | { tone: 'info'; text: string; action?: never }
  | { tone: 'warning'; text: string; action: ToastAction }
  | { tone: 'error'; text: string; action?: ToastAction };

export type ToastMessage = ToastContent & {
  // What it reports on, e.g. `transaction-delete:42`; a later outcome of the same subject replaces or resolves it.
  subject?: string;
  // The screen occurrence (route key) it belongs to; leaving that screen takes it away.
  owner?: string;
};

// One showing of a message. Showing the same message again keeps the toast and its id.
export type ShownToast = ToastMessage & { id: number };

export const isSameToast = (a: ToastMessage, b: ToastMessage) =>
  a.tone === b.tone && a.subject === b.subject && a.text === b.text;
