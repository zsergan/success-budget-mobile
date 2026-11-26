import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { CategoryColor, CustomColor } from '@shared/categoryColors';
import { CATEGORY_COLOR_NAMES, CATEGORY_COLOR_ORDER, isCustomColor } from '@shared/categoryColors';
import { resolveCategoryAppearance } from '@shared/categoryAppearance';
import type { IconType } from '@shared/types';
import { hsvToHex, HUE_STOPS, rgbToHex } from './colorModel';
import CustomColorPanel from './CustomColorPanel';

import createStyles from './style';

interface Props {
  value: CategoryColor;
  // The category's colour as saved, so a reopened custom colour says it is the saved one.
  saved?: CategoryColor;
  icon: IconType;
  onChange: (color: CategoryColor) => void;
  // The colour being picked in the open panel, for the previews around it; null once it closes.
  onPreview?: (color: CustomColor | null) => void;
}

// The six preset swatches, flat as the picker's own fill, and a seventh that opens a custom colour inside the
// section. A custom colour reaches the draft only on Apply; Cancel leaves the draft as it was.
const ColorPicker = ({ value, saved, icon, onChange, onPreview }: Props) => {
  const { colorTheme } = useTheme();
  const { colors, categories } = colorTheme;
  const styles = useThemedStyles(createStyles);
  const [isOpen, setOpen] = useState(false);
  const isCustom = isCustomColor(value);

  // A custom colour opens where it is; a preset starts the panel from the tone it shows.
  const initial: CustomColor = isCustom
    ? value
    : (rgbToHex(resolveCategoryAppearance(colorTheme, value).stroke) ?? hsvToHex({ h: 0, s: 0, v: 0.5 }));

  const close = () => {
    setOpen(false);
    onPreview?.(null);
  };

  const open = () => {
    setOpen(true);
    onPreview?.(initial);
  };

  const pickPreset = (color: CategoryColor) => {
    close();
    onChange(color);
  };

  return (
    <View style={styles.root}>
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
              onPress={() => pickPreset(color)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityLabel={CATEGORY_COLOR_NAMES[color]}
              accessibilityState={{ checked: selected }}
            >
              {selected && <Icon name="check" size={16} color={colors.onSwatch} strokeWidth={2.6} />}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.colorSwatch,
            styles.customSwatch,
            isCustom && { backgroundColor: value },
            isCustom ? styles.colorSwatchSelected : isOpen && styles.customSwatchOpen,
          ]}
          onPress={() => (isOpen ? close() : open())}
          activeOpacity={0.7}
          accessibilityRole="radio"
          accessibilityLabel="Custom colour"
          accessibilityState={{ checked: isCustom, expanded: isOpen }}
        >
          {!isCustom && (
            <LinearGradient style={styles.rainbow} colors={HUE_STOPS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          )}
          <View style={styles.customMark}>
            <Icon name={isCustom ? 'check' : 'plus'} size={isCustom ? 13 : 12} color={colors.text} strokeWidth={2.8} />
          </View>
        </TouchableOpacity>
      </View>

      {isOpen && (
        <CustomColorPanel
          initial={initial}
          draft={value}
          saved={saved}
          icon={icon}
          onPreview={(color) => onPreview?.(color)}
          onApply={(color) => {
            close();
            onChange(color);
          }}
          onCancel={close}
        />
      )}
    </View>
  );
};

export default ColorPicker;
