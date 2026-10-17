import { StyleSheet, Text, View } from 'react-native';
import { screen } from '@testing-library/react-native';

import { renderWithTheme } from '@components/ThemeProvider/themeTestUtils';
import { colorThemes } from '@shared/theme';

import BottomModal from './BottomModal';

const backgrounds = () =>
  screen.UNSAFE_getAllByType(View).map((view) => StyleSheet.flatten(view.props.style)?.backgroundColor);

it('restyles an open modal, its scrim included, when the theme changes', async () => {
  const { setTheme } = await renderWithTheme(
    <BottomModal isVisible onClose={() => {}} content={<Text>Delete wallet?</Text>} />,
  );
  expect(backgrounds()).toContain(colorThemes.light.colors.scrim);

  await setTheme('dark');

  const { colors } = colorThemes.dark;
  expect(screen.getByText('Delete wallet?')).toBeTruthy();
  expect(backgrounds()).toEqual(expect.arrayContaining([colors.scrim, colors.elevated]));
  expect(backgrounds()).not.toContain(colorThemes.light.colors.scrim);
});
