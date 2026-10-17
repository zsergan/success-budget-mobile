import { StyleSheet, View } from 'react-native';
import { screen } from '@testing-library/react-native';

import { renderWithTheme } from '@components/ThemeProvider/themeTestUtils';
import { AppColor } from '@shared/enums';
import { colorThemes } from '@shared/theme';

import CategoryIconBox from './CategoryIconBox';

it('draws a category in the active theme’s tone of its colour', async () => {
  const { setTheme } = await renderWithTheme(<CategoryIconBox icon="cafe" color={AppColor.AMBER} size={42} />);
  const box = () => StyleSheet.flatten(screen.UNSAFE_getAllByType(View)[0].props.style);

  expect(box().backgroundColor).toBe(colorThemes.light.categories[AppColor.AMBER].tint);

  await setTheme('dark');

  expect(box().backgroundColor).toBe(colorThemes.dark.categories[AppColor.AMBER].tint);
});
