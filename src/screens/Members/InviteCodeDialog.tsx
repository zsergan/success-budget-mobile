import { Share, Text, View } from 'react-native';

import type { InviteResponse } from '@api/dto';
import { BottomModal } from '@components';

import styles from './style';

interface Props {
  invite: InviteResponse | null;
  spaceName: string;
  onClose: () => void;
}

const InviteCodeDialog = ({ invite, spaceName, onClose }: Props) => {
  const handleShare = () => {
    if (!invite) return;

    Share.share({ message: `Join "${spaceName}" on Success Budget -- use invite code ${invite.code}` }).catch(() => {});
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
