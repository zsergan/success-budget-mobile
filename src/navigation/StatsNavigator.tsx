import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { StatsScreen, StatsTransactionsScreen } from '@screens';
import { useTheme } from '@hooks';
import { ScreenNames } from '@shared/enums';
import type { StatsStackParamList } from '@shared/types';

const Stack = createNativeStackNavigator<StatsStackParamList>();

// The overview stays mounted under a row's transactions, so going back finds it as it was left.
const StatsNavigator = () => {
  const { colors } = useTheme().colorTheme;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name={ScreenNames.STATS_OVERVIEW_SCREEN} component={StatsScreen} />
      <Stack.Screen name={ScreenNames.STATS_TRANSACTIONS_SCREEN} component={StatsTransactionsScreen} />
    </Stack.Navigator>
  );
};

export default StatsNavigator;
