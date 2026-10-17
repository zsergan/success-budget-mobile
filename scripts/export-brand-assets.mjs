// Renders the app icon, splash and favicon PNGs into assets/ from the mark geometry: `npm run brand:assets`.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

import {
  MARK_KNOCKOUT_WIDTH,
  MARK_MASK_BOUNDS,
  MARK_PATHS,
  MARK_STROKE_WIDTH,
  MARK_VIEWBOX,
  markAspectRatio,
} from '../src/components/Brand/markGeometry.ts';
import {
  LAUNCH_LOCKUP_RAISE,
  STACKED_LOCKUP_HEIGHT,
  STACKED_MARK_HEIGHT,
} from '../src/components/Brand/launchLayout.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fontsDir = join(root, 'node_modules/@expo-google-fonts/plus-jakarta-sans');

const GRAPHITE = '#1D2430';
const LIGHT = '#F2F4F8';
const AMBER = '#FFB020';
const MUTED = '#798393';
const MUTED_DARK = '#8794A8';

let maskSeq = 0;

const mark = ({ x, y, height, sColor, bColor }) => {
  const id = `m${++maskSeq}`;
  const scale = height / MARK_VIEWBOX.height;
  const { x: mx, y: my, width: mw, height: mh } = MARK_MASK_BOUNDS;
  const knock = (d) =>
    `<mask id="${id}${d === MARK_PATHS.sKnockout ? 's' : 'b'}" maskUnits="userSpaceOnUse" x="${mx}" y="${my}" width="${mw}" height="${mh}">` +
    `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="#fff"/>` +
    `<path d="${d}" stroke="#000" stroke-width="${MARK_KNOCKOUT_WIDTH}" fill="none"/></mask>`;

  return (
    `<g transform="translate(${x} ${y}) scale(${scale}) translate(${-MARK_VIEWBOX.x} ${-MARK_VIEWBOX.y})" ` +
    `fill="none" stroke-width="${MARK_STROKE_WIDTH}" stroke-linecap="butt" stroke-linejoin="round">` +
    `<defs>${knock(MARK_PATHS.sKnockout)}${knock(MARK_PATHS.upperBowl)}</defs>` +
    `<g mask="url(#${id}s)"><path d="${MARK_PATHS.s}" stroke="${sColor}"/></g>` +
    `<path d="${MARK_PATHS.upperBowl}" stroke="${sColor}"/>` +
    `<g mask="url(#${id}b)"><path d="${MARK_PATHS.lowerBowl}" stroke="${bColor}"/></g></g>`
  );
};

const centredMark = ({ size, height, cy = size / 2, ...colors }) =>
  mark({ x: (size - height * markAspectRatio) / 2, y: cy - height / 2, height, ...colors });

const svg = (width, height, body, background) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
  (background ? `<rect width="${width}" height="${height}" fill="${background}"/>` : '') +
  `${body}</svg>`;

const write = (file, source, pixelWidth) => {
  const png = new Resvg(source, {
    fitTo: { mode: 'width', value: pixelWidth },
    font: {
      fontFiles: [
        join(fontsDir, '500Medium/PlusJakartaSans_500Medium.ttf'),
        join(fontsDir, '700Bold/PlusJakartaSans_700Bold.ttf'),
      ],
      loadSystemFonts: false,
      defaultFontFamily: 'Plus Jakarta Sans',
    },
  })
    .render()
    .asPng();

  writeFileSync(join(root, 'assets', file), png);
};

// App icon: the mark is 56/120 of the icon's height, light S and amber B on a graphite square.
const ICON_MARK_RATIO = 56 / 120;

write(
  'icon.png',
  svg(1024, 1024, centredMark({ size: 1024, height: 1024 * ICON_MARK_RATIO, sColor: LIGHT, bColor: AMBER }), GRAPHITE),
  1024,
);

// Adaptive icon: the same share of the 72dp visible area, inside the 108dp layer.
const adaptiveHeight = (1024 * ICON_MARK_RATIO * 72) / 108;

write(
  'adaptive-icon.png',
  svg(1024, 1024, centredMark({ size: 1024, height: adaptiveHeight, sColor: LIGHT, bColor: AMBER })),
  1024,
);
write(
  'adaptive-icon-monochrome.png',
  svg(1024, 1024, centredMark({ size: 1024, height: adaptiveHeight, sColor: '#FFFFFF', bColor: '#FFFFFF' })),
  1024,
);

write(
  'favicon.png',
  svg(
    120,
    120,
    `<rect width="120" height="120" rx="27" fill="${GRAPHITE}"/>` +
      centredMark({ size: 120, height: 56, sColor: LIGHT, bColor: AMBER }),
  ),
  48,
);

// iOS launch screen: a 260pt square centred on the screen, holding the stacked lockup where the app's first frame
// draws it. Android 12+ shows only an icon clipped to a 192dp circle, so its launch screen carries the mark alone.
// The dark pair matches the dark theme's first frame (colors.text and colors.muted over colors.bg).
const SPLASH = 260;
const blockTop = SPLASH / 2 - LAUNCH_LOCKUP_RAISE - STACKED_LOCKUP_HEIGHT / 2;
const nameTop = blockTop + STACKED_MARK_HEIGHT + 22;
const taglineTop = nameTop + 32 + 6;

const SPLASH_SCHEMES = { '': { ink: GRAPHITE, muted: MUTED }, '-dark': { ink: LIGHT, muted: MUTED_DARK } };

Object.entries(SPLASH_SCHEMES).forEach(([suffix, { ink, muted }]) => {
  write(
    `splash-ios${suffix}.png`,
    svg(
      SPLASH,
      SPLASH,
      centredMark({
        size: SPLASH,
        height: STACKED_MARK_HEIGHT,
        cy: blockTop + STACKED_MARK_HEIGHT / 2,
        sColor: ink,
        bColor: AMBER,
      }) +
        // Baselines centre each font's ascent + descent (1.038 + 0.222 em) in its line height.
        `<text x="${SPLASH / 2}" y="${nameTop + 26.61}" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="700" font-size="26" letter-spacing="-0.6" fill="${ink}">Success Budget</text>` +
        `<text x="${SPLASH / 2}" y="${taglineTop + 15.71}" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="500" font-size="14" fill="${muted}">Personal and shared budgets</text>`,
    ),
    // Exactly @3x, the largest scale the storyboard asks for, so the image is never resampled into it.
    SPLASH * 3,
  );

  write(
    `splash-android${suffix}.png`,
    svg(1024, 1024, centredMark({ size: 1024, height: 1024 / markAspectRatio, sColor: ink, bColor: AMBER })),
    1024,
  );
});

console.log('Brand assets written to assets/.');
