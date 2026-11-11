import type {
  AcceptInviteRequest,
  InvitePreview,
  InvitePreviewRequest,
  InviteResponse,
  InviteState,
  SpaceMember,
  SpaceSummary,
} from '@api/dto';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi, invalidatesOnSuccess, spaceTags } from '@redux/api/baseApi';

export const memberApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMembers: build.query<SpaceMember[], SpaceArg>({
      query: ({ spaceId }) => ({ url: `/spaces/${spaceId}/members` }),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Members'),
    }),
    inviteMember: build.mutation<InviteResponse, SpaceArg & { email: string }>({
      query: ({ spaceId, email }) => ({ url: `/spaces/${spaceId}/invites`, method: 'POST', body: { email } }),
      invalidatesTags: invalidatesOnSuccess((_result, { spaceId }) => spaceTags(spaceId, 'Members')),
    }),
    // Asks for the roster again after any answer but a stale one: a refused or unanswered resend may still have
    // scheduled an email, a 429 moves the cooldown and a 404 means the invitation ended.
    resendInvite: build.mutation<InviteState, SpaceArg & { inviteId: number }>({
      query: ({ spaceId, inviteId }) => ({ url: `/spaces/${spaceId}/invites/${inviteId}/resend`, method: 'POST' }),
      invalidatesTags: (_result, error, { spaceId }) => (error?.isStale ? [] : spaceTags(spaceId, 'Members')),
    }),
    revokeInvite: build.mutation<void, SpaceArg & { inviteId: number }>({
      query: ({ spaceId, inviteId }) => ({ url: `/spaces/${spaceId}/invites/${inviteId}`, method: 'DELETE' }),
      invalidatesTags: invalidatesOnSuccess((_result, { spaceId }) => spaceTags(spaceId, 'Members')),
    }),
    // The owner removing someone else; the list and the space's member_count change.
    removeMember: build.mutation<void, SpaceArg & { userId: number }>({
      query: ({ spaceId, userId }) => ({ url: `/spaces/${spaceId}/members/${userId}`, method: 'DELETE' }),
      invalidatesTags: invalidatesOnSuccess((_result, { spaceId }) => [...spaceTags(spaceId, 'Members'), 'Spaces']),
    }),
    // Same endpoint as removeMember, but the caller loses access: its members
    // are never refetched, only the spaces list.
    leaveSpace: build.mutation<void, SpaceArg & { userId: number }>({
      query: ({ spaceId, userId }) => ({ url: `/spaces/${spaceId}/members/${userId}`, method: 'DELETE' }),
      invalidatesTags: invalidatesOnSuccess(() => ['Spaces']),
    }),
    // Reads only; POST keeps the link token out of the URL. The invitation screen explains its own 429.
    previewInvite: build.query<InvitePreview, InvitePreviewRequest>({
      query: (body) => ({ url: '/spaces/invites/preview', method: 'POST', body, isHandledRateLimit: () => true }),
    }),
    acceptInvite: build.mutation<SpaceSummary, AcceptInviteRequest>({
      query: (body) => ({ url: '/spaces/invites/accept', method: 'POST', body }),
      invalidatesTags: invalidatesOnSuccess(() => ['Spaces']),
    }),
  }),
});

export const {
  useGetMembersQuery,
  useInviteMemberMutation,
  useResendInviteMutation,
  useRevokeInviteMutation,
  useRemoveMemberMutation,
  usePreviewInviteQuery,
} = memberApi;
