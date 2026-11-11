import type { AppThunk } from '@redux/Store';
import { INVITE_EXPIRY_DAYS, INVITE_LINK_ORIGIN } from '@shared/constants';
import { parseInviteLink } from '@shared/utils/inviteLink';
import { logoutMe } from '../auth/thunks';
import { invitationLinkOpened, invitationRestored } from './slice';
import { persistInvitation, readInvitation } from './storage';

// No invitation stays active longer, so an intent kept past this can only be answered with "unusable".
export const PENDING_INVITATION_LIFETIME_MS = INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

const isOutlived = (storedAt: number) => Date.now() - storedAt >= PENDING_INVITATION_LIFETIME_MS;

// Keeps the token of an invitation link, signed in or not; any other URL is ignored. Resolves whether it was one.
export const receiveInvitationLink =
  (url: string): AppThunk<boolean> =>
  (dispatch) => {
    const token = parseInviteLink(url, INVITE_LINK_ORIGIN);
    if (!token) return false;

    dispatch(invitationLinkOpened({ token, storedAt: Date.now() }));

    return true;
  };

// The intent kept through a registration, a verification or a restart. What was read is dropped unused when the intent
// changed meanwhile (a newer link, a sign-out, a decline): storage already follows that change.
export const restoreInvitation = (): AppThunk<Promise<void>> => async (dispatch, getState) => {
  const { revision } = getState().invitation;
  const stored = await readInvitation();
  if (getState().invitation.revision !== revision || !stored) return;

  // Writes what is pending now, queued after any earlier write, so it never removes a newer link.
  if (isOutlived(stored.storedAt)) await persistInvitation(getState());
  else dispatch(invitationRestored(stored));
};

// The user leaves to answer the invitation with the invited account; the intent waits for the next sign-in.
export const switchAccountForInvitation = (): AppThunk<Promise<void>> => async (dispatch) => {
  await dispatch(logoutMe({ reason: 'accountSwitch' }));
};
