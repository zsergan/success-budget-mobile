import { Text, View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, H, Input } from '@components';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import AuthLayout from '../../AuthLayout';
import useVerifyEmailForm from './useVerifyEmailForm';

import styles from '../style';

interface Props extends ScreenProps<ScreenNames.VERIFY_EMAIL_SCREEN> {}

const VerifyEmailScreen = ({ navigation }: Props) => {
  const { control, onSubmit, isSubmitting } = useVerifyEmailForm();

  return (
    <AuthLayout>
      <View style={styles.root}>
        <H>Verify Email</H>

        <View style={styles.container}>
          <Controller
            name="code"
            control={control}
            render={({ field: { onChange, value }, formState: { errors } }) => (
              <Input
                value={value}
                placeholder="0000"
                onChangeText={onChange}
                autoCapitalize="none"
                autoCorrect={false}
                withShadow
                error={errors.code?.message}
              />
            )}
          />
        </View>

        <View style={styles.container}>
          <Button title="Verify Email" onPress={onSubmit} disabled={isSubmitting} />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.bottomText}>Already have an account?</Text>

        <Button title="Sign in" onPress={() => navigation.navigate(ScreenNames.SIGN_IN_SCREEN)} variant="tertiary" />
      </View>
    </AuthLayout>
  );
};

export default VerifyEmailScreen;
