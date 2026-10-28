import { Text, View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Banner, Button, Input, RootLayout, SectionTitle } from '@components';
import { useThemedStyles } from '@hooks';
import type { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import useAcceptInviteForm from './useAcceptInviteForm';

import createStyles from './style';

interface Props extends RootStackScreenProps<ScreenNames.ACCEPT_INVITE_SCREEN> {}

const AcceptInviteScreen = ({ navigation }: Props) => {
  const styles = useThemedStyles(createStyles);
  const { control, onSubmit, isSubmitDisabled, submitError } = useAcceptInviteForm({ navigation });

  return (
    <RootLayout style={styles.root}>
      <View style={styles.sectionsContainer}>
        <SectionTitle title="Join a space" onBackButtonPress={() => navigation.goBack()} />

        <Text style={styles.description}>Enter the 6-character code you got from whoever invited you.</Text>

        <Controller
          name="code"
          control={control}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              label="Invite code"
              error={error?.message}
              placeholder="ABC123"
              value={value}
              onChangeText={(text) => onChange(text.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              withShadow
            />
          )}
        />

        {submitError && <Banner tone="danger" text={submitError} />}
      </View>

      <Button title="Join space" onPress={onSubmit} disabled={isSubmitDisabled} />
    </RootLayout>
  );
};

export default AcceptInviteScreen;
