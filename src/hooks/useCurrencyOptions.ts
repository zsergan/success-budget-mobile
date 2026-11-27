import { useMemo } from 'react';

import { getLoadState } from '@redux/api/loadState';
import { useGetCurrenciesQuery } from '@redux/state/currency/api';
import { pickDefaultCurrency } from '@shared/utils/currency';

const useCurrencyOptions = () => {
  const currenciesQuery = useGetCurrenciesQuery();
  const { isLoading, hasError } = getLoadState(currenciesQuery);
  const { currentData, refetch } = currenciesQuery;
  const currencies = useMemo(() => currentData ?? [], [currentData]);
  // The phone region's currency, for a form that has none picked yet.
  const defaultId = useMemo(() => pickDefaultCurrency(currencies)?.id, [currencies]);

  return { currencies, defaultId, isLoading, hasError, retry: refetch };
};

export default useCurrencyOptions;
