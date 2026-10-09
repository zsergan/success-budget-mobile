import type { AppStore } from '@redux/Store';
import { profileApi } from './api';

// The signed-in user a write is stored under, held as the signed-in app holds it.
export const withProfile = (store: AppStore, id = 1) => {
  store.dispatch(
    profileApi.util.upsertQueryEntries([
      { endpointName: 'getProfile', arg: undefined, value: { id, email: 'anna@example.com', name: 'Anna' } },
    ]),
  );
  store.dispatch(profileApi.endpoints.getProfile.initiate());
};
