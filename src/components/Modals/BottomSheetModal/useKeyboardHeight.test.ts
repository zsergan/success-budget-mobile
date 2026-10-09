import type { KeyboardEvent, KeyboardEventName } from 'react-native';
import { Dimensions, Keyboard } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import useKeyboardHeight from './useKeyboardHeight';

const listeners = new Map<KeyboardEventName, (event: KeyboardEvent) => void>();
const remove = jest.fn();
const windowHeight = Dimensions.get('window').height;

const frame = (height: number, screenY = windowHeight - height) =>
  ({ endCoordinates: { height, screenY, screenX: 0, width: 400 } }) as KeyboardEvent;

beforeEach(() => {
  listeners.clear();
  remove.mockClear();
  jest.spyOn(Keyboard, 'metrics').mockReturnValue(undefined);
  jest.spyOn(Keyboard, 'addListener').mockImplementation((name, callback) => {
    listeners.set(name, callback);
    return { remove } as unknown as ReturnType<typeof Keyboard.addListener>;
  });
});

afterEach(() => jest.restoreAllMocks());

it('accounts for a keyboard that was already visible when a panel mounted', () => {
  jest.spyOn(Keyboard, 'metrics').mockReturnValue(frame(300).endCoordinates);
  const { result } = renderHook(useKeyboardHeight);

  expect(result.current).toBe(300);
});

it('follows a switch from the numeric keyboard to the note keyboard', () => {
  const { result } = renderHook(useKeyboardHeight);
  act(() => listeners.get('keyboardWillShow')?.(frame(280)));
  expect(result.current).toBe(280);

  act(() => listeners.get('keyboardWillChangeFrame')?.(frame(340)));
  expect(result.current).toBe(340);

  act(() => listeners.get('keyboardWillHide')?.(frame(340, windowHeight)));
  act(() => listeners.get('keyboardWillChangeFrame')?.(frame(340, windowHeight)));
  expect(result.current).toBe(0);
});

it('removes every keyboard subscription when the panel leaves', () => {
  const { unmount } = renderHook(useKeyboardHeight);
  unmount();
  expect(remove).toHaveBeenCalledTimes(3);
});
