import { Text, View } from 'react-native';

import { Button, Icon, LimitItem, RootLayout, SectionTitle, TinyButton } from '@components';
import { useAppSelector } from '@redux/hooks';
import { selectLimit } from '@redux/state/limit/selectors';
import { selectProfile } from '@redux/state/profile/selectors';
import { ALL_OTHERS_CATEGORIES_ID } from '@shared/constants';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import Overall from './Overall/Overall';

import { colors } from '@shared/theme';
import styles from './style';

interface Props extends ScreenProps<ScreenNames.LIMITS_TAB> {}

const LimitsScreen = ({ navigation }: Props) => {
  const { baseCurrency } = useAppSelector(selectProfile);
  const { limits, overall } = useAppSelector(selectLimit);

  return (
    <RootLayout>
      <View style={styles.root}>
        <SectionTitle
          title="Your Limits"
          button={
            !limits.length ? undefined : (
              <TinyButton
                title="Add Limit"
                icon="plus"
                onPress={() => navigation.navigate(ScreenNames.ADD_LIMIT_SCREEN, { id: 'new' })}
              />
            )
          }
        />
        {limits.length >= 2 && <Overall overall={overall} baseCurrencyCode={baseCurrency?.code || ''} />}

        {!limits.length ? (
          <View style={styles.noLimitsContainer}>
            <Icon name="limit" size={60} color={colors.muted} />

            <Text style={styles.noLimits}>No limits yet</Text>

            <Button
              title="Create Limit"
              onPress={() => navigation.navigate(ScreenNames.ADD_LIMIT_SCREEN, { id: 'new' })}
              style={styles.button}
            />
          </View>
        ) : (
          <>
            {limits.map((limit) => (
              <LimitItem
                key={limit.id}
                limit={limit}
                currencyCode={baseCurrency?.code || ''}
                onEdit={() =>
                  navigation.navigate(ScreenNames.ADD_LIMIT_SCREEN, {
                    id: limit.id,
                    category_id: limit.category ? limit.category.id : ALL_OTHERS_CATEGORIES_ID,
                    amount: String(limit.amount),
                  })
                }
              />
            ))}
          </>
        )}
      </View>
    </RootLayout>
  );
};

export default LimitsScreen;
