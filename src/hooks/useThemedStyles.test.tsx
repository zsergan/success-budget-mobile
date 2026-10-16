import { StyleSheet, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { renderWithTheme } from '@components/ThemeProvider/themeTestUtils';
import type { ColorTheme } from '@shared/theme';
import { colorThemes } from '@shared/theme';

import useThemedStyles from './useThemedStyles';

const createStyles = jest.fn(({ colors }: ColorTheme) => StyleSheet.create({ label: { color: colors.text } }));

const seen: object[] = [];

const Label = ({ text }: { text: string }) => {
  const styles = useThemedStyles(createStyles);
  seen.push(styles);

  return <Text style={styles.label}>{text}</Text>;
};

beforeEach(() => {
  seen.length = 0;
});

it('builds a theme’s styles once and shares them across components and renders', async () => {
  const { rerender } = render(
    <>
      <Label text="one" />
      <Label text="two" />
    </>,
  );
  rerender(
    <>
      <Label text="one" />
      <Label text="three" />
    </>,
  );

  expect(createStyles).toHaveBeenCalledTimes(1);
  expect(new Set(seen).size).toBe(1);
});

it('switches to the other theme’s styles, and back to the same ones', async () => {
  const { setTheme } = await renderWithTheme(<Label text="label" />);
  const lightStyles = seen[seen.length - 1];

  await setTheme('dark');
  expect(StyleSheet.flatten(screen.getByText('label').props.style).color).toBe(colorThemes.dark.colors.text);
  const builds = createStyles.mock.calls.length;

  await setTheme('light');
  expect(seen[seen.length - 1]).toBe(lightStyles);
  expect(createStyles).toHaveBeenCalledTimes(builds);
});
