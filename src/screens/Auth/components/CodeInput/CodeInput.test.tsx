import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import CodeInput from './CodeInput';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

// Jest has no native hit-testing: these check the layout that lets a tap reach the field, not the tap itself.
const field = () => screen.getByLabelText('6-digit code');
const fieldStyle = () => StyleSheet.flatten(field().props.style);

const renderInput = (props: Partial<Parameters<typeof CodeInput>[0]> = {}) =>
  render(<CodeInput value="" onChangeText={jest.fn()} onPaste={jest.fn()} {...props} />);

describe('the code field', () => {
  it('lies over every box and stays visible enough for iOS to deliver touches to it', () => {
    renderInput();

    expect(fieldStyle()).toMatchObject({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 });
    expect(fieldStyle().opacity).toBeGreaterThan(0.01);
  });

  it('draws nothing of its own over the boxes', () => {
    renderInput({ value: '0428' });

    expect(fieldStyle()).toMatchObject({ color: 'transparent', backgroundColor: 'transparent' });
    expect(field().props).toMatchObject({ caretHidden: true, selectionColor: 'transparent' });
  });

  it('keeps the boxes from catching touches meant for the field', () => {
    renderInput();

    const boxes = screen.getAllByTestId('code-box');
    expect(boxes).toHaveLength(6);
    boxes.forEach((box) => expect(StyleSheet.flatten(box.props.style).pointerEvents).toBe('none'));
  });

  it('types and deletes at the end of the code wherever the boxes are tapped', () => {
    const { rerender } = renderInput({ value: '04' });

    expect(field().props.selection).toEqual({ start: 2, end: 2 });

    rerender(<CodeInput value="042917" onChangeText={jest.fn()} onPaste={jest.fn()} />);

    expect(field().props.selection).toEqual({ start: 6, end: 6 });
  });

  it('takes digits from the number pad and one-time-code autofill', () => {
    renderInput();

    expect(field().props).toMatchObject({ keyboardType: 'number-pad', textContentType: 'oneTimeCode' });
  });

  it('holds the digits while a request runs and empties once the code can’t be used', () => {
    const { rerender } = renderInput({ value: '042917', isLocked: true });

    expect(field().props).toMatchObject({ editable: false, value: '042917' });
    expect(screen.getByText('0')).toBeTruthy();

    rerender(<CodeInput value="042917" onChangeText={jest.fn()} onPaste={jest.fn()} isDisabled />);

    expect(field().props).toMatchObject({ editable: false, value: '', selection: { start: 0, end: 0 } });
    expect(screen.queryByText('0')).toBeNull();
  });
});
