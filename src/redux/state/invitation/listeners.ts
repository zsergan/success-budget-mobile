import type { AppListener } from '@redux/Store';
import { persistInvitation } from './storage';

// Storage follows every change of the intent: kept, replaced, answered, declined or signed out of.
export const startInvitationPersistence = (listener: AppListener) => {
  listener.startListening({
    predicate: (_action, current, previous) => current.invitation.pending !== previous.invitation.pending,
    effect: (_action, { getState }) => {
      void persistInvitation(getState());
    },
  });
};
