import { Keyboard } from 'react-native';

import { afterKeyboardHides } from './keyboard';

let hideKeyboard: () => void;
const remove = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  remove.mockClear();
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  jest.spyOn(Keyboard, 'addListener').mockImplementation((_event, listener) => {
    hideKeyboard = () => listener({} as never);
    return { remove } as never;
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it('shows at once without a keyboard', () => {
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
  const show = jest.fn();

  expect(afterKeyboardHides(show)).toBeNull();
  expect(show).toHaveBeenCalledTimes(1);
  expect(Keyboard.dismiss).not.toHaveBeenCalled();
});

it('dismisses the keyboard and shows once it has gone, only once', () => {
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
  const show = jest.fn();

  afterKeyboardHides(show);

  expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
  expect(show).not.toHaveBeenCalled();

  hideKeyboard();
  jest.runAllTimers();

  expect(show).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalled();
});

it('shows anyway when the keyboard never reports going', () => {
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
  const show = jest.fn();

  afterKeyboardHides(show);
  jest.advanceTimersByTime(600);

  expect(show).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalled();
});

it('shows nothing once cancelled', () => {
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
  const show = jest.fn();

  afterKeyboardHides(show)?.();
  jest.runAllTimers();

  expect(show).not.toHaveBeenCalled();
  expect(remove).toHaveBeenCalled();
});
