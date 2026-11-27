import { Keyboard } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import useKeyboardHeight from '@hooks/useKeyboardHeight';

import KeyboardDoneBar from './KeyboardDoneBar';

jest.mock('@hooks/useKeyboardHeight', () => ({ __esModule: true, default: jest.fn(() => 0) }));

const keyboardHeight = jest.mocked(useKeyboardHeight);

it('closes the on-screen keyboard from its Done button', () => {
  keyboardHeight.mockReturnValue(336);
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  render(<KeyboardDoneBar nativeID="amount-done" />);

  fireEvent.press(screen.getByRole('button', { name: 'Done' }));

  expect(dismiss).toHaveBeenCalled();
  dismiss.mockRestore();
});

it('shows nothing without the on-screen keyboard', () => {
  keyboardHeight.mockReturnValue(0);
  render(<KeyboardDoneBar nativeID="amount-done" />);

  expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
});
