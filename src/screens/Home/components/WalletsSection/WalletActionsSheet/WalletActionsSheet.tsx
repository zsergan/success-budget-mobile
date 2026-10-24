import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { WalletCardProps } from '@components';
import { WalletCard } from '@components';
import ConfirmationAction from '@components/ConfirmationSheet/ConfirmationAction/ConfirmationAction';
import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import { useBackPress, useSheetPresence, useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  // Null hides it.
  wallet: Omit<WalletCardProps, 'onMorePress' | 'style'> | null;
  onEdit: () => void;
  onDelete: () => void;
  // A swipe, the backdrop or Android Back.
  onCancel: () => void;
  // Once it has gone, however it was closed.
  onDismissed: () => void;
}

// What can be done with a wallet, under the wallet itself.
const WalletActionsSheet = ({ wallet, onEdit, onDelete, onCancel, onDismissed }: Props) => {
  const styles = useThemedStyles(createStyles);
  const { bottom } = useSafeAreaInsets();
  const isVisible = wallet !== null;
  const [shown, setShown] = useState(wallet);
  if (wallet && wallet !== shown) setShown(wallet);

  const { ref, settleDismiss } = useSheetPresence(isVisible);
  useBackPress(isVisible, onCancel);

  const handleDismiss = () => {
    if (settleDismiss()) onCancel();
    onDismissed();
  };

  return (
    <BottomModal ref={ref} fitContent onDismiss={handleDismiss}>
      {shown && (
        <View style={[styles.sheet, { paddingBottom: Math.max(bottom, 16) }]} accessibilityViewIsModal>
          <WalletCard {...shown} />

          <View style={styles.actions}>
            <ConfirmationAction label="Edit wallet" onPress={onEdit} disabled={!isVisible} />
            <ConfirmationAction label="Delete wallet" tone="danger" onPress={onDelete} disabled={!isVisible} />
          </View>
        </View>
      )}
    </BottomModal>
  );
};

export default WalletActionsSheet;
