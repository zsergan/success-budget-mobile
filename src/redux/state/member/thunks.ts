import type { InviteRequest } from '@api/dto';
import {
  getMembers,
  inviteMember as inviteMemberRequest,
  revokeInvite as revokeInviteRequest,
  removeMember as removeMemberRequest,
  acceptInvite as acceptInviteRequest,
} from '@api/member.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

import { isSessionActive } from '../auth/thunks';
import { selectProfileId } from '../profile/selectors';
import { baseApi } from '@redux/api/baseApi';
import { pickFallbackSpaceId, selectSpaces } from '../space/selectors';
import { activateSpace, isSpaceContextCurrent } from '../space/thunks';

export const fetchMembers = createAppAsyncThunk('member/fetchMembers', async (_: void, thunkAPI) => {
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    return await getMembers(spaceId);
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const inviteMember = createAppAsyncThunk('member/inviteMember', async (email: string, thunkAPI) => {
  const { currentSpaceId: spaceId, contextKey } = thunkAPI.getState().space;
  const sessionKey = thunkAPI.getState().auth.sessionKey;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    const invite = await inviteMemberRequest(spaceId, { email } satisfies InviteRequest);

    // The user may have switched away from this space while the request
    // was in flight -- its own activation already reset (and will reload)
    // member state, so a refresh here would either be wasted or, worse,
    // race that fresh load.
    if (isSpaceContextCurrent(thunkAPI.getState, contextKey)) {
      thunkAPI.dispatch(fetchMembers());
    }

    return invite;
  } catch (error: unknown) {
    // A logout while this was in flight must not let a late 429 start a
    // cooldown a future session would inherit -- unlike contextKey, which
    // also (correctly) changes on an ordinary space switch, sessionKey
    // only changes when the session itself ends.
    const isSessionStale = thunkAPI.getState().auth.sessionKey !== sessionKey;

    return thunkAPI.rejectWithValue({ ...getRejectValue(error), isStale: isSessionStale });
  }
});

export const revokeInvite = createAppAsyncThunk('member/revokeInvite', async (inviteId: number, thunkAPI) => {
  const { currentSpaceId: spaceId, contextKey } = thunkAPI.getState().space;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    await revokeInviteRequest(spaceId, inviteId);

    if (isSpaceContextCurrent(thunkAPI.getState, contextKey)) {
      thunkAPI.dispatch(fetchMembers());
    }
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

// The owner removing someone else -- the space itself is unaffected, so a
// plain refresh of both members (list) and spaces (member_count/role) is
// safe. For the caller leaving their own space, use `leaveSpace` instead:
// that call can delete the space entirely, and re-fetching members for a
// space you just lost access to would just 403/404.
export const removeMember = createAppAsyncThunk('member/removeMember', async (userId: number, thunkAPI) => {
  const { currentSpaceId: spaceId, contextKey } = thunkAPI.getState().space;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    await removeMemberRequest(spaceId, userId);

    if (isSpaceContextCurrent(thunkAPI.getState, contextKey)) {
      thunkAPI.dispatch(fetchMembers());
      thunkAPI.dispatch(baseApi.util.invalidateTags(['Spaces']));
    }
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const leaveSpace = createAppAsyncThunk('member/leaveSpace', async (_: void, thunkAPI) => {
  const { currentSpaceId } = thunkAPI.getState().space;
  const myUserId = selectProfileId(thunkAPI.getState());

  if (currentSpaceId === null || myUserId === undefined) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    await removeMemberRequest(currentSpaceId, myUserId);
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }

  if (!isSessionActive(thunkAPI.getState)) return;

  // The space we just left is invalid the instant the DELETE succeeds --
  // don't wait on the spaces refresh (which can itself fail) to stop
  // treating it as the active context. Only touch the active space if the
  // user is still on the one just left; if they'd already switched away
  // while this was in flight, leave their current selection alone.
  if (thunkAPI.getState().space.currentSpaceId === currentSpaceId) {
    const remaining = selectSpaces(thunkAPI.getState()).filter((space) => space.id !== currentSpaceId);

    thunkAPI.dispatch(activateSpace(pickFallbackSpaceId(remaining)));
  }

  thunkAPI.dispatch(baseApi.util.invalidateTags(['Spaces']));
});

export const acceptInvite = createAppAsyncThunk('member/acceptInvite', async (code: string, thunkAPI) => {
  let space;

  try {
    space = await acceptInviteRequest(code);
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }

  // A logout that happened while this accept was in flight must not go on
  // to select the joined space for a session that no longer exists.
  if (isSessionActive(thunkAPI.getState)) {
    // The response carries the joined space's real id -- use that directly
    // rather than diffing the space list before/after, which breaks the
    // moment two joins race or the list order isn't stable.
    thunkAPI.dispatch(activateSpace(space.id));
    thunkAPI.dispatch(baseApi.util.invalidateTags(['Spaces']));
  }

  return space;
});
