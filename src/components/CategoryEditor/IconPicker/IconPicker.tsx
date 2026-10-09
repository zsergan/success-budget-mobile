import { TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { CATEGORY_ICON_LIST } from '@shared/icons';
import { getCategoryStroke, getCategoryTint } from '@shared/categoryColors';
import type { AppColor } from '@shared/enums';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';

import styles from './style';

interface Props {
  value: IconType;
  color: AppColor;
  onChange: (icon: IconType) => void;
}

const IconPicker = ({ value, color, onChange }: Props) => (
  <View style={styles.iconGrid}>
    {CATEGORY_ICON_LIST.map((icon) => {
      const selected = icon === value;

      return (
        <View key={icon} style={styles.iconCellWrap}>
          <TouchableOpacity
            style={[
              styles.iconCell,
              { backgroundColor: selected ? getCategoryTint(color) : colors.surface },
              selected
                ? [styles.iconCellSelected, { borderColor: getCategoryStroke(color) }]
                : styles.iconCellUnselected,
            ]}
            onPress={() => onChange(icon)}
            activeOpacity={0.7}
          >
            <Icon name={icon} size={22} color={selected ? getCategoryStroke(color) : colors.muted} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      );
    })}
  </View>
);

export default IconPicker;
