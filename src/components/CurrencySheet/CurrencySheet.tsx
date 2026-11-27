import { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';

import type { Currency } from '@api/dto';
import Icon from '@components/Icon/Icon';
import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import useSheetPresence from '@hooks/useSheetPresence';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { currencySymbol, deviceCurrencyCode, matchesCurrency, orderCurrencies } from '@shared/utils/currency';

import createStyles from './style';

interface Props {
  isVisible: boolean;
  currencies: Currency[];
  selectedId?: number;
  title?: string;
  onSelect: (currency: Currency) => void;
  // A swipe, the backdrop or Android Back; not called after a pick.
  onClose: () => void;
}

// Every currency, searchable by code, name or symbol: the chosen one and the phone's region's come first.
const CurrencySheet = ({ isVisible, currencies, selectedId, title = 'Currency', onSelect, onClose }: Props) => {
  const { colors } = useTheme().colorTheme;
  const { scheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { ref, settleDismiss } = useSheetPresence(isVisible);
  const [query, setQuery] = useState('');

  const ordered = useMemo(() => {
    const selectedCode = currencies.find((currency) => currency.id === selectedId)?.code;
    const suggested = [selectedCode, deviceCurrencyCode()].filter((code): code is string => !!code);

    return orderCurrencies(currencies, suggested);
  }, [currencies, selectedId]);
  const shown = useMemo(() => ordered.filter((currency) => matchesCurrency(currency, query)), [ordered, query]);

  const handleDismiss = () => {
    setQuery('');
    if (settleDismiss()) onClose();
  };

  return (
    <BottomModal ref={ref} snapPoint="85%" topInset={insets.top} showHandle onDismiss={handleDismiss}>
      <View style={styles.root}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>

        <View style={styles.search}>
          <Icon name="search" size={17} color={colors.muted} strokeWidth={1.8} />
          <BottomSheetTextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, code or symbol"
            placeholderTextColor={colors.placeholder}
            keyboardAppearance={scheme}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search currencies"
          />
        </View>

        <BottomSheetFlatList
          data={shown}
          keyExtractor={(currency) => String(currency.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + styles.list.paddingBottom }]}
          ListEmptyComponent={<Text style={styles.empty}>No currency matches “{query.trim()}”.</Text>}
          renderItem={({ item: currency }) => {
            const isSelected = currency.id === selectedId;

            return (
              <TouchableOpacity
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => onSelect(currency)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${currency.name}, ${currency.code}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.symbolBox}>
                  <Text style={styles.symbol} numberOfLines={1} adjustsFontSizeToFit>
                    {currencySymbol(currency.code)}
                  </Text>
                </View>

                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {currency.name}
                  </Text>
                  <Text style={styles.code}>{currency.code}</Text>
                </View>

                {isSelected && <Icon name="check" size={16} color={colors.accent} strokeWidth={2.6} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </BottomModal>
  );
};

export default CurrencySheet;
