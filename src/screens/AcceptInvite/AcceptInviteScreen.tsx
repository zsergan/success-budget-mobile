import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Banner, Button, Input, RootLayout, SectionTitle, TextLink } from '@components';
import { useThemedStyles } from '@hooks';
import { useAppStore } from '@redux/hooks';
import { selectInvitationLinkRevision } from '@redux/state/invitation/selectors';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import LinkInvitation from './components/LinkInvitation/LinkInvitation';
import useLinkInvitation from './hooks/useLinkInvitation';
import useAcceptInviteForm from './useAcceptInviteForm';

import createStyles from './style';

interface Props extends RootStackScreenProps<ScreenNames.ACCEPT_INVITE_SCREEN> {}

const AcceptInviteScreen = ({ navigation }: Props) => {
  const styles = useThemedStyles(createStyles);

  // A screen opened from an email may have nothing worth going back to: a join always lands on Home.
  const openJoinedSpace = useCallback(
    () => navigation.popTo(ScreenNames.HOME_SCREEN, { screen: ScreenNames.HOME_TAB }),
    [navigation],
  );
  const leave = () => (navigation.canGoBack() ? navigation.goBack() : openJoinedSpace());

  const link = useLinkInvitation({ onJoined: openJoinedSpace });

  // A code join ends the flow only while the screen is still open and no link was opened since it was sent, read from
  // the store so a link not yet shown counts too, and the same token opened again (A, B, then A) as well.
  const store = useAppStore();
  const isOpenRef = useRef(true);
  useEffect(
    () => () => {
      isOpenRef.current = false;
    },
    [],
  );
  const captureFlow = useCallback(() => {
    const linkRevision = selectInvitationLinkRevision(store.getState());
    return () => isOpenRef.current && selectInvitationLinkRevision(store.getState()) === linkRevision;
  }, [store]);

  const form = useAcceptInviteForm({ onJoined: openJoinedSpace, captureFlow });
  const [isEnteringCode, setEnteringCode] = useState(link.token === null);
  const [shownToken, setShownToken] = useState(link.token);
  if (link.token !== shownToken) {
    setShownToken(link.token);
    if (link.token !== null) setEnteringCode(false);
  }
  const isLinkShown = link.token !== null && !isEnteringCode;

  // Leaving by back or a gesture declines the invitation; an account switch unmounts the screen without it.
  const { forget } = link;
  useEffect(
    () =>
      navigation.addListener('beforeRemove', () => {
        isOpenRef.current = false;
        forget();
      }),
    [navigation, forget],
  );

  const { problem } = link;
  const isWaiting = link.waitSeconds > 0;
  const retryTitle = isWaiting ? `Try again in ${link.waitSeconds} s` : 'Try again';

  const linkAction = () => {
    switch (problem?.kind) {
      case undefined:
        return (
          link.preview && (
            <Button title="Join space" onPress={link.join} isLoading={link.isJoining} busyTitle="Joining…" />
          )
        );
      case 'wrongAccount':
        return <Button title="Switch account" onPress={link.switchAccount} />;
      case 'alreadyMember':
        return (
          problem.spaceId !== undefined && (
            <Button title="Open space" onPress={() => link.openSpace(problem.spaceId!)} />
          )
        );
      case 'unavailable':
      case 'codeNotFound':
        return null;
      default:
        return <Button title={retryTitle} onPress={link.retry} disabled={isWaiting} isLoading={link.isJoining} />;
    }
  };

  const isLinkEnded = problem?.kind === 'unavailable' || problem?.kind === 'alreadyMember';

  return (
    <RootLayout style={styles.root}>
      <View style={styles.sectionsContainer}>
        <SectionTitle title="Join a space" onBackButtonPress={leave} />

        {isLinkShown ? (
          <>
            <Text style={styles.description}>
              You were invited to a shared space. Join it only if you expected this.
            </Text>

            <LinkInvitation
              preview={link.preview}
              isLoading={link.isLoading}
              problem={problem}
              waitSeconds={link.waitSeconds}
            />

            <TextLink title="Enter a 6-digit code instead" onPress={() => setEnteringCode(true)} />
          </>
        ) : (
          <>
            <Text style={styles.description}>Enter the 6-digit code from the invitation email.</Text>

            <Controller
              name="code"
              control={form.control}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Input
                  variant="outlined"
                  label="Invite code"
                  accessibilityLabel="Invite code"
                  error={error?.message}
                  placeholder="042917"
                  value={value}
                  onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  autoCorrect={false}
                  maxLength={6}
                />
              )}
            />

            {form.submitError && (
              <Banner
                tone="danger"
                text={
                  form.waitSeconds > 0 ? `Too many attempts. Try again in ${form.waitSeconds} s.` : form.submitError
                }
              />
            )}

            {link.token !== null && (
              <TextLink title="Back to the invitation link" onPress={() => setEnteringCode(false)} />
            )}
          </>
        )}
      </View>

      {isLinkShown ? (
        <View style={styles.actions}>
          {linkAction()}
          <Button title={isLinkEnded ? 'Close' : 'Not now'} variant="tertiary" onPress={leave} />
        </View>
      ) : (
        <Button
          title={form.waitSeconds > 0 ? `Try again in ${form.waitSeconds} s` : 'Join space'}
          onPress={form.onSubmit}
          disabled={form.isSubmitDisabled}
        />
      )}
    </RootLayout>
  );
};

export default AcceptInviteScreen;
