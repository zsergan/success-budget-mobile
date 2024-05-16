import { View } from 'react-native';

import type { RadioButtonProps } from '@components';
import RadioButton from '../RadioButton/RadioButton';

import styles from './style';

interface Props {
  buttons: Omit<RadioButtonProps, 'onPress'>[];
  onPress: (value: number) => void;
}

const RadioButtonGroup = ({ buttons, onPress }: Props) => {
  return (
    <View style={styles.root}>
      {buttons.map((button) => (
        <RadioButton
          key={button.value}
          label={button.label}
          value={button.value}
          selected={button.selected}
          onPress={onPress}
        />
      ))}
    </View>
  );
};

export default RadioButtonGroup;
