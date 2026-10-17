import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { useAlert, useTheme, useThemedStyles } from '@hooks';

import createStyles from './style';

const MAX_INVITES = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  emails: string[];
  onChange: (emails: string[]) => void;
}

const InviteChips = ({ emails, onChange }: Props) => {
  const { scheme, colorTheme } = useTheme();
  const { colors } = colorTheme;
  const styles = useThemedStyles(createStyles);
  const [draft, setDraft] = useState('');
  const { addAlert } = useAlert();

  const addEmail = () => {
    const email = draft.trim().toLowerCase();

    if (!email) return;

    if (!EMAIL_PATTERN.test(email)) {
      addAlert('Enter a valid email address');
      return;
    }

    if (emails.includes(email)) {
      addAlert('That email is already invited');
      return;
    }

    if (emails.length >= MAX_INVITES) {
      addAlert(`You can invite up to ${MAX_INVITES} people at once`);
      return;
    }

    onChange([...emails, email]);
    setDraft('');
  };

  const removeEmail = (email: string) => {
    onChange(emails.filter((existing) => existing !== email));
  };

  return (
    <View style={styles.invitesContainer}>
      {emails.map((email) => (
        <View key={email} style={styles.inviteRow}>
          <Icon name="mail" size={17} color={colors.muted} strokeWidth={1.9} />

          <Text style={styles.inviteEmail} numberOfLines={1}>
            {email}
          </Text>

          <TouchableOpacity style={styles.inviteRemove} onPress={() => removeEmail(email)} hitSlop={8}>
            <Icon name="close" size={13} color={colors.muted} strokeWidth={2.1} />
          </TouchableOpacity>
        </View>
      ))}

      {emails.length < MAX_INVITES && (
        <View style={styles.inviteInputRow}>
          <Icon name="mail" size={17} color={colors.muted} strokeWidth={1.9} />

          <TextInput
            keyboardAppearance={scheme}
            style={styles.inviteInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="name@email.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={addEmail}
          />

          {draft.length > 0 && (
            <TouchableOpacity style={styles.inviteAdd} onPress={addEmail} hitSlop={8}>
              <Icon name="plus" size={14} color={colors.text} strokeWidth={2.2} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text style={styles.hint}>
        {emails.length >= MAX_INVITES
          ? `Up to ${MAX_INVITES} invites at a time.`
          : 'Invitations go out when the space is created.'}
      </Text>
    </View>
  );
};

export default InviteChips;
