import { useState } from 'react';
import { ScrollView, View, Dimensions } from 'react-native';

import type { RadioButtonProps } from '@components';
import RadioButton from '../RadioButton/RadioButton';

import styles from './style';

interface Props<T> {
  buttons: Omit<RadioButtonProps<T>, 'onPress'>[];
  onPress: RadioButtonProps<T>['onPress'];
}

const RadioButtonGroup = <T extends number | string>({ buttons, onPress }: Props<T>) => {
  const screenWidth = Dimensions.get('window').width;
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);

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
      scrollEnabled={maxWidth !== undefined}
      style={styles.root}
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={handleContentSizeChange}
    >
      <View style={[styles.container, maxWidth ? { maxWidth } : {}]}>
        {buttons.map((button) => (
          <RadioButton key={button.value} {...button} onPress={onPress} />
        ))}
      </View>
    </ScrollView>
  );
};

export default RadioButtonGroup;
