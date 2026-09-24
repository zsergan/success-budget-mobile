import type { Currency } from '@api/dto';
import { baseApi } from '@redux/api/baseApi';

export const currencyApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCurrencies: build.query<Currency[], void>({
      query: () => ({ url: '/currencies' }),
      providesTags: ['Currencies'],
    }),
  }),
});

export const { useGetCurrenciesQuery } = currencyApi;
