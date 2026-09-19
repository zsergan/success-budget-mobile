import { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { ErrorResponse, InviteResponse, SpaceMember } from '@api/dto';
import { BottomModal, Icon, RootLayout, SectionTitle } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectMember } from '@redux/state/member/selectors';
import { fetchMembers, inviteMember, removeMember, revokeInvite } from '@redux/state/member/thunks';
import { selectProfile } from '@redux/state/profile/selectors';
import { selectCurrentSpace, selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { ScreenNames } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { INVITE_EXPIRY_DAYS, INVITE_RATE_LIMIT_COOLDOWN_MS, SPACE_LIMITS } from '@shared/constants';
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
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    dispatch(fetchMembers());
  }, [dispatch, currentSpaceId]);

  const cooldownRemaining = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;

  useEffect(() => {
    if (cooldownUntil === null) return;

    const interval = setInterval(() => {
      if (Date.now() >= cooldownUntil) {
        setCooldownUntil(null);
        clearInterval(interval);
      } else {
        setNow(Date.now());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  if (!currentSpace) {
    return null;
  }

  const isOwner = currentSpace.role === 'owner';
  const ownRow = members.find((member) => member.email.toLowerCase() === myEmail?.toLowerCase());

  const memberCount = members.filter((member) => member.type === 'member').length;
  const pendingInviteCount = members.filter((member) => member.type === 'invite').length;
  const isAtMemberCap = memberCount >= SPACE_LIMITS.MAX_MEMBERS_PER_SPACE;
  const isAtInviteCap = pendingInviteCount >= SPACE_LIMITS.MAX_PENDING_INVITES_PER_SPACE;
  const isInviteCapped = isAtMemberCap || isAtInviteCap;

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
      const errorResponse = error as ErrorResponse | undefined;

      if (errorResponse?.statusCode === 429) {
        setCooldownUntil(Date.now() + INVITE_RATE_LIMIT_COOLDOWN_MS);
      } else {
        addAlert(getErrorMessage(error));
      }
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

            {isInviteCapped ? (
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
                    style={styles.inviteInput}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    placeholder="name@email.com"
                    placeholderTextColor={colors.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                    editable={!isInviting && cooldownRemaining === 0}
                    onSubmitEditing={handleInvite}
                  />

                  <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={handleInvite}
                    disabled={isInviting || cooldownRemaining > 0}
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
