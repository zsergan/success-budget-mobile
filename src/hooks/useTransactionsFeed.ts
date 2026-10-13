import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { InfiniteData, SkipToken } from '@reduxjs/toolkit/query';
import { skipToken } from '@reduxjs/toolkit/query';

import type { ErrorResponse } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import { getLoadState } from '@redux/api/loadState';
import type { FeedPageParam, FeedSelection, TransactionFeedPage } from '@redux/state/transaction/api';
import { feedSelectionKey, useGetTransactionsFeedInfiniteQuery } from '@redux/state/transaction/api';
import { getFeedView } from '@redux/state/transaction/selectors';
import { isApiError } from '@shared/utils';

interface FeedOptions {
  pageSize?: number;
  // Open the page holding this record instead of the newest one.
  aroundId?: string;
}

interface Load {
  key: string;
  aroundId?: string;
  generation: number;
  start: FeedPageParam;
  // A reload of the same selection keeps its last pages on screen until its first page arrives.
  isReload: boolean;
}

type FeedData = InfiniteData<TransactionFeedPage, FeedPageParam>;

const submit = (key: string, aroundId: string | undefined, generation: number): Load => ({
  key,
  aroundId,
  generation,
  start: aroundId ? { aroundId } : {},
  isReload: false,
});

const isCursorRejected = (error: unknown) => {
  const message = (error as Partial<ErrorResponse> | undefined)?.message;

  return (
    isApiError(error, 400, ApiErrorCode.VALIDATION_FAILED) &&
    Array.isArray(message) &&
    message.some(({ field }) => field === 'cursor')
  );
};

// One paged selection of the feed. A new selection, start record or reload is a new generation with its own
// cache entry, so a page still loading for an earlier one can never land in what is shown.
const useTransactionsFeed = (selection: FeedSelection | SkipToken, { pageSize, aroundId }: FeedOptions = {}) => {
  const owner = useId();
  const key = selection === skipToken ? '' : `${feedSelectionKey(selection)}|${pageSize ?? ''}`;
  const [load, setLoad] = useState(() => submit(key, aroundId, 0));
  const [kept, setKept] = useState<{ key: string; data: FeedData } | null>(null);

  let current = load;
  if (load.key !== key || load.aroundId !== aroundId) {
    current = submit(key, aroundId, load.generation + 1);
    setLoad(current);
  }

  const query = useGetTransactionsFeedInfiniteQuery(
    selection === skipToken ? skipToken : { selection, pageSize, generation: `${owner}${current.generation}` },
    { initialPageParam: current.start },
  );
  const { currentData, error, isError, isFetching, hasNextPage, hasPreviousPage, fetchNextPage, fetchPreviousPage } =
    query;
  const isFetchNextPageError = isError && query.direction === 'forward';
  const isFetchPreviousPageError = isError && query.direction === 'backward';

  // Each answer is final for this generation's start (a record gone or outside the selection, a cursor refused),
  // so the next generation starts from the newest record, keeping what is shown until it arrives.
  const isStartRefused =
    current.start.aroundId !== undefined &&
    (isApiError(error, 404, ApiErrorCode.TRANSACTION_NOT_IN_FEED) ||
      isApiError(error, 404, ApiErrorCode.TRANSACTION_NOT_FOUND));
  if (isCursorRejected(error) || isStartRefused) {
    current = { ...current, generation: current.generation + 1, start: {}, isReload: currentData !== undefined };
    setLoad(current);
  }

  if (currentData && kept?.data !== currentData) setKept({ key: current.key, data: currentData });

  const shown = currentData ?? (current.isReload && kept?.key === current.key ? kept.data : undefined);
  const view = useMemo(() => getFeedView(shown?.pages ?? []), [shown]);
  const hasPageError = isFetchNextPageError || isFetchPreviousPageError;

  const isIdle = currentData !== undefined && !isFetching;
  const canLoadNext = isIdle && hasNextPage && !isFetchNextPageError;
  const canLoadPrevious = isIdle && hasPreviousPage && !isFetchPreviousPageError;

  // An edge reached while another page loads is remembered and loaded right after it; the list may not call again.
  // A failed page is never asked for again on its own, only through retry().
  // A new generation has no pages yet, so it starts with nothing asked for.
  const wantsRef = useRef({ next: false, previous: false });

  useEffect(() => {
    if (isFetchNextPageError || !hasNextPage) wantsRef.current.next = false;
    if (isFetchPreviousPageError || !hasPreviousPage) wantsRef.current.previous = false;

    if (canLoadNext && wantsRef.current.next) {
      wantsRef.current.next = false;
      void fetchNextPage();
    } else if (canLoadPrevious && wantsRef.current.previous) {
      wantsRef.current.previous = false;
      void fetchPreviousPage();
    }
  }, [
    canLoadNext,
    canLoadPrevious,
    hasNextPage,
    hasPreviousPage,
    isFetchNextPageError,
    isFetchPreviousPageError,
    fetchNextPage,
    fetchPreviousPage,
  ]);

  const loadNextPage = useCallback(() => {
    if (canLoadNext) void fetchNextPage();
    else if (hasNextPage && !isFetchNextPageError) wantsRef.current.next = true;
  }, [canLoadNext, hasNextPage, isFetchNextPageError, fetchNextPage]);

  const loadPreviousPage = useCallback(() => {
    if (canLoadPrevious) void fetchPreviousPage();
    else if (hasPreviousPage && !isFetchPreviousPageError) wantsRef.current.previous = true;
  }, [canLoadPrevious, hasPreviousPage, isFetchPreviousPageError, fetchPreviousPage]);

  const refresh = useCallback(
    () => setLoad((prev) => ({ ...prev, generation: prev.generation + 1, start: {}, isReload: true })),
    [],
  );

  // A failed load starts over from where it started; RTK's refetch would forget an around_id start.
  const retry = useCallback(() => {
    if (isFetching) return;
    if (isFetchNextPageError) void fetchNextPage();
    else if (isFetchPreviousPageError) void fetchPreviousPage();
    else if (isError) setLoad((prev) => ({ ...prev, generation: prev.generation + 1, isReload: true }));
  }, [isFetching, isFetchNextPageError, isFetchPreviousPageError, isError, fetchNextPage, fetchPreviousPage]);

  return {
    ...view,
    ...getLoadState({ currentData: shown, isError: isError && !hasPageError, isUninitialized: query.isUninitialized }),
    isRefreshing: current.isReload && currentData === undefined && isFetching,
    hasNextPage: currentData !== undefined && hasNextPage,
    hasPreviousPage: currentData !== undefined && hasPreviousPage,
    isLoadingNextPage: query.isFetchingNextPage,
    isLoadingPreviousPage: query.isFetchingPreviousPage,
    hasNextPageError: isFetchNextPageError,
    hasPreviousPageError: isFetchPreviousPageError,
    loadNextPage,
    loadPreviousPage,
    refresh,
    retry,
  };
};

export default useTransactionsFeed;
