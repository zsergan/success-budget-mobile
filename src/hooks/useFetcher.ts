import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useState } from 'react';
import type { AsyncThunkAction } from '@reduxjs/toolkit';
import { isRejected } from '@reduxjs/toolkit';

import type { ErrorResponse } from '@api/dto';

interface UseFetcherProps<T, P> {
  fetcher: (args: P) => ReturnType<AsyncThunkAction<T, unknown, { extra: unknown }>>;
}

export interface UseFetcherResult<T, P> {
  data?: T;
  error?: ErrorResponse;
  isEmpty?: boolean;
  fetchData: (args: P) => ReturnType<AsyncThunkAction<T, unknown, { extra: unknown }>>;
  clearData: () => void;
  setData: Dispatch<SetStateAction<T | undefined>>;
  isLoading: boolean;
}

const useFetcher = <T, P>({ fetcher }: UseFetcherProps<T, P>): UseFetcherResult<T, P> => {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ErrorResponse>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchData: UseFetcherResult<T, P>['fetchData'] = useCallback(
    (params) => {
      setIsLoading(true);
      setError(undefined);
      const promise = fetcher(params);
      promise
        .then((response) => {
          if (isRejected(response)) {
            throw response.payload;
          } else {
            setData(response.payload);
          }
        })
        .catch((e) => {
          setError((e as ErrorResponse) ?? {});
        })
        .finally(() => {
          setIsLoading(false);
        });

      return promise;
    },
    [fetcher],
  );

  const clearData = useCallback(() => setData(undefined), [setData]);

  return {
    data,
    error,
    isEmpty: error?.statusCode === 404,
    fetchData,
    clearData,
    setData,
    isLoading,
  };
};

export default useFetcher;
