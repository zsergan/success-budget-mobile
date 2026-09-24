import { Text, TextInput, View } from 'react-native';
import { Controller, type Control } from 'react-hook-form';

import { Icon } from '@components';
import { colors } from '@shared/theme';
import type { LimitFormValues } from '../limitSchema';

import styles from './style';

interface Props {
  control: Control<LimitFormValues>;
  isGroup: boolean;
  isTotal: boolean;
  currencyCode?: string;
  onNameChange: (value: string) => void;
  spentHint?: string;
}

const NameAmountFields = ({ control, isGroup, isTotal, currencyCode, onNameChange, spentHint }: Props) => (
  <>
    {isGroup && (
      <View style={styles.nameSection}>
        <Text style={styles.sectionLabel}>Limit name</Text>

        <View style={styles.nameBox}>
          <Controller
            name="name"
            control={control}
            render={({ field: { value } }) => (
              <TextInput style={styles.nameInput} value={value} onChangeText={onNameChange} />
            )}
          />

          <Text style={styles.nameHint}>auto from categories</Text>
        </View>
      </View>
    )}

    <View style={styles.hero}>
      <Text style={styles.heroLabel}>{isTotal ? 'All expenses this month' : 'Monthly limit'}</Text>

      <View style={styles.heroRow}>
        <Controller
          name="amount"
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="0"
              placeholderTextColor={colors.muted}
              inputMode="decimal"
              style={styles.heroAmount}
              returnKeyType="done"
            />
          )}
        />

        {currencyCode && <Text style={styles.heroCurrency}>{currencyCode}</Text>}
      </View>

      <Text style={styles.heroSub}>
        {isTotal ? 'Cap for every expense across all wallets' : 'Counted across all wallets together'}
      </Text>
    </View>

    {spentHint && (
      <View style={styles.spentContext}>
        <Icon name="info" size={16} color={colors.muted} strokeWidth={1.9} />

        <Text style={styles.spentContextText}>{spentHint}</Text>
      </View>
    )}
  </>
);

export default NameAmountFields;
