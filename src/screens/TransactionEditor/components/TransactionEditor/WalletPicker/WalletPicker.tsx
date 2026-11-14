import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import type { Wallet } from '@api/dto';
import Icon from '@components/Icon/Icon';
import type { ListLoad } from '@screens/TransactionEditor/components/SectionLoad/SectionLoad';
import SectionLoad from '@screens/TransactionEditor/components/SectionLoad/SectionLoad';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { resolveAppColor } from '@shared/constants';
import { hexToRgba } from '@shared/utils';

import createStyles from './style';

const GHOST_WIDTHS = [80, 76, 96];

interface Props {
  load: ListLoad;
  wallets: Wallet[];
  // The record's own deleted wallet: kept until another one is picked and saved.
  hasDeletedWallet: boolean;
  selectedId: number | null;
  // Why the row looks as it does: a deleted wallet kept, or no wallet to save to.
  hint?: string;
  typeColor: string;
  onSelect: (walletId: number | null) => void;
  onCreate: () => void;
  onRetry: () => void;
}

const WalletPicker = ({
  load,
  wallets,
  hasDeletedWallet,
  selectedId,
  hint,
  typeColor,
  onSelect,
  onCreate,
  onRetry,
}: Props) => {
  // A wallet's dot takes its colour's flat tone, as categories do; the card gradient is too dark on a dark chip.
  const { colors, categories } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const selectedStyle = { backgroundColor: hexToRgba(typeColor, 0.09), borderColor: typeColor };
  const hasNothingToPick = wallets.length === 0 && !hasDeletedWallet;

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Wallet</Text>

      {load === 'loading' ? (
        <View style={styles.ghostRow} accessibilityLabel="Loading wallets">
          {GHOST_WIDTHS.map((width) => (
            <View key={width} style={[styles.ghostChip, { width }]} />
          ))}
        </View>
      ) : load === 'failed' ? (
        <SectionLoad load={load} name="wallets" icon="wallet" onRetry={onRetry} />
      ) : hasNothingToPick ? (
        <View style={styles.empty}>
          <View style={styles.emptyTexts}>
            <Text style={styles.emptyTitle}>No wallets yet</Text>
            <Text style={styles.emptyText}>Create one to save — this draft stays open.</Text>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={onCreate}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Icon name="plus" size={13} color={colors.onSecondary} strokeWidth={2.3} />
            <Text style={styles.createButtonText}>Create wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.row}
          keyboardShouldPersistTaps="handled"
        >
          {hasDeletedWallet && (
            <TouchableOpacity
              style={[styles.chip, styles.deletedChip, selectedId === null && selectedStyle]}
              onPress={() => onSelect(null)}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedId === null }}
            >
              <View style={[styles.dot, styles.deletedDot]} />
              <Text style={[styles.chipText, selectedId !== null && styles.mutedText]}>Deleted wallet</Text>
            </TouchableOpacity>
          )}

          {wallets.map(({ id, wallet_name, design }) => {
            const isSelected = selectedId === id;

            return (
              <TouchableOpacity
                key={id}
                style={[styles.chip, isSelected && selectedStyle]}
                onPress={() => onSelect(id)}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.dot, { backgroundColor: categories[resolveAppColor(design)].stroke }]} />

                <Text style={styles.chipText} numberOfLines={1}>
                  {wallet_name}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.chip, styles.newChip]}
            onPress={onCreate}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="New wallet"
          >
            <Icon name="plus" size={13} color={colors.muted} strokeWidth={2.3} />
            <Text style={[styles.chipText, styles.mutedText]}>New</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {hint && (
        <View style={styles.noteRow}>
          <Icon name="info" size={14} color={colors.muted} strokeWidth={1.9} />
          <Text style={styles.note}>{hint}</Text>
        </View>
      )}
    </View>
  );
};

export default WalletPicker;
