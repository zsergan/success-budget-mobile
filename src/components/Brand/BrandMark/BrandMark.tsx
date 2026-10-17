import { useId } from 'react';
import Svg, { Defs, G, Mask, Path, Rect } from 'react-native-svg';

import useTheme from '@hooks/useTheme';

import {
  MARK_KNOCKOUT_WIDTH,
  MARK_MASK_BOUNDS,
  MARK_PATHS,
  MARK_STROKE_WIDTH,
  MARK_VIEWBOX,
  markAspectRatio,
} from '../markGeometry';

interface Props {
  height: number;
  sColor?: string;
  bColor?: string;
}

const viewBox = `${MARK_VIEWBOX.x} ${MARK_VIEWBOX.y} ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`;

// Mask luminance, not drawn colours: white keeps the stroke under it, black cuts the knockout.
/* eslint-disable no-restricted-syntax */
const MASK_KEEP = '#fff';
const MASK_CUT = '#000';
/* eslint-enable no-restricted-syntax */

const strokeProps = { fill: 'none', strokeLinecap: 'butt', strokeLinejoin: 'round' } as const;

const BrandMark = ({ height, sColor, bColor }: Props) => {
  const { colors } = useTheme().colorTheme;
  // Mask ids must be valid in url(#…), which React's generated ids are not.
  const id = `sbMark${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const knockout = (maskId: string, d: string) => (
    <Mask id={maskId} maskUnits="userSpaceOnUse" {...MARK_MASK_BOUNDS}>
      <Rect {...MARK_MASK_BOUNDS} fill={MASK_KEEP} />
      <Path d={d} stroke={MASK_CUT} strokeWidth={MARK_KNOCKOUT_WIDTH} {...strokeProps} />
    </Mask>
  );

  return (
    <Svg width={height * markAspectRatio} height={height} viewBox={viewBox}>
      <Defs>
        {knockout(`${id}s`, MARK_PATHS.sKnockout)}
        {knockout(`${id}b`, MARK_PATHS.upperBowl)}
      </Defs>

      <G mask={`url(#${id}s)`}>
        <Path d={MARK_PATHS.s} stroke={sColor ?? colors.text} strokeWidth={MARK_STROKE_WIDTH} {...strokeProps} />
      </G>

      <Path d={MARK_PATHS.upperBowl} stroke={sColor ?? colors.text} strokeWidth={MARK_STROKE_WIDTH} {...strokeProps} />

      <G mask={`url(#${id}b)`}>
        <Path
          d={MARK_PATHS.lowerBowl}
          stroke={bColor ?? colors.accent}
          strokeWidth={MARK_STROKE_WIDTH}
          {...strokeProps}
        />
      </G>
    </Svg>
  );
};

export default BrandMark;
