import { ActivityIndicator, Text, View } from 'react-native';

import type { InvitePreview } from '@api/dto';
import { Banner } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { formatDateLong } from '@shared/utils/transform';
import type { AcceptProblem } from '../../acceptProblem';

import createStyles from './style';

interface Props {
  preview: InvitePreview | undefined;
  isLoading: boolean;
  problem: AcceptProblem | null;
  waitSeconds: number;
}

// What the opened link invites to: no inviter or members, which the server does not reveal before joining.
const LinkInvitation = ({ preview, isLoading, problem, waitSeconds }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const problemText =
    problem?.kind === 'rateLimited' && waitSeconds > 0
      ? `Too many attempts. Try again in ${waitSeconds} s.`
      : problem?.message;

  return (
    <View style={styles.root}>
      {isLoading && <ActivityIndicator color={colors.muted} accessibilityLabel="Loading the invitation" />}

      {preview && (
        <View style={styles.card}>
          <Text style={styles.spaceName}>{preview.space.name}</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Currency</Text>
            <Text style={styles.rowValue}>{`${preview.space.currency.code} · ${preview.space.currency.name}`}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Invitation expires</Text>
            <Text style={styles.rowValue}>{formatDateLong(preview.expires_at)}</Text>
          </View>
        </View>
      )}

      {problem && problemText && (
        <Banner tone={problem.kind === 'wrongAccount' ? 'warn' : 'danger'} text={problemText} />
      )}
    </View>
  );
};

export default LinkInvitation;
