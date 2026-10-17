import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { useTheme, useThemedStyles } from '@hooks';
import { INVITE_EXPIRY_DAYS, SPACE_LIMITS } from '@shared/constants';

import createStyles from './style';

interface Props {
  canInvite: boolean;
  isAtMemberCap: boolean;
  isAtInviteCap: boolean;
  cooldownRemaining: number;
  isSubmitting: boolean;
  failedEmail: string | null;
  onSubmit: (email: string) => Promise<boolean>;
}

const InviteMemberSection = ({
  canInvite,
  isAtMemberCap,
  isAtInviteCap,
  cooldownRemaining,
  isSubmitting,
  failedEmail,
  onSubmit,
}: Props) => {
  const { scheme, colorTheme } = useTheme();
  const { colors } = colorTheme;
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState('');
  const [seenFailedEmail, setSeenFailedEmail] = useState<string | null>(null);

  // Keep a failed attempt's email in the box so the user can fix and
  // resubmit it instead of retyping.
  if (failedEmail !== seenFailedEmail) {
    setSeenFailedEmail(failedEmail);
    if (failedEmail !== null) setEmail(failedEmail);
  }

  const handleSubmit = async () => {
    if (await onSubmit(email)) setEmail('');
  };

  const isCapped = isAtMemberCap || isAtInviteCap;
  const isDisabled = isSubmitting || cooldownRemaining > 0 || !canInvite;

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Invite by email</Text>

      {isCapped ? (
        <Text style={styles.hint}>
          {isAtMemberCap
            ? `This space has reached its ${SPACE_LIMITS.MAX_MEMBERS_PER_SPACE}-member limit.`
            : `There are already ${SPACE_LIMITS.MAX_PENDING_INVITES_PER_SPACE} pending invites -- revoke one before sending another.`}
        </Text>
      ) : (
        <>
          <View style={styles.inviteRow}>
            <Icon name="mail" size={18} color={colors.muted} strokeWidth={1.9} />

            <TextInput
              keyboardAppearance={scheme}
              style={styles.inviteInput}
              value={email}
              onChangeText={setEmail}
              placeholder="name@email.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              editable={!isDisabled}
              onSubmitEditing={handleSubmit}
            />

            <TouchableOpacity
              style={[styles.inviteButton, isDisabled && styles.inviteButtonDisabled]}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              <Text style={styles.inviteButtonText}>
                {cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Invite'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            {cooldownRemaining > 0
              ? `Too many invites sent -- try again in ${cooldownRemaining}s.`
              : `There's no email -- after you invite, share the code with them yourself. Invites expire after ${INVITE_EXPIRY_DAYS} days if unused.`}
          </Text>
        </>
      )}
    </View>
  );
};

export default InviteMemberSection;
