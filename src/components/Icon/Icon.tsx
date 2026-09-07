import Svg, { Path } from 'react-native-svg';

import { ICON_PATHS } from '@shared/icons';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';

interface Props {
  name: IconType;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const Icon = ({ name, size = 24, color = colors.text, strokeWidth = 1.7 }: Props) => {
  const d = ICON_PATHS[name];

  if (!d) {
    return null;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export default Icon;
