import type { InviteRequest, InviteResponse, SpaceMember } from './dto';
import { ApiClient } from './instance';

const api = ApiClient();

export const getMembers = async (spaceId: number) => {
  const response = await api.get<SpaceMember[]>(`/spaces/${spaceId}/members`);

  return response.data;
};

export const inviteMember = async (spaceId: number, data: InviteRequest) => {
  const response = await api.post<InviteResponse>(`/spaces/${spaceId}/invites`, data);

  return response.data;
};

export const revokeInvite = async (spaceId: number, inviteId: number) => {
  await api.deleteRequest(`/spaces/${spaceId}/invites/${inviteId}`);
};

export const removeMember = async (spaceId: number, userId: number) => {
  await api.deleteRequest(`/spaces/${spaceId}/members/${userId}`);
};

export const acceptInvite = async (code: string) => {
  await api.post(`/spaces/invites/accept`, { code });
};
