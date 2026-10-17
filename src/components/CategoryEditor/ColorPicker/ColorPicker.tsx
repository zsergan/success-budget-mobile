import { TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { CATEGORY_COLOR_ORDER } from '@shared/categoryColors';
import type { AppColor } from '@shared/enums';

import createStyles from './style';

// Swatches are flat (not tinted) here — this is the picker's own solid fill, distinct from the tinted icon boxes elsewhere.

interface Props {
  value: AppColor;
  onChange: (color: AppColor) => void;
}

const ColorPicker = ({ value, onChange }: Props) => {
  const { colors, categories } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.colorRow}>
      {CATEGORY_COLOR_ORDER.map((color) => {
        const selected = color === value;

        return (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorSwatch,
              { backgroundColor: categories[color].stroke },
              selected && styles.colorSwatchSelected,
            ]}
            onPress={() => onChange(color)}
            activeOpacity={0.7}
          >
            {selected && <Icon name="check" size={16} color={colors.onSwatch} strokeWidth={2.6} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default ColorPicker;
