import { Text, TextInput, View } from 'react-native';
import { Controller, type Control } from 'react-hook-form';

import { Icon } from '@components';
import KeyboardDoneBar from '@components/Form/KeyboardDoneBar/KeyboardDoneBar';
import { useTheme, useThemedStyles } from '@hooks';
import type { LimitFormValues } from '../limitSchema';

import createStyles from './style';
import { currencySymbol } from '@shared/utils/currency';

const AMOUNT_DONE_BAR = 'limit-amount-done';

interface Props {
  control: Control<LimitFormValues>;
  isGroup: boolean;
  isTotal: boolean;
  currencyCode?: string;
  onNameChange: (value: string) => void;
  spentHint?: string;
}

const NameAmountFields = ({ control, isGroup, isTotal, currencyCode, onNameChange, spentHint }: Props) => {
  const { scheme, colorTheme } = useTheme();
  const { colors } = colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <>
      {isGroup && (
        <View style={styles.nameSection}>
          <Text style={styles.sectionLabel}>Limit name</Text>

          <Controller
            name="name"
            control={control}
            render={({ field: { value }, fieldState: { error } }) => (
              <>
                <View style={[styles.nameBox, !!error && styles.nameBoxWithError]}>
                  <TextInput
                    keyboardAppearance={scheme}
                    style={styles.nameInput}
                    value={value}
                    onChangeText={onNameChange}
                  />

                  <Text style={styles.nameHint}>auto from categories</Text>
                </View>

                {error && <Text style={styles.nameError}>{error.message}</Text>}
              </>
            )}
          />
        </View>
      )}

      <Controller
        name="amount"
        control={control}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>{isTotal ? 'All expenses this month' : 'Monthly limit'}</Text>

            <View style={styles.heroRow}>
              <TextInput
                keyboardAppearance={scheme}
                value={value}
                onChangeText={onChange}
                placeholder="0"
                placeholderTextColor={colors.muted}
                inputMode="decimal"
                style={styles.heroAmount}
                returnKeyType="done"
                inputAccessoryViewID={AMOUNT_DONE_BAR}
              />

              <KeyboardDoneBar nativeID={AMOUNT_DONE_BAR} />

              {currencyCode && <Text style={styles.heroCurrency}>{currencySymbol(currencyCode)}</Text>}
            </View>

            <Text style={[styles.heroSub, !!error && styles.heroSubError]}>
              {error?.message ??
                (isTotal
                  ? 'Cap for every expense in the space, whoever it’s assigned to'
                  : 'Counted across the whole space, whoever it’s assigned to')}
            </Text>
          </View>
        )}
      />

      {spentHint && (
        <View style={styles.spentContext}>
          <Icon name="info" size={16} color={colors.muted} strokeWidth={1.9} />

          <Text style={styles.spentContextText}>{spentHint}</Text>
        </View>
      )}
    </>
  );
};

export default NameAmountFields;
