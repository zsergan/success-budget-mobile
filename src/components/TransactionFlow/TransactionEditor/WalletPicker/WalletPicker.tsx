import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import type { Wallet } from '@api/dto';
import Icon from '@components/Icon/Icon';
import { gradients, resolveAppColor } from '@shared/constants';
import { colors } from '@shared/theme';
import { hexToRgba } from '@shared/utils';

import styles from './style';

interface Props {
  wallets: Wallet[];
  // The record's own deleted wallet: kept until another one is picked and saved.
  hasDeletedWallet: boolean;
  selectedId: number | null;
  // Why the row looks as it does: a deleted wallet kept, or no wallet to save to.
  hint?: string;
  typeColor: string;
  onSelect: (walletId: number | null) => void;
  onCreate: () => void;
}

const WalletPicker = ({ wallets, hasDeletedWallet, selectedId, hint, typeColor, onSelect, onCreate }: Props) => {
  const selectedStyle = { backgroundColor: hexToRgba(typeColor, 0.09), borderColor: typeColor };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Wallet</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.walletsRow}
        keyboardShouldPersistTaps="handled"
      >
        {hasDeletedWallet && (
          <TouchableOpacity
            style={[styles.walletChip, styles.deletedChip, selectedId === null && selectedStyle]}
            onPress={() => onSelect(null)}
            activeOpacity={0.6}
            accessibilityState={{ selected: selectedId === null }}
          >
            <View style={[styles.walletDot, styles.deletedDot]} />
            <Text style={[styles.walletChipText, styles.deletedText]}>Deleted wallet</Text>
          </TouchableOpacity>
        )}

        {wallets.map(({ id, wallet_name, design }) => {
          const isSelected = selectedId === id;

          return (
            <TouchableOpacity
              key={id}
              style={[styles.walletChip, isSelected && selectedStyle]}
              onPress={() => onSelect(id)}
              activeOpacity={0.6}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={[styles.walletDot, { backgroundColor: gradients[resolveAppColor(design)][0] }]} />

              <Text style={[styles.walletChipText, isSelected && { color: typeColor }]} numberOfLines={1}>
                {wallet_name}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.walletChip, wallets.length === 0 && styles.newChipProminent]}
          onPress={onCreate}
          activeOpacity={0.6}
        >
          <Icon name="plus" size={13} color={colors.text} strokeWidth={2.1} />
          <Text style={styles.walletChipText}>New wallet</Text>
        </TouchableOpacity>
      </ScrollView>

      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

export default WalletPicker;
