import { Text, TouchableOpacity, View } from 'react-native';

import type { SpaceMember } from '@api/dto';
import Icon from '@components/Icon/Icon';
import { useTheme, useThemedStyles } from '@hooks';
import type { ResendAvailability } from '../../hooks/useInviteResend';

import createStyles from './style';

interface Props {
  member: SpaceMember;
  isSelf: boolean;
  // Server-authoritative can_remove intersected with what the client can
  // actually act on safely -- see MembersList for why these can differ.
  canAct: boolean;
  onActionPress: () => void;
  // A pending invitation whose email did not go out; `resend` only for the owner.
  deliveryFailure?: { resend: ResendAvailability | null; onResend: () => void };
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

const MemberRow = ({ member, isSelf, canAct, onActionPress, deliveryFailure }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const isInvite = member.type === 'invite';
  const tag = isInvite
    ? 'Invited'
    : isSelf
      ? member.role === 'owner'
        ? 'Owner · you'
        : 'You'
      : member.role === 'owner'
        ? 'Owner'
        : null;

  const resend = deliveryFailure?.resend;
  const resendLabel = resend && resend.waitSeconds > 0 ? `Resend in ${resend.waitSeconds}s` : 'Resend';

  return (
    <View style={styles.row}>
      <View style={[styles.rowAvatar, isSelf && styles.rowAvatarSelf]}>
        {member.name && !isInvite ? (
          <Text style={[styles.rowInitials, isSelf && styles.rowInitialsSelf]}>{getInitials(member.name)}</Text>
        ) : (
          <Icon name="user" size={17} color={colors.muted} strokeWidth={1.9} />
        )}
      </View>

      <View style={styles.rowText}>
        <View style={styles.rowNameLine}>
          {/* An invitation never names anyone: whether the address has an account is not shown. */}
          <Text style={styles.rowName} numberOfLines={1}>
            {isInvite ? 'Invited member' : member.name || member.email}
          </Text>

          {tag && (
            <View style={[styles.rowTag, isInvite && styles.rowTagInvite]}>
              <Text style={[styles.rowTagText, isInvite && styles.rowTagTextInvite]}>{tag}</Text>
            </View>
          )}

          {deliveryFailure && (
            <View style={[styles.rowTag, styles.rowTagFailed]} accessibilityLabel="Email not sent">
              <Text style={[styles.rowTagText, styles.rowTagTextFailed]}>Not sent</Text>
            </View>
          )}
        </View>

        {(isInvite || member.name) && (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {member.email}
          </Text>
        )}
      </View>

      {deliveryFailure && resend && (
        <TouchableOpacity
          style={styles.rowResend}
          onPress={deliveryFailure.onResend}
          disabled={!resend.isAvailable}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${resendLabel} invitation email`}
          accessibilityState={{ disabled: !resend.isAvailable, busy: resend.isResending }}
        >
          <Text style={[styles.rowResendText, !resend.isAvailable && styles.rowResendTextDisabled]}>{resendLabel}</Text>
        </TouchableOpacity>
      )}

      {canAct && (
        <TouchableOpacity
          style={styles.rowRemove}
          onPress={onActionPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isInvite ? 'Revoke invite' : 'Remove member'}
        >
          <Icon name="close" size={14} color={colors.danger} strokeWidth={2.1} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MemberRow;
