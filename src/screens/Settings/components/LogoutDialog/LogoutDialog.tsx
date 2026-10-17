import { Text } from 'react-native';

import { BottomModal } from '@components';
import { useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutDialog = ({ isVisible, onClose, onConfirm }: Props) => {
  const styles = useThemedStyles(createStyles);

  return (
    <BottomModal
      isVisible={isVisible}
      onClose={onClose}
      content={
        <>
          <Text style={styles.confirmText}>Log out of your account?</Text>
          <Text style={styles.confirmSubtext}>
            Your data stays on the server. Sign back in with the same email and password.
          </Text>
        </>
      }
      actions={[{ title: 'Log out', onPress: onConfirm }]}
    />
  );
};

export default LogoutDialog;
