import type { InviteRequest } from '@api/dto';
import {
  getMembers,
  inviteMember as inviteMemberRequest,
  revokeInvite as revokeInviteRequest,
  removeMember as removeMemberRequest,
  acceptInvite as acceptInviteRequest,
} from '@api/member.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

import { fetchSpaces, setCurrentSpaceId } from '../space/thunks';

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
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    const invite = await inviteMemberRequest(spaceId, { email } satisfies InviteRequest);

    thunkAPI.dispatch(fetchMembers());

    return invite;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const revokeInvite = createAppAsyncThunk('member/revokeInvite', async (inviteId: number, thunkAPI) => {
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    await revokeInviteRequest(spaceId, inviteId);

    thunkAPI.dispatch(fetchMembers());
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

// Serves both "owner removes someone else" and "I'm leaving" -- same
// backend endpoint either way. Refetching fetchSpaces() here is a no-op
// when removing someone else, and is exactly what makes the existing
// fall-back-to-personal logic in fetchSpaces kick in on a self-leave.
export const removeMember = createAppAsyncThunk('member/removeMember', async (userId: number, thunkAPI) => {
  const spaceId = thunkAPI.getState().space.currentSpaceId;

  if (spaceId === null) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    await removeMemberRequest(spaceId, userId);

    thunkAPI.dispatch(fetchMembers());
    thunkAPI.dispatch(fetchSpaces());
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});

export const acceptInvite = createAppAsyncThunk('member/acceptInvite', async (code: string, thunkAPI) => {
  try {
    const previousSpaceIds = new Set(thunkAPI.getState().space.spaces.map((space) => space.id));

    await acceptInviteRequest(code);

    const { spaces } = await thunkAPI.dispatch(fetchSpaces()).unwrap();
    const joinedSpace = spaces.find((space) => !previousSpaceIds.has(space.id));

    if (joinedSpace) {
      thunkAPI.dispatch(setCurrentSpaceId(joinedSpace.id));
    }
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});
