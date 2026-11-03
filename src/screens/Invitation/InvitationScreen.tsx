import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Banner, Button, RootLayout, SectionTitle } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import { formatDateLong } from '@shared/utils/transform';
import useInvitation from './useInvitation';

import createStyles from './style';

interface Props extends RootStackScreenProps<ScreenNames.INVITATION_SCREEN> {}

const InvitationScreen = ({ navigation }: Props) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme().colorTheme;
  const close = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);
  const { preview, isLoading, problem, isJoining, join, decline, switchAccount, openSpace, retry, forgetOnLeave } =
    useInvitation({ close });

  useEffect(() => navigation.addListener('beforeRemove', forgetOnLeave), [navigation, forgetOnLeave]);

  return (
    <RootLayout style={styles.root}>
      <View style={styles.sectionsContainer}>
        <SectionTitle title="Invitation" onBackButtonPress={decline} />

        {isLoading && <ActivityIndicator color={colors.muted} accessibilityRole="progressbar" />}

        {preview && (
          <>
            <Text style={styles.description}>You’re invited to join</Text>
            <Text style={styles.spaceName}>{preview.space.name}</Text>
            <Text style={styles.description}>
              {`Currency: ${preview.space.currency.code}. The invitation expires on ${formatDateLong(preview.expires_at)}.`}
            </Text>
          </>
        )}

        {problem && <Banner tone="danger" text={problem.message} />}
      </View>

      <View style={styles.actions}>
        {problem?.action === 'switchAccount' && <Button title="Use another account" onPress={switchAccount} />}
        {problem?.action === 'openSpace' && problem.spaceId !== undefined && (
          <Button title="Open space" onPress={() => openSpace(problem.spaceId!)} />
        )}
        {problem?.action === 'retry' && <Button title="Try again" onPress={retry} variant="outline" />}
        {preview && (!problem || problem.action === 'retry') && (
          <Button title="Join" onPress={join} isLoading={isJoining} busyTitle="Joining…" />
        )}
        <Button title={problem?.action === 'close' ? 'Close' : 'Not now'} onPress={decline} variant="tertiary" />
      </View>
    </RootLayout>
  );
};

export default InvitationScreen;
