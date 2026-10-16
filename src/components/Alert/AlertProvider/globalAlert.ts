// Escape hatch for code that has no way to reach useAlert()/AlertContext: the axios interceptor in
// src/api/instance.ts, and ThemeProvider, which sits above AlertProvider.
type AlertHandler = (message: string) => void;

let handler: AlertHandler | null = null;

export const registerGlobalAlertHandler = (nextHandler: AlertHandler | null) => {
  handler = nextHandler;
};

export const showGlobalAlert = (message: string) => {
  handler?.(message);
};
