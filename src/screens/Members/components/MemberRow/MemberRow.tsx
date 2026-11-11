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
  // A pending invitation whose email did not go out.
  isDeliveryFailed?: boolean;
  // Another email for a pending invitation, for the owner only.
  resend?: { availability: ResendAvailability; onResend: () => void };
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

const MemberRow = ({ member, isSelf, canAct, onActionPress, isDeliveryFailed = false, resend }: Props) => {
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

  const availability = resend?.availability;
  const resendLabel =
    availability && availability.waitSeconds > 0 ? `Resend in ${availability.waitSeconds}s` : 'Resend';

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
          <Text style={styles.rowName} numberOfLines={2}>
            {isInvite ? 'Invited member' : member.name || member.email}
          </Text>

          {tag && (
            <View style={[styles.rowTag, isInvite && styles.rowTagInvite]}>
              <Text style={[styles.rowTagText, isInvite && styles.rowTagTextInvite]}>{tag}</Text>
            </View>
          )}
        </View>

        {(isInvite || member.name) && (
          // The middle goes first, so both the start of the address and its domain stay readable.
          <Text style={styles.rowMeta} numberOfLines={1} ellipsizeMode="middle">
            {isDeliveryFailed && (
              <Text style={styles.rowMetaFailed} accessibilityLabel="Email not sent">
                {'Not sent · '}
              </Text>
            )}
            {member.email}
          </Text>
        )}
      </View>

      {resend && availability && (
        // Quiet unless the email failed: a sent one may still not have arrived, but nothing is known to be wrong.
        <TouchableOpacity
          style={[
            styles.rowResend,
            !isDeliveryFailed && styles.rowResendQuiet,
            !availability.isAvailable && styles.rowResendDisabled,
          ]}
          onPress={resend.onResend}
          disabled={!availability.isAvailable}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${resendLabel} invitation email`}
          accessibilityState={{ disabled: !availability.isAvailable, busy: availability.isResending }}
        >
          <Icon name="refresh" size={15} color={isDeliveryFailed ? colors.text : colors.muted} strokeWidth={2} />
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
