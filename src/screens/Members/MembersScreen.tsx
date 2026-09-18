import { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { InviteResponse, SpaceMember } from '@api/dto';
import { BottomModal, Icon, RootLayout, SectionTitle } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectMember } from '@redux/state/member/selectors';
import { fetchMembers, inviteMember, removeMember, revokeInvite } from '@redux/state/member/thunks';
import { selectProfile } from '@redux/state/profile/selectors';
import { selectCurrentSpace, selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { ScreenNames } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { colors } from '@shared/theme';
import { getErrorMessage } from '@shared/utils';
import { useAlert } from '@hooks';
import InviteCodeDialog from './InviteCodeDialog';
import MemberRow from './MemberRow';

import styles from './style';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props extends ScreenProps<ScreenNames.MEMBERS_SCREEN> {}

const MembersScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const { addAlert } = useAlert();

  const currentSpace = useAppSelector(selectCurrentSpace);
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const { members } = useAppSelector(selectMember);
  const { email: myEmail } = useAppSelector(selectProfile);

  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [revealedInvite, setRevealedInvite] = useState<InviteResponse | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<SpaceMember | null>(null);
  const [isLeaveConfirmVisible, setIsLeaveConfirmVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchMembers());
  }, [dispatch, currentSpaceId]);

  if (!currentSpace) {
    return null;
  }

  const isOwner = currentSpace.role === 'owner';
  const ownRow = members.find((member) => member.email.toLowerCase() === myEmail?.toLowerCase());

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      addAlert('Enter a valid email address');
      return;
    }

    setIsInviting(true);

    try {
      const invite = await dispatch(inviteMember(email)).unwrap();

      setInviteEmail('');
      setRevealedInvite(invite);
    } catch (error: unknown) {
      addAlert(getErrorMessage(error));
    } finally {
      setIsInviting(false);
    }
  };

  const handleConfirmRemoval = () => {
    if (!pendingRemoval) return;

    const action = pendingRemoval.type === 'invite' ? revokeInvite(pendingRemoval.id) : removeMember(pendingRemoval.id);

    dispatch(action)
      .unwrap()
      .catch((error: unknown) => addAlert(getErrorMessage(error)));

    setPendingRemoval(null);
  };

  const handleConfirmLeave = () => {
    if (!ownRow) return;

    dispatch(removeMember(ownRow.id))
      .unwrap()
      .catch((error: unknown) => addAlert(getErrorMessage(error)));

    setIsLeaveConfirmVisible(false);
    navigation.goBack();
  };

  return (
    <RootLayout style={styles.root} scrollable>
      <SectionTitle title="Members" onBackButtonPress={() => navigation.goBack()} />

      <View style={styles.scrollContent}>
        <Text style={styles.spaceLine}>{`${currentSpace.name} · ${currentSpace.currency.code}`}</Text>

        {isOwner && (
          <View style={styles.section}>
            <Text style={styles.label}>Invite by email</Text>

            <View style={styles.inviteRow}>
              <Icon name="mail" size={18} color={colors.muted} strokeWidth={1.9} />

              <TextInput
                style={styles.inviteInput}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="name@email.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                editable={!isInviting}
                onSubmitEditing={handleInvite}
              />

              <TouchableOpacity style={styles.inviteButton} onPress={handleInvite} disabled={isInviting}>
                <Text style={styles.inviteButtonText}>Invite</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>
              There&apos;s no email -- after you invite, share the code with them yourself.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.label}>In this space</Text>
            <Text style={styles.countLabel}>{`${members.length} ${members.length === 1 ? 'person' : 'people'}`}</Text>
          </View>

          <View style={styles.rows}>
            {members.map((member) => (
              <MemberRow
                key={`${member.type}-${member.id}`}
                member={member}
                isSelf={member.email.toLowerCase() === myEmail?.toLowerCase()}
                onRemovePress={() => setPendingRemoval(member)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={() => setIsLeaveConfirmVisible(true)}
            activeOpacity={0.7}
          >
            <Icon name="logout" size={17} color={colors.danger} strokeWidth={2} />
            <Text style={styles.leaveButtonText}>Leave this space</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            {isOwner
              ? 'As the owner you can remove anyone but yourself. Leaving hands the space to the next member.'
              : 'Only the owner can remove other members. Leaving takes you out of this space -- your own wallets stay untouched.'}
          </Text>
        </View>
      </View>

      <BottomModal
        isVisible={!!pendingRemoval}
        onClose={() => setPendingRemoval(null)}
        content={
          <Text style={styles.confirmText}>
            {pendingRemoval?.type === 'invite'
              ? 'Revoke this invite?'
              : `Remove ${pendingRemoval?.name || pendingRemoval?.email} from this space?`}
          </Text>
        }
        actions={[
          {
            title: pendingRemoval?.type === 'invite' ? 'Revoke invite' : 'Remove member',
            onPress: handleConfirmRemoval,
          },
        ]}
      />

      <BottomModal
        isVisible={isLeaveConfirmVisible}
        onClose={() => setIsLeaveConfirmVisible(false)}
        content={<Text style={styles.confirmText}>Leave this space?</Text>}
        actions={[{ title: 'Leave space', onPress: handleConfirmLeave }]}
      />

      <InviteCodeDialog invite={revealedInvite} spaceName={currentSpace.name} onClose={() => setRevealedInvite(null)} />
    </RootLayout>
  );
};

export default MembersScreen;
