import { Platform } from 'react-native';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { default as Picker } from '@react-native-community/datetimepicker';

interface Props {
  value: Date;
  mode?: 'date' | 'time';
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
}

// 'compact' on iOS renders a small pill that opens a floating popover on tap
// (no inline expansion); Android has no such trigger style, so 'default'
// there is what pops the OS dialog when this component gets mounted.
const DateTimePicker = ({ value, mode = 'date', onChange }: Props) => {
  return (
    <Picker mode={mode} value={value} onChange={onChange} display={Platform.OS === 'ios' ? 'compact' : 'default'} />
  );
};

export default DateTimePicker;
