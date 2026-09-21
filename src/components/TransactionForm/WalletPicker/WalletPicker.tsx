import { Text, TouchableOpacity, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { GetWalletsResponse } from '@api/dto';
import { gradients, resolveAppColor } from '@shared/constants';
import { hexToRgba } from '@shared/utils';
import type { TransactionFormData } from '../useTransactionForm';

import styles from './style';

interface Props {
  control: Control<TransactionFormData>;
  wallets: GetWalletsResponse[];
  typeColor: string;
}

const WalletPicker = ({ control, wallets, typeColor }: Props) => (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>Wallet</Text>

    <Controller
      name="wallet_id"
      control={control}
      render={({ field: { onChange, value } }) => (
        <View style={styles.walletsRow}>
          {wallets.map(({ wallet: { id, wallet_name, design } }) => {
            const selected = value === id;
            const dotColor = gradients[resolveAppColor(design)][0];

            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.walletChip,
                  selected && { backgroundColor: hexToRgba(typeColor, 0.09), borderColor: typeColor },
                ]}
                onPress={() => onChange(id)}
                activeOpacity={0.6}
              >
                <View style={[styles.walletDot, { backgroundColor: dotColor }]} />

                <Text style={[styles.walletChipText, selected && { color: typeColor }]} numberOfLines={1}>
                  {wallet_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    />
  </View>
);

export default WalletPicker;
