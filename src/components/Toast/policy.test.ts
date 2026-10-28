import type { ShownToast, ToastMessage } from './message';
import { isSameToast } from './message';
import { canReplaceToast, toastDuration } from './policy';

const words = (count: number) => Array.from({ length: count }, (_, index) => `word${index}`).join(' ');
const retry = { label: 'Retry', onPress: () => {} };

describe('toastDuration', () => {
  it.each([
    [1, 4000],
    [8, 4000],
    [9, 5000],
    [18, 5000],
    [19, 6000],
    [38, 7000],
    [39, 8000],
    [120, 8000],
  ])(
    'gives success and info without an action 4 s, plus a second per started ten words past eight (%i words)',
    (count, ms) => {
      expect(toastDuration({ tone: 'success', text: words(count) })).toBe(ms);
      expect(toastDuration({ tone: 'info', text: words(count) })).toBe(ms);
    },
  );

  it('gives a success with an action and a warning 8 s, and an error no timer', () => {
    expect(
      toastDuration({ tone: 'success', text: 'Saved to 12 Aug', action: { label: 'Show', onPress: () => {} } }),
    ).toBe(8000);
    expect(toastDuration({ tone: 'warning', text: 'Not deleted', action: { label: 'View', onPress: () => {} } })).toBe(
      8000,
    );
    expect(toastDuration({ tone: 'error', text: 'Couldn’t send the code' })).toBeNull();
    expect(toastDuration({ tone: 'error', text: 'Couldn’t delete transaction', action: retry })).toBeNull();
  });
});

describe('canReplaceToast', () => {
  const success: ToastMessage = { tone: 'success', text: 'Transaction deleted' };
  const info: ToastMessage = { tone: 'info', text: 'Already deleted' };
  const warning: ToastMessage = { tone: 'warning', text: 'Not deleted', action: { label: 'View', onPress: () => {} } };
  const error: ToastMessage = { tone: 'error', text: 'Couldn’t delete transaction', action: retry };

  it.each<[ToastMessage, ToastMessage, boolean]>([
    [success, info, true],
    [info, success, true],
    [success, warning, true],
    [warning, warning, true],
    [warning, error, true],
    [error, error, true],
    [error, success, false],
    [error, warning, false],
    [warning, success, false],
    [warning, info, false],
  ])('%j → %j: %s', (current, next, expected) => {
    expect(canReplaceToast(current, next)).toBe(expected);
  });
});

describe('isSameToast', () => {
  const base: ShownToast = { tone: 'error', text: 'Couldn’t delete', subject: 'transaction-delete:1', id: 1, owner: 3 };

  it('matches on type, subject, text and owner, whatever the action or id', () => {
    expect(isSameToast(base, { ...base, id: 2, action: retry })).toBe(true);
    expect(isSameToast(base, { ...base, owner: 4 })).toBe(false);
    expect(isSameToast(base, { ...base, subject: 'transaction-delete:2' })).toBe(false);
    expect(isSameToast(base, { ...base, text: 'Couldn’t delete transaction' })).toBe(false);
    expect(isSameToast(base, { ...base, tone: 'info', action: undefined })).toBe(false);
  });
});
