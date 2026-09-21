import { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import DateTimePicker from '@components/Form/DateTimePicker/DateTimePicker';
import Icon from '@components/Icon/Icon';
import type { IconType } from '@shared/types';
import { colors } from '@shared/theme';
import { formatDateHHMM, formatGroupLabel } from '@shared/utils';
import type { TransactionFormData } from '../useTransactionForm';

import styles from './style';

interface DateFieldProps {
  icon?: IconType;
  label: string;
  mode: 'date' | 'time';
  value: Date;
  onPick: (date: Date) => void;
}

// iOS's compact picker (see DateTimePicker) is its own tappable trigger; Android needs our label to mount it on tap.
const DateField = ({ icon, label, mode, value, onPick }: DateFieldProps) => {
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.pickerBox}>
        {icon && <Icon name={icon} size={16} color={colors.muted} strokeWidth={1.8} />}
        <DateTimePicker mode={mode} value={value} onChange={onPick} />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.pickerBox} onPress={() => setOpen(true)} activeOpacity={0.6}>
        {icon && <Icon name={icon} size={16} color={colors.muted} strokeWidth={1.8} />}
        <Text style={styles.pickerText}>{label}</Text>
      </TouchableOpacity>

      {open && (
        <DateTimePicker
          mode={mode}
          value={value}
          onChange={(picked) => {
            setOpen(false);
            onPick(picked);
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </>
  );
};

interface Props {
  control: Control<TransactionFormData>;
}

const DateTimeRow = ({ control }: Props) => (
  <View style={styles.dateTimeRow}>
    <View style={[styles.section, styles.dateBox]}>
      <Text style={styles.sectionLabel}>Date</Text>

      <Controller
        name="date"
        control={control}
        render={({ field: { onChange, value } }) => (
          <DateField
            icon="calendar"
            mode="date"
            label={formatGroupLabel(value)}
            value={value}
            onPick={(picked) => {
              const next = new Date(value);
              next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
              onChange(next);
            }}
          />
        )}
      />
    </View>

    <View style={[styles.section, styles.timeBox]}>
      <Text style={styles.sectionLabel}>Time</Text>

      <Controller
        name="date"
        control={control}
        render={({ field: { onChange, value } }) => (
          <DateField
            mode="time"
            label={formatDateHHMM(value)}
            value={value}
            onPick={(picked) => {
              const next = new Date(value);
              next.setHours(picked.getHours(), picked.getMinutes());
              onChange(next);
            }}
          />
        )}
      />
    </View>
  </View>
);

export default DateTimeRow;
