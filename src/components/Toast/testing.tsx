import type { ReactNode } from 'react';
import { screen } from '@testing-library/react-native';

import type { ToastMessage, ToastTicket } from './message';
import ToastHost from './ToastHost/ToastHost';
import ToastProvider from './ToastProvider';

// The app's toast for a test tree; it needs the Redux store and safe area insets above it.
export const withToasts = (ui: ReactNode) => (
  <ToastProvider>
    {ui}
    <ToastHost />
  </ToastProvider>
);

export const toastCount = () => screen.queryAllByTestId('toast').length;

export interface RecordedToast {
  message: ToastMessage;
  when: 'now' | 'afterSheetsClose' | 'afterNavigation';
}

// A stand-in for useToast that records each message and when it was asked to show. In a test file:
//   const mockToasts = createToastRecorder();
//   jest.mock('@hooks/useToast', () => () => mockToasts.toast);
export const createToastRecorder = () => {
  const shown: RecordedToast[] = [];
  const resolved: string[] = [];
  const ticket: ToastTicket = {
    isCurrent: () => true,
    show: (message) => void shown.push({ message, when: 'now' }),
    showAfterSheetsClose: (message) => void shown.push({ message, when: 'afterSheetsClose' }),
    showAfterNavigation: (message) => void shown.push({ message, when: 'afterNavigation' }),
    resolve: (subject) => void resolved.push(subject),
  };

  return {
    shown,
    resolved,
    toast: { begin: () => ticket, show: ticket.show },
    clear: () => {
      shown.length = 0;
      resolved.length = 0;
    },
  };
};
