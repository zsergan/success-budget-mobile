import type { Confirmation } from '@components';
import { ConfirmationSheet } from '@components';

interface Props {
  isVisible: boolean;
  spaceName: string;
  isPending: boolean;
  isOwner: boolean;
  memberCount: number;
  error: string | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

// A member just leaves; an owner hands the space to the next member, or deletes it as its last one.
const leaveCopy = (spaceName: string, isOwner: boolean, memberCount: number) => {
  if (!isOwner) {
    return { title: 'Leave this space?', description: `You lose access to “${spaceName}”.`, isDeleting: false };
  }
  if (memberCount > 1) {
    return {
      title: 'Leave this space?',
      description: `You’re the owner, so leaving hands “${spaceName}” to the next member.`,
      isDeleting: false,
    };
  }

  return {
    title: `Leave and delete “${spaceName}”?`,
    description: 'You’re its only member, so leaving permanently deletes this space.',
    isDeleting: true,
  };
};

const LeaveSpaceDialog = ({
  isVisible,
  spaceName,
  isPending,
  isOwner,
  memberCount,
  error,
  onConfirm,
  onCancel,
}: Props) => {
  const { title, description, isDeleting } = leaveCopy(spaceName, isOwner, memberCount);
  const confirmation: Confirmation = {
    title,
    description,
    primaryAction: {
      label: isDeleting ? 'Leave and delete' : 'Leave space',
      tone: isDeleting ? 'danger' : 'neutral',
      busyLabel: 'Leaving…',
      onPress: onConfirm,
    },
    onCancel,
    isPending,
    message: error ? { text: error } : undefined,
  };

  return <ConfirmationSheet confirmation={isVisible ? confirmation : null} />;
};

export default LeaveSpaceDialog;
