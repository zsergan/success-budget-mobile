import { useState } from 'react';
import { Platform, Text, TouchableOpacity } from 'react-native';
import Picker from '@react-native-community/datetimepicker';

import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { formatDateHHMM } from '@shared/utils';

import createStyles from './style';

interface Props {
  value: Date;
  maximumDate?: Date;
  onChange: (time: Date) => void;
}

// iOS shows the hour and minute wheel in place; Android opens its clock dialog from the shown time.
const TimeField = ({ value, maximumDate, onChange }: Props) => {
  const { scheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [isOpen, setOpen] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <Picker
        mode="time"
        display="spinner"
        themeVariant={scheme}
        value={value}
        maximumDate={maximumDate}
        onValueChange={(_, time) => onChange(time)}
        style={styles.wheel}
      />
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.timeButton} onPress={() => setOpen(true)} activeOpacity={0.6}>
        <Text style={styles.timeText}>{formatDateHHMM(value)}</Text>
      </TouchableOpacity>

      {isOpen && (
        <Picker
          mode="time"
          themeVariant={scheme}
          value={value}
          onValueChange={(_, time) => {
            setOpen(false);
            onChange(time);
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default TimeField;
