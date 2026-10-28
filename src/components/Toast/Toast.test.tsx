import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { renderWithTheme } from '@components/ThemeProvider/themeTestUtils';
import { colorThemes } from '@shared/theme';
import type { ToastContent } from './message';
import Toast from './Toast';

const layOut = (width: number, controlsWidth: number) => {
  fireEvent(screen.getByTestId('toast'), 'layout', { nativeEvent: { layout: { width } } });
  fireEvent(screen.getByTestId('toast-controls'), 'layout', { nativeEvent: { layout: { width: controlsWidth } } });
};

const countLines = (lines: number) =>
  fireEvent(screen.getByTestId('toast-measure', { includeHiddenElements: true }), 'textLayout', {
    nativeEvent: { lines: Array.from({ length: lines }, () => ({})) },
  });

const isStacked = () => StyleSheet.flatten(screen.getByTestId('toast').props.style).paddingTop === 12;

describe('Toast', () => {
  it.each<[ToastContent, string[]]>([
    [{ tone: 'success', text: 'Transaction deleted' }, []],
    [{ tone: 'success', text: 'Saved to 12 Aug', action: { label: 'Show', onPress: jest.fn() } }, ['Show']],
    [{ tone: 'info', text: 'This transaction was already deleted' }, []],
    [
      {
        tone: 'warning',
        text: 'Not deleted — this transaction changed',
        action: { label: 'View', onPress: jest.fn() },
      },
      ['View'],
    ],
    [{ tone: 'error', text: 'Couldn’t send the code' }, ['Close']],
    [
      { tone: 'error', text: 'Couldn’t delete transaction', action: { label: 'Retry', onPress: jest.fn() } },
      ['Retry', 'Close'],
    ],
  ])('shows a %j toast with exactly its allowed controls', (content, controls) => {
    render(<Toast content={content} onClose={jest.fn()} />);

    expect(screen.getByText(content.text)).toBeTruthy();
    expect(screen.getByTestId(`toast-mark-${content.tone}`)).toBeTruthy();
    expect(screen.queryAllByRole('button').map((button) => button.props.accessibilityLabel)).toEqual(controls);
  });

  it('runs its action and its close control separately', () => {
    const onPress = jest.fn();
    const onClose = jest.fn();
    render(
      <Toast
        content={{ tone: 'error', text: 'Couldn’t delete transaction', action: { label: 'Retry', onPress } }}
        onClose={onClose}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  describe('with controls', () => {
    const content: ToastContent = {
      tone: 'error',
      text: 'Couldn’t delete transaction. Check your connection and try again.',
      action: { label: 'Retry', onPress: jest.fn() },
    };

    it('keeps them beside a message of up to two lines', () => {
      render(<Toast content={content} onClose={jest.fn()} />);
      layOut(361, 110);
      countLines(2);

      expect(isStacked()).toBe(false);
    });

    it('moves them under a message that takes three lines beside them, and counts lines at that width', () => {
      render(<Toast content={content} onClose={jest.fn()} />);
      layOut(361, 110);
      countLines(3);

      expect(isStacked()).toBe(true);
      // Border, start padding, mark, two gaps, controls and end padding come off the surface's width.
      expect(
        StyleSheet.flatten(screen.getByTestId('toast-measure', { includeHiddenElements: true }).props.style).width,
      ).toBe(361 - 2 - 14 - 22 - 24 - 110 - 4);
    });

    it('moves them under the message when there is too little room beside them', () => {
      render(<Toast content={content} onClose={jest.fn()} />);
      layOut(320, 110);
      countLines(1);

      expect(isStacked()).toBe(true);
    });
  });

  it('never stacks a toast without controls, however long its message', () => {
    render(<Toast content={{ tone: 'info', text: 'A long message. '.repeat(10) }} onClose={jest.fn()} />);
    fireEvent(screen.getByTestId('toast'), 'layout', { nativeEvent: { layout: { width: 200 } } });

    expect(screen.queryByTestId('toast-measure', { includeHiddenElements: true })).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId('toast').props.style).padding).toBe(14);
  });

  it('leaves its height to its content', () => {
    render(<Toast content={{ tone: 'success', text: 'Transaction deleted' }} onClose={jest.fn()} />);
    const style = StyleSheet.flatten(screen.getByTestId('toast').props.style);

    expect(style.minHeight).toBe(52);
    expect(style.height).toBeUndefined();
    expect(screen.getByText('Transaction deleted').props.numberOfLines).toBeUndefined();
  });

  it('restyles when the theme changes', async () => {
    const { setTheme } = await renderWithTheme(
      <Toast content={{ tone: 'success', text: 'Transaction deleted' }} onClose={jest.fn()} />,
    );
    await setTheme('dark');

    expect(StyleSheet.flatten(screen.getByTestId('toast').props.style)).toMatchObject({
      backgroundColor: colorThemes.dark.colors.elevated,
      borderColor: colorThemes.dark.colors.line,
    });
  });
});
