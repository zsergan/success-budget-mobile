import Svg, { Path } from 'react-native-svg';

import { ICON_PATHS } from '@shared/icons';
import useTheme from '@hooks/useTheme';
import type { IconType } from '@shared/types';

interface Props {
  name: IconType;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const Icon = ({ name, size = 24, color, strokeWidth = 1.7 }: Props) => {
  const { colors } = useTheme().colorTheme;
  const d = ICON_PATHS[name];

  if (!d) {
    return null;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={d}
        stroke={color ?? colors.text}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Icon;
