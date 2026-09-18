export interface SpaceMember {
  type: 'member' | 'invite';
  id: number;
  name: string | null;
  email: string;
  role: 'owner' | 'member' | null;
  can_remove: boolean;
}

export interface InviteRequest {
  email: string;
}

export interface InviteResponse {
  id: number;
  email: string;
  expires_at: string;
  code: string;
}
