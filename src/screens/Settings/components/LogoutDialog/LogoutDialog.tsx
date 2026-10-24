import { ConfirmationSheet } from '@components';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutDialog = ({ isVisible, onClose, onConfirm }: Props) => (
  <ConfirmationSheet
    confirmation={
      isVisible
        ? {
            title: 'Log out of your account?',
            description: 'Your data stays on the server. Sign back in with the same email and password.',
            primaryAction: { label: 'Log out', onPress: onConfirm },
            onCancel: onClose,
          }
        : null
    }
  />
);

export default LogoutDialog;
