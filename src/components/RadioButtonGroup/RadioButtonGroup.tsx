import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, View, Dimensions } from 'react-native';

import type { RadioButtonProps } from '@components';
import RadioButton from '../RadioButton/RadioButton';

import styles from './style';

interface Props<T> {
  buttons: Omit<RadioButtonProps<T>, 'onPress'>[];
  onPress: RadioButtonProps<T>['onPress'];
  limitRows?: boolean;
  radioButtonGroupContainerStyle?: StyleProp<ViewStyle>;
}

const RadioButtonGroup = <T extends number | string>({
  buttons,
  onPress,
  limitRows = true,
  radioButtonGroupContainerStyle,
}: Props<T>) => {
  const screenWidth = Dimensions.get('window').width;
  const [maxWidth, setMaxWidth] = useState<number | '100%' | undefined>(limitRows ? undefined : '100%');

  const handleContentSizeChange = (contentWidth: number) => {
    if (contentWidth > screenWidth && !maxWidth) {
      const rowsAmount = contentWidth / 3 < screenWidth ? 2 : 3;
      // 100 is sum of margins and paddings
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
      <View style={[styles.container, maxWidth ? { maxWidth } : {}, radioButtonGroupContainerStyle]}>
        {buttons.map((button) => (
          <RadioButton key={button.value} {...button} onPress={onPress} />
        ))}
      </View>
    </ScrollView>
  );
};

export default RadioButtonGroup;
