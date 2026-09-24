import type { GetWalletsResponse, WalletsOverviewResponse } from '@api/dto';

export const EMPTY_WALLETS: GetWalletsResponse[] = [];

// total/currencyCode/deltaPercent come straight from the backend; a space
// has exactly one currency, so every wallet already shares it.
export const getTotalBalance = (overview: WalletsOverviewResponse | undefined) => ({
  total: overview?.total_balance ?? 0,
  currencyCode: overview?.total_balance_currency || undefined,
  walletsCount: overview?.wallets.length ?? 0,
  deltaPercent: overview?.delta_percent ?? 0,
});
