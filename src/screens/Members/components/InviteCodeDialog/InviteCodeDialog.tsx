import { useState } from 'react';
import { Share, Text, View } from 'react-native';

import type { InviteResponse } from '@api/dto';
import { ConfirmationSheet } from '@components';
import { useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  invite: InviteResponse | null;
  spaceName: string;
  onClose: () => void;
}

const InviteCodeDialog = ({ invite, spaceName, onClose }: Props) => {
  const styles = useThemedStyles(createStyles);
  // A failed share, said in the dialog while it stays open; it belongs to the invite it was for.
  const [failedCode, setFailedCode] = useState<string | null>(null);
  const shareError =
    invite && failedCode === invite.code ? 'Couldn’t open sharing. Try again, or copy the code.' : null;

  // Dismissing the share sheet resolves the promise, so only a real failure reaches the catch.
  const share = (code: string) => {
    setFailedCode(null);
    return Share.share({ message: `Join "${spaceName}" on Success Budget -- use invite code ${code}` }).catch(() =>
      setFailedCode(code),
    );
  };

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
          ...(shareError && { message: { text: shareError } }),
          primaryAction: { label: 'Share invite', onPress: () => share(invite.code) },
          secondaryAction: { label: 'Close', onPress: onClose },
          onCancel: onClose,
        }
      }
    />
  );
};

export default InviteCodeDialog;
