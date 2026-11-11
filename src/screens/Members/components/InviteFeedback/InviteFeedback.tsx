import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import type { InviteEmailStatus } from '@api/dto';
import Icon from '@components/Icon/Icon';
import { useTheme, useThemedStyles } from '@hooks';
import type { ResendAvailability } from '../../hooks/useInviteResend';

import createStyles from './style';

interface Props {
  email: string;
  // The roster's state of the invitation's email once it has one, else the create response's; undefined from a server
  // that sends none.
  status: InviteEmailStatus | undefined;
  resend: ResendAvailability;
  onRetry: () => void;
  onShareCode: () => void;
}

// Says only what the server knows: queued is not sent, and sent means the mail server took it, not that it arrived.
const describe = (status: InviteEmailStatus | undefined) => {
  switch (status) {
    case 'queued':
    case 'sending':
      return { title: 'Invitation created', detail: 'Sending email…', isPending: true, isFailed: false };
    case 'sent':
      return { title: 'Invitation email sent', detail: null, isPending: false, isFailed: false };
    case 'failed':
    case 'not_sent':
      return { title: 'Couldn’t send the email', detail: null, isPending: false, isFailed: true };
    default:
      return { title: 'Invitation created', detail: null, isPending: false, isFailed: false };
  }
};

const InviteFeedback = ({ email, status, resend, onRetry, onShareCode }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const { title, detail, isPending, isFailed } = describe(status);
  const retryLabel = resend.waitSeconds > 0 ? `Retry in ${resend.waitSeconds}s` : 'Retry';

  return (
    <View style={[styles.card, isFailed && styles.cardFailed]} accessibilityLiveRegion="polite">
      {isPending ? (
        <ActivityIndicator size="small" color={colors.muted} />
      ) : (
        <Icon
          name={isFailed ? 'alert' : status === 'sent' ? 'mail-check' : 'mail'}
          size={18}
          color={isFailed ? colors.danger : colors.muted}
          strokeWidth={1.9}
        />
      )}

      <View style={styles.text}>
        <Text style={[styles.title, isFailed && styles.titleFailed]}>{title}</Text>
        <Text style={styles.detail} numberOfLines={1}>
          {detail ?? email}
        </Text>
      </View>

      <View style={styles.actions}>
        {isFailed && (
          <TouchableOpacity
            onPress={onRetry}
            disabled={!resend.isAvailable}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            accessibilityState={{ disabled: !resend.isAvailable, busy: resend.isResending }}
          >
            <Text style={[styles.link, !resend.isAvailable && styles.linkDisabled]}>{retryLabel}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onShareCode} hitSlop={8} accessibilityRole="button" accessibilityLabel="Share code">
          <Text style={styles.link}>Share code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InviteFeedback;
