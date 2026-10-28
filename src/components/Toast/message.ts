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
};

export type ShownToast = ToastMessage & {
  // One showing: showing the same message again keeps the toast and its id.
  id: number;
  // The screen occurrence, session, space and foreground period it was asked in; any change ends it.
  owner: number;
};

export const isSameToast = (a: ShownToast, b: ShownToast) =>
  a.tone === b.tone && a.subject === b.subject && a.text === b.text && a.owner === b.owner;

// Feedback for work captured when it started: it reaches the screen only while that screen occurrence, session, space
// and foreground period last, and is dropped for good once any of them ends.
export interface ToastTicket {
  isCurrent(): boolean;
  show(message: ToastMessage): void;
  // For a result that closes sheets: shown once every sheet has finished closing.
  showAfterSheetsClose(message: ToastMessage): void;
  // For a result that navigates: shown on the screen it leads to, if that navigation follows at once.
  showAfterNavigation(message: ToastMessage): void;
  // Takes away this subject's toast, e.g. an error its retry has since settled.
  resolve(subject: string): void;
}

export const INACTIVE_TICKET: ToastTicket = {
  isCurrent: () => false,
  show: () => {},
  showAfterSheetsClose: () => {},
  showAfterNavigation: () => {},
  resolve: () => {},
};
