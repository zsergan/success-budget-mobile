import type { AppListener } from '@redux/Store';
import { persistInvitation } from './storage';

// Storage follows every change of the intent (kept, replaced, answered, declined or signed out of), even with nothing
// loaded yet, so a sign-out before the stored link was read still removes it.
export const startInvitationPersistence = (listener: AppListener) => {
  listener.startListening({
    predicate: (_action, current, previous) => current.invitation.revision !== previous.invitation.revision,
    effect: (_action, { getState }) => {
      void persistInvitation(getState());
    },
  });
};
