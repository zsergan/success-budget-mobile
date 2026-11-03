import { Text, TouchableOpacity, View } from 'react-native';

import type { SpaceInviteRow, SpaceMemberRow } from '@api/dto';
import { useThemedStyles } from '@hooks';
import type { ResendAvailability } from '../../hooks/useInviteResend';
import type { MemberActionTarget } from '../../types';
import MemberRow from '../MemberRow/MemberRow';

import createStyles from './style';

interface Props {
  memberRows: SpaceMemberRow[];
  inviteRows: SpaceInviteRow[];
  ownUserId?: number;
  isRefreshing: boolean;
  // Only a failed background refresh; the initial load error replaces the list a level up.
  refreshFailed: boolean;
  onRetry: () => void;
  onActionPress: (target: MemberActionTarget) => void;
  // Null for anyone but the owner, who alone can resend.
  resendAvailabilityOf?: (invite: SpaceInviteRow) => ResendAvailability | null;
  onResend?: (invite: SpaceInviteRow) => void;
}

// Only a failure needs the reader's attention; a queued, sending or sent email leaves the row as it is.
const hasDeliveryFailed = ({ email_status }: SpaceInviteRow) =>
  email_status === 'failed' || email_status === 'not_sent';

// Never substitute the membership id (member.id) for user_id: without a user_id the row
// is not actionable, whatever can_remove says.
const hasUsableUserId = (userId: unknown): userId is number => typeof userId === 'number';

const MembersList = ({
  memberRows,
  inviteRows,
  ownUserId,
  isRefreshing,
  refreshFailed,
  onRetry,
  onActionPress,
  resendAvailabilityOf = () => null,
  onResend = () => {},
}: Props) => {
  const styles = useThemedStyles(createStyles);
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
            deliveryFailure={
              hasDeliveryFailed(invite)
                ? { resend: resendAvailabilityOf(invite), onResend: () => onResend(invite) }
                : undefined
            }
          />
        ))}
      </View>

      {hasUnsafeRemovalTarget && (
        <Text style={styles.hint}>
          Removing some members isn&apos;t available right now -- try again after updating the app.
        </Text>
      )}

      {isRefreshing && <Text style={styles.hint}>Refreshing…</Text>}

      {refreshFailed && !isRefreshing && (
        <View style={styles.refreshErrorRow}>
          <Text style={styles.hint}>Couldn&apos;t refresh the list.</Text>
          <TouchableOpacity onPress={onRetry} hitSlop={8}>
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default MembersList;
