import { ConfirmationSheet } from '@components';
import type { MemberActionTarget } from '../../types';

interface Props {
  target: Extract<MemberActionTarget, { kind: 'remove' | 'revoke' }> | null;
  spaceName: string;
  isPending: boolean;
  error: string | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

// The history is the space's: authorship and assignment stay on the records when a membership ends.
const KEEP =
  ' What they added or what’s assigned to them stays in this space’s history, labelled Former member; shared operations aren’t redistributed.';

const MemberRemovalDialog = ({ target, spaceName, isPending, error, onConfirm, onCancel }: Props) => {
  const isRevoke = target?.kind === 'revoke';

  return (
    <ConfirmationSheet
      confirmation={
        target && {
          title: isRevoke ? 'Revoke this invite?' : `Remove ${target.label}?`,
          description: isRevoke
            ? `The invite sent to ${target.label} stops working.`
            : `${target.label} loses access to “${spaceName}”.${KEEP}`,
          primaryAction: {
            label: isRevoke ? 'Revoke invite' : 'Remove member',
            tone: 'danger',
            busyLabel: isRevoke ? 'Revoking…' : 'Removing…',
            onPress: onConfirm,
          },
          onCancel,
          isPending,
          message: error ? { text: error } : undefined,
        }
      }
    />
  );
};

export default MemberRemovalDialog;
