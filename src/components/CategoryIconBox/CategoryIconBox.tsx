import { View } from 'react-native';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import type { AppColor } from '@shared/enums';
import type { IconType } from '@shared/types';

import styles from './style';

interface Props {
  icon: IconType;
  color: AppColor;
  size: number;
  opacity?: number;
}

const CategoryIconBox = ({ icon, color, size, opacity = 1 }: Props) => {
  const { stroke, tint } = useTheme().colorTheme.categories[color];

  return (
    <View style={[styles.box, { width: size, height: size, backgroundColor: tint, opacity }]}>
      <Icon name={icon} size={Math.round(size * 0.5)} color={stroke} strokeWidth={1.9} />
    </View>
  );
};

export default CategoryIconBox;
