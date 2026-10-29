import { ActivityIndicator, Text, View } from 'react-native';

import { EmptyState, RootLayout, SectionTitle } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { SpaceType } from '@shared/enums';
import type { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import InviteCodeDialog from './components/InviteCodeDialog/InviteCodeDialog';
import InviteMemberSection from './components/InviteMemberSection/InviteMemberSection';
import LeaveSpaceDialog from './components/LeaveSpaceDialog/LeaveSpaceDialog';
import LeaveSpaceSection from './components/LeaveSpaceSection/LeaveSpaceSection';
import MemberRemovalDialog from './components/MemberRemovalDialog/MemberRemovalDialog';
import MembersList from './components/MembersList/MembersList';
import useInviteCooldown from './hooks/useInviteCooldown';
import useInviteMember from './hooks/useInviteMember';
import useMemberActions from './hooks/useMemberActions';
import useMembersData from './hooks/useMembersData';

import createStyles from './style';

interface Props extends RootStackScreenProps<ScreenNames.MEMBERS_SCREEN> {}

const MembersScreen = ({ navigation }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const {
    currentSpace,
    isInitialLoading,
    isRefreshing,
    error,
    memberRows,
    inviteRows,
    ownRow,
    isOwner,
    memberCount,
    isAtMemberCap,
    isAtInviteCap,
    canInvite,
    retry,
  } = useMembersData();

  const { remainingSeconds } = useInviteCooldown();
  const { submit, isSubmitting, revealedInvite, closeInviteCode, failedEmail, inviteError } = useInviteMember({
    canInvite,
    cooldownRemaining: remainingSeconds,
  });
  const {
    target,
    isPending,
    error: actionError,
    requestAction,
    cancel,
    confirm,
  } = useMemberActions({
    onLeft: () => navigation.goBack(),
  });

  if (!currentSpace) {
    return isInitialLoading ? (
      <RootLayout style={styles.root}>
        <SectionTitle title="Members" onBackButtonPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </RootLayout>
    ) : null;
  }

  const removalTarget = target?.kind === 'remove' || target?.kind === 'revoke' ? target : null;

  return (
    <RootLayout style={styles.root} scrollable blurredStatusBar>
      <SectionTitle title="Members" onBackButtonPress={() => navigation.goBack()} />

      <View style={styles.scrollContent}>
        <Text style={styles.spaceLine}>{`${currentSpace.name} · ${currentSpace.currency.code}`}</Text>

        {error && !isInitialLoading && memberRows.length === 0 ? (
          <EmptyState
            icon="users"
            title="Couldn't load members"
            description="Check your connection and try again."
            actionLabel="Retry"
            onActionPress={retry}
          />
        ) : (
          <>
            {isOwner && currentSpace.type === SpaceType.GROUP && (
              <InviteMemberSection
                canInvite={canInvite}
                isAtMemberCap={isAtMemberCap}
                isAtInviteCap={isAtInviteCap}
                cooldownRemaining={remainingSeconds}
                isSubmitting={isSubmitting}
                failedEmail={failedEmail}
                error={inviteError}
                onSubmit={submit}
              />
            )}

            <MembersList
              memberRows={memberRows}
              inviteRows={inviteRows}
              ownUserId={ownRow?.user_id}
              isRefreshing={isRefreshing}
              refreshFailed={!!error && !isInitialLoading}
              onRetry={retry}
              onActionPress={requestAction}
            />

            <LeaveSpaceSection
              isOwner={isOwner}
              canLeave={!!ownRow}
              onPress={() => requestAction({ kind: 'leave', spaceName: currentSpace.name })}
            />
          </>
        )}
      </View>

      <MemberRemovalDialog
        target={removalTarget}
        spaceName={currentSpace.name}
        isPending={isPending}
        error={actionError}
        onConfirm={confirm}
        onCancel={cancel}
      />

      <LeaveSpaceDialog
        isVisible={target?.kind === 'leave'}
        spaceName={currentSpace.name}
        isPending={isPending}
        error={actionError}
        isOwner={isOwner}
        memberCount={memberCount}
        onConfirm={confirm}
        onCancel={cancel}
      />

      <InviteCodeDialog invite={revealedInvite} spaceName={currentSpace.name} onClose={closeInviteCode} />
    </RootLayout>
  );
};

export default MembersScreen;
