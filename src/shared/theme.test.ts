import { resolveAppColor } from '@shared/constants';
import { AppColor } from '@shared/enums';
import { colorThemes } from '@shared/theme';

describe('colorThemes', () => {
  const { light, dark } = colorThemes;

  it('gives both schemes the same tokens', () => {
    expect(Object.keys(dark.colors).sort()).toEqual(Object.keys(light.colors).sort());
    expect(Object.keys(dark.elevation).sort()).toEqual(Object.keys(light.elevation).sort());
  });

  it('gives every app color a wallet and a category appearance in both schemes', () => {
    for (const scheme of [light, dark]) {
      expect(Object.keys(scheme.wallets).sort()).toEqual(Object.values(AppColor).sort());
      expect(Object.keys(scheme.categories).sort()).toEqual(Object.values(AppColor).sort());
    }
  });

  it('keeps the colors that get alpha applied as six-digit hex', () => {
    for (const { colors } of [light, dark]) {
      for (const token of [colors.accent, colors.danger, colors.warn, colors.ok]) {
        expect(token).toMatch(/^#[0-9A-F]{6}$/i);
      }
    }
  });

  it('keeps what is drawn on a sheet apart from the sheet in both schemes', () => {
    for (const { colors } of [light, dark]) {
      expect(colors.toast).not.toBe(colors.elevated);
      expect(colors.text).not.toBe(colors.elevated);
    }
  });

  it('builds the category tint from the same tone as its stroke', () => {
    expect(light.categories[AppColor.AMBER]).toEqual({ stroke: 'rgb(180,114,13)', tint: 'rgba(180,114,13,0.1)' });
    expect(dark.categories[AppColor.AMBER]).toEqual({ stroke: 'rgb(240,180,85)', tint: 'rgba(240,180,85,0.16)' });
  });
});

describe('resolveAppColor', () => {
  it('keeps a known color and falls back for a missing or unknown one', () => {
    expect(resolveAppColor(AppColor.PLUM)).toBe(AppColor.PLUM);
    expect(resolveAppColor(undefined)).toBe(AppColor.SLATE);
    expect(resolveAppColor('teal' as AppColor)).toBe(AppColor.SLATE);
  });
});
