import type { ToastTicket } from './message';
import { INACTIVE_TICKET } from './message';

type BeginToast = () => ToastTicket;

let begin: BeginToast | null = null;

export const registerToastBridge = (next: BeginToast) => {
  begin = next;

  return () => {
    if (begin === next) begin = null;
  };
};

// For code outside React (the HTTP client, the theme preference writer): capture it when the work starts.
export const beginToast = (): ToastTicket => begin?.() ?? INACTIVE_TICKET;
