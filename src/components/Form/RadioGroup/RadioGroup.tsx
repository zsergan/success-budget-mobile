import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, View } from 'react-native';

import type { TinyButtonProps } from '@components/Buttons/TinyButton/TinyButton';
import TinyButton from '@components/Buttons/TinyButton/TinyButton';

import useLayout from '@hooks/useLayout';
import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

export type RadioButtons<T> = Omit<TinyButtonProps, 'onPress'> & {
  value: T;
};

interface Props<T> {
  buttons: RadioButtons<T>[];
  onPress: (value: T) => void;
  value?: T;
  limitRows?: boolean;
  radioGroupContainerStyle?: StyleProp<ViewStyle>;
}

const RadioGroup = <T extends number | string>({
  buttons,
  onPress,
  value,
  limitRows = true,
  radioGroupContainerStyle,
}: Props<T>) => {
  const styles = useThemedStyles(createStyles);
  const screenWidth = useLayout().width;
  const [maxWidth, setMaxWidth] = useState<number | undefined>(limitRows ? undefined : screenWidth);

  const handleContentSizeChange = (contentWidth: number) => {
    if (contentWidth > screenWidth && !maxWidth) {
      const rowsAmount = contentWidth / 3 < screenWidth ? 2 : 3;
      setMaxWidth(contentWidth / rowsAmount + 100);
    }
  };

  return (
    <ScrollView
      horizontal
      scrollEnabled={maxWidth !== undefined && limitRows}
      style={styles.root}
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={limitRows ? handleContentSizeChange : undefined}
    >
      <View style={[styles.container, maxWidth ? { maxWidth } : {}, radioGroupContainerStyle]}>
        {buttons.map(({ value: buttonValue, selected, ...button }) => (
          <TinyButton
            key={buttonValue}
            selected={selected ? selected : buttonValue === value}
            onPress={() => onPress(buttonValue)}
            {...button}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default RadioGroup;
