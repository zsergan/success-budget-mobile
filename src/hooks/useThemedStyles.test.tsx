import { StyleSheet, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { renderWithTheme } from '@components/ThemeProvider/themeTestUtils';
import type { Layout } from '@shared/layout';
import { getLayout, inset } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { colorThemes } from '@shared/theme';

import useLayout from './useLayout';
import useThemedStyles from './useThemedStyles';

jest.mock('./useLayout', () => {
  const { getLayout: layoutOf } = jest.requireActual('@shared/layout');
  return { __esModule: true, default: jest.fn(() => layoutOf({ width: 393, height: 852, fontScale: 1 })) };
});

const mockedLayout = jest.mocked(useLayout);

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

it('builds a layout-aware factory again only when the layout it reads changes', () => {
  const build = jest.fn();
  const createSized = (_: ColorTheme, layout: Layout) => {
    build(layout.sizeClass);
    return StyleSheet.create({ label: { padding: inset(20, layout) } });
  };
  const Sized = () => <Text style={useThemedStyles(createSized).label}>sized</Text>;

  mockedLayout.mockReturnValue(getLayout({ width: 375, height: 667, fontScale: 1 }));
  const { rerender } = render(<Sized />);
  expect(StyleSheet.flatten(screen.getByText('sized').props.style).padding).toBe(16);

  mockedLayout.mockReturnValue(getLayout({ width: 393, height: 852, fontScale: 1 }));
  rerender(<Sized />);
  expect(StyleSheet.flatten(screen.getByText('sized').props.style).padding).toBe(20);

  mockedLayout.mockReturnValue(getLayout({ width: 375, height: 667, fontScale: 1 }));
  rerender(<Sized />);
  expect(build.mock.calls).toEqual([['compact'], ['regular']]);
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
