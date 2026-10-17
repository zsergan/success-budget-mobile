import { Text } from 'react-native';

import { BottomModal } from '@components';
import { useThemedStyles } from '@hooks';
import type { MemberActionTarget } from '../../types';

import createStyles from './style';

interface Props {
  target: Extract<MemberActionTarget, { kind: 'remove' | 'revoke' }> | null;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const MemberRemovalDialog = ({ target, isPending, onConfirm, onCancel }: Props) => {
  const styles = useThemedStyles(createStyles);
  const isRevoke = target?.kind === 'revoke';

  return (
    <BottomModal
      isVisible={!!target}
      onClose={onCancel}
      disabled={isPending}
      content={
        <Text style={styles.confirmText}>
          {isRevoke ? 'Revoke this invite?' : `Remove ${target?.label} from this space?`}
        </Text>
      }
      actions={[
        {
          title: isPending ? (isRevoke ? 'Revoking…' : 'Removing…') : isRevoke ? 'Revoke invite' : 'Remove member',
          onPress: onConfirm,
        },
      ]}
    />
  );
};

export default MemberRemovalDialog;
