/**
 * @jest-environment node
 */
const { ESLint } = require('eslint');

// Handed over as an object: loading the config file needs a dynamic import, which Jest does not run.
const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: require('./eslint.config.js') });

const themeErrors = async (code, filePath) => {
  const [result] = await eslint.lintText(code, { filePath });

  return result.messages
    .filter(({ ruleId }) => ruleId === 'no-restricted-syntax' || ruleId === 'no-restricted-imports')
    .map(({ message }) => message);
};

const SCREEN = 'src/screens/Example/ExampleScreen.tsx';

describe('the theme guardrails', () => {
  it.each([
    ["const styles = { root: { backgroundColor: '#FFFFFF' } };", 'a hex colour in a style'],
    ["const c = 'rgba(29, 36, 48, 0.4)';", 'an rgba colour'],
    ['const icon = <Path stroke="#1d2430" />;', 'an SVG colour prop'],
    ["const fade = <LinearGradient colors={['white', 'black']} />;", 'named gradient colours'],
    ['const tint = `rgba(${r},${g},${b},0.2)`;', 'a built colour'],
    ["const color = scheme === 'dark' ? a : b;", 'a light/dark branch in a screen'],
    ["import { colors } from '@shared/theme';", 'a fixed active-theme import'],
    ["import { useColorScheme } from 'react-native';", 'reading the appearance directly'],
  ])('rejects %s (%s)', async (code) => {
    expect(await themeErrors(code, SCREEN)).not.toEqual([]);
  });

  it('allows transparency, theme tokens and the palette definitions', async () => {
    expect(
      await themeErrors("const styles = { root: { backgroundColor: 'transparent', color: colors.text } };", SCREEN),
    ).toEqual([]);
    expect(await themeErrors("export const bg = '#F6F7F9';", 'src/shared/theme.ts')).toEqual([]);
  });

  it('keeps tests and asset scripts free to name colours', async () => {
    expect(await themeErrors("const bg = '#F6F7F9';", 'src/screens/Example/ExampleScreen.test.tsx')).toEqual([]);
    expect(await themeErrors("const bg = '#F6F7F9';", 'scripts/export-brand-assets.mjs')).toEqual([]);
  });
});
