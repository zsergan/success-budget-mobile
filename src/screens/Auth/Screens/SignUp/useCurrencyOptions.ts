import { getLoadState } from '@redux/api/loadState';
import { useGetCurrenciesQuery } from '@redux/state/currency/api';

const useCurrencyOptions = () => {
  const currenciesQuery = useGetCurrenciesQuery();
  const { isLoading, hasError } = getLoadState(currenciesQuery);
  const { currentData: currencies = [], refetch } = currenciesQuery;

  return {
    options: currencies.map((currency) => ({ label: `${currency.code} · ${currency.name}`, value: currency.id })),
    isLoading,
    hasError,
    retry: refetch,
  };
};

export default useCurrencyOptions;
