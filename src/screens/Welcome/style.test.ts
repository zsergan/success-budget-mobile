import { getLayout } from '@shared/layout';
import { bottomGap } from '@screens/Auth/AuthFormLayout/style';

import { screenGaps } from './style';

const se = getLayout({ width: 375, height: 667, fontScale: 1 });
const mini = getLayout({ width: 375, height: 812, fontScale: 1 });

it('keeps the design’s gaps on a phone with a notch and trims them on one with a home button', () => {
  expect(screenGaps(mini)).toEqual({ top: 44, bottom: 40 });
  expect(screenGaps(se)).toEqual({ top: 24, bottom: 24 });
  expect(bottomGap(mini)).toBe(38);
  expect(bottomGap(se)).toBe(24);
});
