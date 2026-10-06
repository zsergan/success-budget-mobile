import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CreateTransactionResult } from '@api/models';
import Icon from '@components/Icon/Icon';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { TransactionType } from '@shared/enums';
import theme, { colors } from '@shared/theme';
import { formatAmount, formatCurrencyAmount, hexToRgba } from '@shared/utils';

import styles from './style';

interface Props {
  created: CreateTransactionResult;
  onAddAnother: () => void;
  onDone: () => void;
}

// Shown only after the API confirmed the create.
const CreatedConfirmation = ({ created: { transaction, wallet, previousBalance }, onAddAnother, onDone }: Props) => {
  const insets = useSafeAreaInsets();
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const typeColor = transaction.transactionType === TransactionType.INCOME ? colors.ok : colors.danger;

  return (
    <View style={[styles.root, { paddingBottom: theme.spacing.xl + insets.bottom }]}>
      <View style={styles.handle} />

      <View style={[styles.check, { backgroundColor: hexToRgba(typeColor, 0.12) }]}>
        <Icon name="check" size={28} color={typeColor} strokeWidth={2.4} />
      </View>

      <Text style={styles.title}>Transaction saved</Text>

      <Text style={[styles.amount, { color: typeColor }]}>
        {formatAmount(transaction.amount, transaction.transactionType, currencyCode)}
      </Text>

      <Text style={styles.meta} numberOfLines={1}>
        {`${transaction.category.name} · ${wallet.wallet_name}`}
      </Text>

      <Text style={styles.balance}>
        {`${wallet.wallet_name} balance ${formatCurrencyAmount(wallet.balance, currencyCode)} · was ${formatCurrencyAmount(previousBalance, currencyCode)}`}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onAddAnother} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>Add another</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={onDone} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CreatedConfirmation;
