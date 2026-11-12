import { useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import type { ScreenNames } from '@shared/enums';
import type { StatsStackNavigationProp, StatsStackScreenProps } from '@shared/types';

// The wallet saved for Add transaction opens the composer once, after the refreshed list has it and only in its
// own space; another space or a failed refresh drops it, so the composer never pops up later out of context.
const useComposeWithNewWallet = (openExpense: (walletId: number) => void) => {
  const navigation = useNavigation<StatsStackNavigationProp<ScreenNames.STATS_OVERVIEW_SCREEN>>();
  const composeWith = useRoute<StatsStackScreenProps<ScreenNames.STATS_OVERVIEW_SCREEN>['route']>().params?.composeWith;
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const walletsQuery = useGetWalletsQuery(useSpaceArg());

  const isWalletLoaded = !!walletsQuery.currentData?.wallets.some(({ wallet }) => wallet.id === composeWith?.walletId);
  const hasFailed = walletsQuery.isError && !walletsQuery.isFetching;

  useEffect(() => {
    if (!composeWith) return;

    if (composeWith.spaceId !== spaceId || hasFailed) {
      navigation.setParams({ composeWith: undefined });
    } else if (isWalletLoaded) {
      navigation.setParams({ composeWith: undefined });
      openExpense(composeWith.walletId);
    }
  }, [navigation, composeWith, isWalletLoaded, hasFailed, spaceId, openExpense]);
};

export default useComposeWithNewWallet;
