import { Text, TouchableOpacity, View } from 'react-native';

import createStyles from './style';

import { useThemedStyles } from '@hooks';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count: number;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const SegmentedControl = <T extends string>({ options, value, onChange }: Props<T>) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
            <Text style={styles.count}>{option.count}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default SegmentedControl;
