import { Share, Text, View } from 'react-native';

import type { InviteResponse } from '@api/dto';
import { BottomModal } from '@components';
import { getErrorMessage } from '@shared/utils';
import { useAlert } from '@hooks';

import styles from './style';

interface Props {
  invite: InviteResponse | null;
  spaceName: string;
  onClose: () => void;
}

const InviteCodeDialog = ({ invite, spaceName, onClose }: Props) => {
  const { addAlert } = useAlert();

  const handleShare = () => {
    if (!invite) return;

    // A user dismissing the share sheet resolves the promise (with a
    // dismissedAction), it doesn't reject it -- only a genuine failure
    // (no share targets, OS-level error) reaches this catch, so it's
    // shown, not swallowed. The code stays available either way; nothing
    // here closes the dialog.
    Share.share({ message: `Join "${spaceName}" on Success Budget -- use invite code ${invite.code}` }).catch(
      (error: unknown) => addAlert(getErrorMessage(error)),
    );
  };

  return (
    <BottomModal
      isVisible={!!invite}
      onClose={onClose}
      content={
        <View style={styles.codeContainer}>
          <Text style={styles.codeTitle}>Invite sent to {invite?.email}</Text>

          <Text style={styles.code} selectable>
            {invite?.code}
          </Text>

          <Text style={styles.hint}>
            There&apos;s no email -- this code is shown only once. Share it or send it to them yourself; it works until
            it&apos;s used or expires.
          </Text>
        </View>
      }
      actions={[{ title: 'Share invite', onPress: handleShare }]}
    />
  );
};

export default InviteCodeDialog;
