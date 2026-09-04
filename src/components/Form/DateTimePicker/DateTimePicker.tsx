import { Platform } from 'react-native';
import { default as Picker } from '@react-native-community/datetimepicker';

interface Props {
  value: Date;
  mode?: 'date' | 'time';
  onChange: (date: Date) => void;
  /** Fired when the picker is dismissed without a value being picked (Android's cancel). */
  onDismiss?: () => void;
}

// 'compact' on iOS renders a small pill that opens a floating popover on tap
// (no inline expansion); Android has no such trigger style, so 'default'
// there is what pops the OS dialog when this component gets mounted.
const DateTimePicker = ({ value, mode = 'date', onChange, onDismiss }: Props) => {
  return (
    <Picker
      mode={mode}
      value={value}
      onValueChange={(_, date) => onChange(date)}
      onDismiss={onDismiss}
      display={Platform.OS === 'ios' ? 'compact' : 'default'}
    />
  );
};

export default DateTimePicker;
