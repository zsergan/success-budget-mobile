import { Text, TouchableOpacity, View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, Icon, Input, InputPicker, RootLayout, SectionTitle } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { IconType, RootStackScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import { SpaceType } from '@shared/enums';
import InviteChips from './InviteChips';
import useCreateSpaceForm from './useCreateSpaceForm';

import createStyles from './style';

const SPACE_TYPES: { value: SpaceType; label: string; icon: IconType }[] = [
  { value: SpaceType.PERSONAL, label: 'Personal', icon: 'user' },
  { value: SpaceType.GROUP, label: 'Group', icon: 'users' },
];

interface Props extends RootStackScreenProps<ScreenNames.CREATE_SPACE_SCREEN> {}

const CreateSpaceScreen = ({ navigation }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const { currencies, control, watch, onSubmit, isSubmitDisabled } = useCreateSpaceForm({ navigation });

  const selectedType = watch('type');
  const isGroup = selectedType === SpaceType.GROUP;

  return (
    <RootLayout style={styles.root}>
      <View style={styles.sectionsContainer}>
        <SectionTitle title="Create a space" onBackButtonPress={() => navigation.goBack()} />

        <View style={styles.section}>
          <Text style={styles.label}>Space type</Text>

          <Controller
            name="type"
            control={control}
            render={({ field: { onChange, value } }) => (
              <View style={styles.typeSwitch}>
                {SPACE_TYPES.map((item) => {
                  const active = value === item.value;

                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.typeTab, active && styles.typeTabActive]}
                      onPress={() => onChange(item.value)}
                      activeOpacity={0.7}
                    >
                      <Icon name={item.icon} size={16} color={active ? colors.text : colors.muted} strokeWidth={1.9} />
                      <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
        </View>

        <View style={styles.section}>
          <Controller
            name="name"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input label="Space name" placeholder="Family budget" value={value} onChangeText={onChange} withShadow />
            )}
          />
        </View>

        <View style={styles.section}>
          <Controller
            name="currency"
            control={control}
            render={({ field: { onChange, value } }) => (
              <InputPicker
                items={currencies}
                selectedValue={value}
                onValueChange={(v) => onChange(v as number)}
                label="Currency"
                placeholder="Pick a currency"
                withShadow
              />
            )}
          />

          <Text style={styles.hint}>Chosen once, at creation — it cannot be changed later.</Text>
        </View>

        {isGroup ? (
          <View style={styles.section}>
            <Text style={styles.label}>Invite by email</Text>

            <Controller
              name="invites"
              control={control}
              render={({ field: { onChange, value } }) => <InviteChips emails={value} onChange={onChange} />}
            />
          </View>
        ) : (
          <Text style={styles.hint}>Only you can see a personal space — there&apos;s nobody to invite.</Text>
        )}
      </View>

      <Button title={isGroup ? 'Create and invite' : 'Create space'} onPress={onSubmit} disabled={isSubmitDisabled} />
    </RootLayout>
  );
};

export default CreateSpaceScreen;
