import { useId } from 'react';
import Svg, { Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { colors } from '@shared/theme';

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

const strokeProps = { fill: 'none', strokeLinecap: 'butt', strokeLinejoin: 'round' } as const;

const BrandMark = ({ height, sColor = colors.text, bColor = colors.accent }: Props) => {
  // Mask ids must be valid in url(#…), which React's generated ids are not.
  const id = `sbMark${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const knockout = (maskId: string, d: string) => (
    <Mask id={maskId} maskUnits="userSpaceOnUse" {...MARK_MASK_BOUNDS}>
      <Rect {...MARK_MASK_BOUNDS} fill="#fff" />
      <Path d={d} stroke="#000" strokeWidth={MARK_KNOCKOUT_WIDTH} {...strokeProps} />
    </Mask>
  );

  return (
    <Svg width={height * markAspectRatio} height={height} viewBox={viewBox}>
      <Defs>
        {knockout(`${id}s`, MARK_PATHS.sKnockout)}
        {knockout(`${id}b`, MARK_PATHS.upperBowl)}
      </Defs>

      <G mask={`url(#${id}s)`}>
        <Path d={MARK_PATHS.s} stroke={sColor} strokeWidth={MARK_STROKE_WIDTH} {...strokeProps} />
      </G>

      <Path d={MARK_PATHS.upperBowl} stroke={sColor} strokeWidth={MARK_STROKE_WIDTH} {...strokeProps} />

      <G mask={`url(#${id}b)`}>
        <Path d={MARK_PATHS.lowerBowl} stroke={bColor} strokeWidth={MARK_STROKE_WIDTH} {...strokeProps} />
      </G>
    </Svg>
  );
};

export default BrandMark;
