import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { default as Picker } from '@react-native-community/datetimepicker';

interface Props {
  value: Date;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
}

const DateTimePicker = ({ value, onChange }: Props) => {
  return <Picker mode="date" value={value} onChange={onChange} />;
};

export default DateTimePicker;
