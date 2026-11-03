import Banner from '@components/Banner/Banner';
import { useAppSelector } from '@redux/hooks';
import { selectPendingInvitationToken } from '@redux/state/invitation/selectors';

// Signed out with an opened invitation: only the invited address can join, and the invitation follows the sign-in.
const PendingInvitationNotice = () => {
  const hasInvitation = useAppSelector(selectPendingInvitationToken) !== null;

  if (!hasInvitation) return null;

  return (
    <Banner
      tone="warn"
      title="You’ve been invited to a space"
      text="Sign in or create an account with the email the invitation was sent to. You’ll see the invitation right after."
    />
  );
};

export default PendingInvitationNotice;
