import * as SecureStore from 'expo-secure-store';

import type { RootState } from '@redux/Store';
import { PENDING_INVITATION_KEY } from '@shared/constants';
import type { PendingInvitation } from './slice';

// Writes go out one after another, so an older snapshot never lands over a newer one.
let lastWrite: Promise<unknown> = Promise.resolve();

// Platform-protected storage only: the token is a credential for joining a space.
export const persistInvitation = (state: RootState): Promise<boolean> => {
  const { pending } = state.invitation;
  const snapshot = pending && JSON.stringify({ token: pending.token, storedAt: pending.storedAt });
  const saved = lastWrite
    .then(() =>
      snapshot
        ? SecureStore.setItemAsync(PENDING_INVITATION_KEY, snapshot)
        : SecureStore.deleteItemAsync(PENDING_INVITATION_KEY),
    )
    .then(
      () => true,
      () => false,
    );

  lastWrite = saved;

  return saved;
};

const isPendingInvitation = (value: unknown): value is PendingInvitation => {
  const pending = value as Partial<PendingInvitation> | null;

  return typeof pending?.token === 'string' && typeof pending.storedAt === 'number';
};

export const readInvitation = async (): Promise<PendingInvitation | null> => {
  try {
    const stored: unknown = JSON.parse((await SecureStore.getItemAsync(PENDING_INVITATION_KEY)) ?? 'null');

    return isPendingInvitation(stored) ? stored : null;
  } catch {
    return null;
  }
};
