import { Share, Text, View } from 'react-native';

import type { InviteResponse } from '@api/dto';
import { ConfirmationSheet } from '@components';
import { getErrorMessage } from '@shared/utils';
import { useAlert, useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  invite: InviteResponse | null;
  spaceName: string;
  onClose: () => void;
}

const InviteCodeDialog = ({ invite, spaceName, onClose }: Props) => {
  const styles = useThemedStyles(createStyles);
  const { addAlert } = useAlert();

  // Dismissing the share sheet resolves the promise, so only a real failure reaches the catch.
  const share = (code: string) =>
    Share.share({ message: `Join "${spaceName}" on Success Budget -- use invite code ${code}` }).catch(
      (error: unknown) => addAlert(getErrorMessage(error)),
    );

  return (
    <ConfirmationSheet
      confirmation={
        invite && {
          title: `Invite sent to ${invite.email}`,
          description:
            'There’s no email — this code is shown only once. Share it or send it to them yourself; it works until it’s used or expires.',
          context: (
            <View style={styles.codeContainer}>
              <Text style={styles.code} selectable>
                {invite.code}
              </Text>
            </View>
          ),
          primaryAction: { label: 'Share invite', onPress: () => share(invite.code) },
          secondaryAction: { label: 'Close', onPress: onClose },
          onCancel: onClose,
        }
      }
    />
  );
};

export default InviteCodeDialog;
