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

const MembersList = ({ memberRows, inviteRows, ownUserId, isRefreshing, onActionPress }: Props) => {
  const memberCount = memberRows.length;
  const countLabel = [
    `${memberCount} member${memberCount === 1 ? '' : 's'}`,
    inviteRows.length > 0 ? `${inviteRows.length} pending` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.label}>In this space</Text>
        <Text style={styles.countLabel}>{countLabel}</Text>
      </View>

      <View style={styles.rows}>
        {memberRows.map((member) => (
          <MemberRow
            key={`member-${member.id}`}
            member={member}
            isSelf={member.user_id === ownUserId}
            onActionPress={() =>
              onActionPress({ kind: 'remove', userId: member.user_id, label: member.name || member.email })
            }
          />
        ))}

        {inviteRows.map((invite) => (
          <MemberRow
            key={`invite-${invite.id}`}
            member={invite}
            isSelf={false}
            onActionPress={() => onActionPress({ kind: 'revoke', inviteId: invite.id, label: invite.email })}
          />
        ))}
      </View>

      {isRefreshing && <Text style={styles.hint}>Refreshing…</Text>}
    </View>
  );
};

export default MembersList;
