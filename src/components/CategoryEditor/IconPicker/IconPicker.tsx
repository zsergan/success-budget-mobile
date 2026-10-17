import { TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { CATEGORY_ICON_LIST } from '@shared/icons';
import type { AppColor } from '@shared/enums';
import type { IconType } from '@shared/types';

import createStyles from './style';

interface Props {
  value: IconType;
  color: AppColor;
  onChange: (icon: IconType) => void;
}

const IconPicker = ({ value, color, onChange }: Props) => {
  const { colors, categories } = useTheme().colorTheme;
  const { stroke, tint } = categories[color];
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.iconGrid}>
      {CATEGORY_ICON_LIST.map((icon) => {
        const selected = icon === value;

        return (
          <View key={icon} style={styles.iconCellWrap}>
            <TouchableOpacity
              style={[
                styles.iconCell,
                { backgroundColor: selected ? tint : colors.surface },
                selected ? [styles.iconCellSelected, { borderColor: stroke }] : styles.iconCellUnselected,
              ]}
              onPress={() => onChange(icon)}
              activeOpacity={0.7}
            >
              <Icon name={icon} size={22} color={selected ? stroke : colors.muted} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

export default IconPicker;
