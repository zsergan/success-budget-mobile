import type { InviteRequest } from '@api/dto';
import {
  getMembers,
  inviteMember as inviteMemberRequest,
  revokeInvite as revokeInviteRequest,
  removeMember as removeMemberRequest,
  acceptInvite as acceptInviteRequest,
} from '@api/member.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

import { activateSpace, fetchSpaces } from '../space/thunks';

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

// The owner removing someone else -- the space itself is unaffected, so a
// plain refresh of both members (list) and spaces (member_count/role) is
// safe. For the caller leaving their own space, use `leaveSpace` instead:
// that call can delete the space entirely, and re-fetching members for a
// space you just lost access to would just 403/404.
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

export const leaveSpace = createAppAsyncThunk('member/leaveSpace', async (_: void, thunkAPI) => {
  const { currentSpaceId } = thunkAPI.getState().space;
  const myUserId = thunkAPI.getState().profile.id;

  if (currentSpaceId === null || myUserId === undefined) {
    return thunkAPI.rejectWithValue(undefined);
  }

  try {
    await removeMemberRequest(currentSpaceId, myUserId);
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }

  // The left space is no longer a valid context for this session -- don't
  // touch `member` state for it. fetchSpaces both refreshes the list and,
  // via its own fallback logic, activates whatever space is valid next
  // (which synchronously clears wallet/category/limit/transaction/member
  // for the old space).
  try {
    await thunkAPI.dispatch(fetchSpaces()).unwrap();
  } catch {
    // Leaving already succeeded server-side; a failed list refresh is
    // surfaced through fetchSpaces' own error state, not re-thrown here.
  }
});

export const acceptInvite = createAppAsyncThunk('member/acceptInvite', async (code: string, thunkAPI) => {
  let space;

  try {
    space = await acceptInviteRequest(code);
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }

  // The response carries the joined space's real id -- use that directly
  // rather than diffing the space list before/after, which breaks the
  // moment two joins race or the list order isn't stable.
  thunkAPI.dispatch(activateSpace(space.id));

  try {
    await thunkAPI.dispatch(fetchSpaces()).unwrap();
  } catch {
    // The invite was accepted and the space is already selected; a failed
    // list refresh doesn't undo that and shouldn't fail this thunk.
  }

  return space;
});
