import type { InvitePreview, SpaceMember } from '@api/dto';
import { createAppStore } from '@redux/Store';
import { loginMe } from '../auth/thunks';
import { memberApi } from './api';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

jest.useFakeTimers();

const signedInStore = () => {
  const store = createAppStore();

  store.dispatch(loginMe.fulfilled('token', 'req-login', { email: 'me@example.com', password: 'password1' }));

  return store;
};

const sent = () => mockedRequest.mock.calls.map(([{ method, url, data }]) => ({ method, url, data }));

const preview: InvitePreview = {
  space: { name: 'Family', currency: { id: 3, code: 'EUR', name: 'Euro' } },
  expires_at: '2026-11-08T10:00:00.000Z',
};

beforeEach(() => jest.clearAllMocks());

describe('member requests', () => {
  it('reads the delivery state of invitation rows from the roster', async () => {
    const store = signedInStore();
    const roster: SpaceMember[] = [
      {
        type: 'member',
        id: 15,
        user_id: 7,
        name: 'Zakhar',
        email: 'owner@example.com',
        role: 'owner',
        can_remove: false,
        email_status: null,
        can_resend: false,
        resend_after_seconds: null,
      },
      {
        type: 'invite',
        id: 87,
        user_id: null,
        name: null,
        email: 'anna@example.com',
        role: null,
        can_remove: true,
        email_status: 'failed',
        can_resend: true,
        resend_after_seconds: 0,
      },
    ];
    mockedRequest.mockResolvedValue({ data: roster });

    const { data } = await store.dispatch(memberApi.endpoints.getMembers.initiate({ spaceId: 41 }));

    expect(data).toEqual(roster);
  });

  it('resends an invitation with no body', async () => {
    const store = signedInStore();
    const state = {
      id: 87,
      email: 'anna@example.com',
      expires_at: '2026-11-08T10:00:00.000Z',
      email_status: 'queued',
      resend_after_seconds: 60,
    };
    mockedRequest.mockResolvedValue({ data: state });

    const result = await store
      .dispatch(memberApi.endpoints.resendInvite.initiate({ spaceId: 41, inviteId: 87 }))
      .unwrap();

    expect(sent()).toEqual([{ method: 'POST', url: '/spaces/41/invites/87/resend', data: undefined }]);
    expect(result).toEqual(state);
  });

  it('previews an invitation with the token in the body, never in the URL', async () => {
    const store = signedInStore();
    mockedRequest.mockResolvedValue({ data: preview });

    const { data } = await store.dispatch(memberApi.endpoints.previewInvite.initiate({ token: '87.proof' }));

    expect(sent()).toEqual([{ method: 'POST', url: '/spaces/invites/preview', data: { token: '87.proof' } }]);
    expect(data).toEqual(preview);
  });

  it('asks for a preview of the same token once while it is cached', async () => {
    const store = signedInStore();
    mockedRequest.mockResolvedValue({ data: preview });

    await store.dispatch(memberApi.endpoints.previewInvite.initiate({ token: '87.proof' }));
    await store.dispatch(memberApi.endpoints.previewInvite.initiate({ token: '87.proof' }));

    expect(mockedRequest).toHaveBeenCalledTimes(1);
  });

  it.each([[{ code: '042917' }], [{ token: '87.proof' }]])('accepts an invitation with %j', async (body) => {
    const store = signedInStore();
    mockedRequest.mockResolvedValue({ data: { id: 41 } });

    await store.dispatch(memberApi.endpoints.acceptInvite.initiate(body)).unwrap();

    expect(sent()[0]).toEqual({ method: 'POST', url: '/spaces/invites/accept', data: body });
  });
});
