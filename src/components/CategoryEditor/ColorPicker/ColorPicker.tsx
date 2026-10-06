import { TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { getCategoryStroke, CATEGORY_COLOR_ORDER } from '@shared/categoryColors';
import type { AppColor } from '@shared/enums';
import { colors, colorScheme } from '@shared/theme';

import styles from './style';

// Swatches are flat (not tinted) here — this is the picker's own solid fill, distinct from the tinted icon boxes elsewhere.
const CHECK_COLOR = colorScheme === 'dark' ? colors.bg : colors.elevated;

interface Props {
  value: AppColor;
  onChange: (color: AppColor) => void;
}

const ColorPicker = ({ value, onChange }: Props) => (
  <View style={styles.colorRow}>
    {CATEGORY_COLOR_ORDER.map((color) => {
      const selected = color === value;

      return (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorSwatch,
            { backgroundColor: getCategoryStroke(color) },
            selected && styles.colorSwatchSelected,
          ]}
          onPress={() => onChange(color)}
          activeOpacity={0.7}
        >
          {selected && <Icon name="check" size={16} color={CHECK_COLOR} strokeWidth={2.6} />}
        </TouchableOpacity>
      );
    })}
  </View>
);

export default ColorPicker;
