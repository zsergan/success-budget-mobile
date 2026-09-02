// Escape hatch for code outside the React tree (the axios interceptor in
// src/api/instance.ts) that has no way to reach useAlert()/AlertContext.
type AlertHandler = (message: string) => void;

let handler: AlertHandler | null = null;

export const registerGlobalAlertHandler = (nextHandler: AlertHandler | null) => {
  handler = nextHandler;
};

export const showGlobalAlert = (message: string) => {
  handler?.(message);
};
