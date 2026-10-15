// R1 "Refined" SB monogram from the design's _SBMark source; scripts/export-brand-assets.mjs renders the native images from it.
export const MARK_VIEWBOX = { x: 5, y: 8, width: 120, height: 98 };

export const MARK_STROKE_WIDTH = 16;

// The knockouts cut a 4-unit gap on each side of the stroke they follow.
export const MARK_KNOCKOUT_WIDTH = MARK_STROKE_WIDTH + 4 * 2;

export const MARK_MASK_BOUNDS = { x: -20, y: -20, width: 170, height: 150 };

export const MARK_PATHS = {
  s: 'M5 70H57.5A13.5 13.5 0 0 0 57.5 43H26.5A13.5 13.5 0 0 1 26.5 16H87',
  upperBowl: 'M85 16H87A14 14 0 1 1 87.00 44.00',
  lowerBowl: 'M87 64H99A17 17 0 0 1 99 98H72',
  // Where the S passes under the end of the upper bowl and under the lower bowl.
  sKnockout: 'M99.12 37.00A14 14 0 0 1 87.00 44.00 M87 64H99A17 17 0 0 1 99 98H72',
};

export const markAspectRatio = MARK_VIEWBOX.width / MARK_VIEWBOX.height;
