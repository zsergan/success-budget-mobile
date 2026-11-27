import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';

import type { Currency } from '@api/dto';
import CurrencySheet from '@components/CurrencySheet/CurrencySheet';
import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { currencySymbol } from '@shared/utils/currency';

import createOutlinedStyles from '../OutlinedField/style';
import OutlinedField from '../OutlinedField/OutlinedField';

interface Props {
  currencies: Currency[];
  value: number | undefined;
  // Filled in while nothing is picked, e.g. the currency of the phone's region.
  defaultId?: number;
  onChange: (currencyId: number) => void;
  // Called when the list closes, picked or not, the way a text field reports a blur.
  onBlur?: () => void;
  label?: string;
  hint?: string;
  error?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export const currencyLabel = (currency: Currency) =>
  `${currencySymbol(currency.code)}  ${currency.name} · ${currency.code}`;

// An outlined field that opens the searchable currency list.
const CurrencyField = ({
  currencies,
  value,
  defaultId,
  onChange,
  onBlur,
  label,
  hint,
  error,
  isLoading,
  disabled,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const outlinedStyles = useThemedStyles(createOutlinedStyles);
  const [isOpen, setOpen] = useState(false);
  const selected = currencies.find((currency) => currency.id === value);
  useEffect(() => {
    if (value === undefined && defaultId !== undefined) onChange(defaultId);
  }, [value, defaultId, onChange]);

  const shownText = isLoading ? 'Loading currencies…' : selected ? currencyLabel(selected) : 'Pick a currency';

  const close = () => {
    setOpen(false);
    onBlur?.();
  };

  return (
    <>
      <OutlinedField
        label={label}
        hint={hint}
        error={error}
        iconLeft="currency"
        isFocused={isOpen}
        disabled={disabled || isLoading}
        onPress={() => setOpen(true)}
        valueText={shownText}
        isBusy={isLoading}
        trailing={
          isLoading ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : (
            <Icon name="chevron-down" size={19} color={colors.muted} strokeWidth={1.9} />
          )
        }
      >
        <Text style={[outlinedStyles.value, !selected && outlinedStyles.placeholder]} numberOfLines={1}>
          {shownText}
        </Text>
      </OutlinedField>

      <CurrencySheet
        isVisible={isOpen}
        currencies={currencies}
        selectedId={value}
        title={label}
        onSelect={(currency) => {
          onChange(currency.id);
          close();
        }}
        onClose={close}
      />
    </>
  );
};

export default CurrencyField;
