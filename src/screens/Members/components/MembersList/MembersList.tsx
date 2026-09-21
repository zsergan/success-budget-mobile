import { Text, View } from 'react-native';

import type { SpaceInviteRow, SpaceMemberRow } from '@api/dto';
import type { MemberActionTarget } from '../../types';
import MemberRow from '../MemberRow/MemberRow';

import styles from './style';

interface Props {
  memberRows: SpaceMemberRow[];
  inviteRows: SpaceInviteRow[];
  ownUserId?: number;
  isRefreshing: boolean;
  onActionPress: (target: MemberActionTarget) => void;
}

// The type says user_id is always a number, but that's only true once the
// backend's compat PR is deployed everywhere -- an older server still
// omits it. Never fall back to the membership id (member.id) for a
// destructive call; treat a missing user_id as "can't safely act on this
// row" instead, regardless of what the server's own can_remove said.
const hasUsableUserId = (userId: unknown): userId is number => typeof userId === 'number';

const MembersList = ({ memberRows, inviteRows, ownUserId, isRefreshing, onActionPress }: Props) => {
  const memberCount = memberRows.length;
  const countLabel = [
    `${memberCount} member${memberCount === 1 ? '' : 's'}`,
    inviteRows.length > 0 ? `${inviteRows.length} pending` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const hasUnsafeRemovalTarget = memberRows.some((member) => member.can_remove && !hasUsableUserId(member.user_id));

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.label}>In this space</Text>
        <Text style={styles.countLabel}>{countLabel}</Text>
      </View>

      <View style={styles.rows}>
        {memberRows.map((member) => {
          const canAct = member.can_remove && hasUsableUserId(member.user_id);

          return (
            <MemberRow
              key={`member-${member.id}`}
              member={member}
              isSelf={member.user_id === ownUserId}
              canAct={canAct}
              onActionPress={() => {
                if (!hasUsableUserId(member.user_id)) return;

                onActionPress({ kind: 'remove', userId: member.user_id, label: member.name || member.email });
              }}
            />
          );
        })}

        {inviteRows.map((invite) => (
          <MemberRow
            key={`invite-${invite.id}`}
            member={invite}
            isSelf={false}
            canAct={invite.can_remove}
            onActionPress={() => onActionPress({ kind: 'revoke', inviteId: invite.id, label: invite.email })}
          />
        ))}
      </View>

      {hasUnsafeRemovalTarget && (
        <Text style={styles.hint}>
          Removing some members isn&apos;t available right now -- try again after updating the app.
        </Text>
      )}

      {isRefreshing && <Text style={styles.hint}>Refreshing…</Text>}
    </View>
  );
};

export default MembersList;
