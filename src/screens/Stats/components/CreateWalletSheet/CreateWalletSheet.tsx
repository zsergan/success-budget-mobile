import { Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetView, useBottomSheet } from '@gorhom/bottom-sheet';

import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  onCreateWallet: () => void;
}

const CreateWalletSheet = ({ onCreateWallet }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const { close } = useBottomSheet();

  const handleCreate = () => {
    close();
    onCreateWallet();
  };

  return (
    <BottomSheetView style={styles.root}>
      <View style={styles.handle} />

      <View style={styles.header}>
        <Text style={styles.title}>Create a wallet first</Text>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => close()}
          activeOpacity={0.6}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Icon name="close" size={14} color={colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.iconBox}>
          <Icon name="wallet" size={24} color={colors.text} strokeWidth={1.8} />
        </View>

        <Text style={styles.description}>
          Every transaction belongs to a wallet — cash, a card or savings. Create one, then add your first transaction.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreate}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Icon name="plus" size={16} color={colors.onAccent} strokeWidth={2.3} />
        <Text style={styles.createButtonText}>Create wallet</Text>
      </TouchableOpacity>
    </BottomSheetView>
  );
};

export default CreateWalletSheet;
