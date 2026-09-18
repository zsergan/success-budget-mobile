import { Text, View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, Input, RootLayout, SectionTitle } from '@components';
import type { ScreenNames } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import useAcceptInviteForm from './useAcceptInviteForm';

import styles from './style';

interface Props extends ScreenProps<ScreenNames.ACCEPT_INVITE_SCREEN> {}

const AcceptInviteScreen = ({ navigation }: Props) => {
  const { control, onSubmit, isSubmitDisabled } = useAcceptInviteForm({ navigation });

  return (
    <RootLayout style={styles.root}>
      <View style={styles.sectionsContainer}>
        <SectionTitle title="Join a space" onBackButtonPress={() => navigation.goBack()} />

        <Text style={styles.description}>Enter the 6-character code you got from whoever invited you.</Text>

        <Controller
          name="code"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Invite code"
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
      </View>

      <Button title="Join space" onPress={onSubmit} disabled={isSubmitDisabled} />
    </RootLayout>
  );
};

export default AcceptInviteScreen;
