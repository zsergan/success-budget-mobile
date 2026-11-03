import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { EmptyState, RootLayout, SectionTitle } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { SpaceType } from '@shared/enums';
import type { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import InviteCodeDialog from './components/InviteCodeDialog/InviteCodeDialog';
import InviteFeedback from './components/InviteFeedback/InviteFeedback';
import InviteMemberSection from './components/InviteMemberSection/InviteMemberSection';
import LeaveSpaceDialog from './components/LeaveSpaceDialog/LeaveSpaceDialog';
import LeaveSpaceSection from './components/LeaveSpaceSection/LeaveSpaceSection';
import MemberRemovalDialog from './components/MemberRemovalDialog/MemberRemovalDialog';
import MembersList from './components/MembersList/MembersList';
import useDeliveryPolling from './hooks/useDeliveryPolling';
import useInviteCooldown from './hooks/useInviteCooldown';
import useInviteMember from './hooks/useInviteMember';
import useInviteResend from './hooks/useInviteResend';
import useMemberActions from './hooks/useMemberActions';
import useMembersData from './hooks/useMembersData';

import createStyles from './style';

interface Props extends RootStackScreenProps<ScreenNames.MEMBERS_SCREEN> {}

const NO_RESEND = { isAvailable: false, waitSeconds: 0, isResending: false };

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
    hasPendingDelivery,
    rosterReceivedAt,
    retry,
  } = useMembersData();

  const { watch: watchDelivery } = useDeliveryPolling({ isFocused: useIsFocused(), hasPendingDelivery });
  const { remainingSeconds } = useInviteCooldown();
  const { submit, isSubmitting, lastInvite, failedEmail, inviteError } = useInviteMember({
    canInvite,
    cooldownRemaining: remainingSeconds,
    onInvited: watchDelivery,
  });
  const { availabilityOf, resend } = useInviteResend({
    isOwner,
    inviteRows,
    rosterReceivedAt,
    onResent: watchDelivery,
  });
  const [sharedCodeInviteId, setSharedCodeInviteId] = useState<number | null>(null);
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
  // The roster's row once it has one: the create response's state is only `queued`. Missing from a roster answered
  // after the invite, it was accepted or revoked, and there is nothing left to report.
  const lastInviteRow = lastInvite && inviteRows.find(({ id }) => id === lastInvite.invite.id);
  const isLastInviteShown = !!lastInvite && (!!lastInviteRow || (rosterReceivedAt ?? 0) < lastInvite.invitedAt);

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
                feedback={
                  lastInvite &&
                  isLastInviteShown && (
                    <InviteFeedback
                      email={lastInvite.invite.email}
                      status={lastInviteRow?.email_status ?? lastInvite.invite.email_status}
                      resend={lastInviteRow ? availabilityOf(lastInviteRow) : NO_RESEND}
                      onRetry={() => lastInviteRow && resend(lastInviteRow)}
                      onShareCode={() => setSharedCodeInviteId(lastInvite.invite.id)}
                    />
                  )
                }
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
              resendAvailabilityOf={isOwner ? availabilityOf : undefined}
              onResend={resend}
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

      <InviteCodeDialog
        invite={lastInvite && lastInvite.invite.id === sharedCodeInviteId ? lastInvite.invite : null}
        spaceName={currentSpace.name}
        onClose={() => setSharedCodeInviteId(null)}
      />
    </RootLayout>
  );
};

export default MembersScreen;
