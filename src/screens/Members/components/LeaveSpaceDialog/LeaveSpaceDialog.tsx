import { Text } from 'react-native';

import { BottomModal } from '@components';
import { useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  isVisible: boolean;
  isPending: boolean;
  isOwner: boolean;
  memberCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const LeaveSpaceDialog = ({ isVisible, isPending, isOwner, memberCount, onConfirm, onCancel }: Props) => {
  const styles = useThemedStyles(createStyles);
  const message =
    isOwner && memberCount > 1
      ? "You're the owner -- leaving hands ownership to the next member. Continue?"
      : isOwner
        ? "You're the only member -- leaving permanently deletes this space. Continue?"
        : 'Leave this space?';

  return (
    <BottomModal
      isVisible={isVisible}
      onClose={onCancel}
      disabled={isPending}
      content={<Text style={styles.confirmText}>{message}</Text>}
      actions={[{ title: isPending ? 'Leaving…' : 'Leave space', onPress: onConfirm }]}
    />
  );
};

export default LeaveSpaceDialog;
