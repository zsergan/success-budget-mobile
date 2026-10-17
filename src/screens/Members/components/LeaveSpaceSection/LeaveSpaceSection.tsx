import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { useTheme, useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  isOwner: boolean;
  canLeave: boolean;
  onPress: () => void;
}

const LeaveSpaceSection = ({ isOwner, canLeave, onPress }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={[styles.leaveButton, !canLeave && styles.leaveButtonDisabled]}
        onPress={onPress}
        disabled={!canLeave}
        activeOpacity={0.7}
      >
        <Icon name="logout" size={17} color={colors.danger} strokeWidth={2} />
        <Text style={styles.leaveButtonText}>Leave this space</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        {!canLeave
          ? "Couldn't find your own membership row -- pull to refresh before leaving."
          : isOwner
            ? 'As the owner you can remove anyone but yourself. Leaving hands the space to the next member.'
            : 'Only the owner can remove other members. Leaving takes you out of this space -- your own wallets stay untouched.'}
      </Text>
    </View>
  );
};

export default LeaveSpaceSection;
