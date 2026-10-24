import type { TextInput } from 'react-native';
import { Keyboard } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import type { Confirmation } from '@components';
import { ConfirmationSheet, PasswordInput } from '@components';
import useDeleteAccountFlow from './hooks/useDeleteAccountFlow';

// The sheet's input renders the same TextInput; only its ref type is wider.
const SheetTextInput = BottomSheetTextInput as unknown as typeof TextInput;

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

// A preview of account deletion: nothing here checks the password or sends a request, and the last step's button is
// disabled until the backend supports it.
const DeleteAccountDialog = ({ isVisible, onClose }: Props) => {
  const { step, password, passwordError, goToPassword, goToWarning, setPassword, continueFromPassword, reset } =
    useDeleteAccountFlow();

  const close = () => {
    reset();
    onClose();
  };

  const confirmation = (): Confirmation => {
    switch (step) {
      case 'warning':
        return {
          step: 'Step 1 of 3',
          title: 'Delete this account for good?',
          description: 'This cannot be undone. Nothing can be restored afterwards — we keep no backups.',
          consequences: {
            tone: 'danger',
            title: 'What gets deleted',
            items: [
              'Your wallets and their balances',
              'Your full transaction history',
              'Your limits and their history',
              'Your categories, archived ones included',
            ],
          },
          primaryAction: { label: 'Continue', onPress: goToPassword },
          secondaryAction: { label: 'Keep my account', onPress: close },
          onCancel: close,
        };
      case 'password':
        return {
          step: 'Step 2 of 3',
          title: 'Confirm with your password',
          description: 'Enter your account password so we know the request came from you.',
          children: (
            <PasswordInput
              variant="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              hint="Forgot it? Reset the password first, then come back."
              textInputComponent={SheetTextInput}
            />
          ),
          primaryAction: {
            label: 'Continue',
            onPress: () => {
              Keyboard.dismiss();
              continueFromPassword();
            },
          },
          secondaryAction: { label: 'Back', onPress: goToWarning },
          onCancel: close,
        };
      case 'confirm':
        return {
          step: 'Step 3 of 3',
          title: 'One last check',
          description:
            'Deleting removes your account and all of its data immediately. There is no way back — not through support, not by signing up again with the same email.',
          primaryAction: { label: 'Delete account', tone: 'danger', isDisabled: true, onPress: () => {} },
          onCancel: close,
          note: 'Account deletion isn’t available yet, so your password wasn’t checked. This is a preview of the flow.',
        };
    }
  };

  return <ConfirmationSheet confirmation={isVisible ? confirmation() : null} />;
};

export default DeleteAccountDialog;
