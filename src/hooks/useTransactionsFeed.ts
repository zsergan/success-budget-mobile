import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { InfiniteData, SkipToken } from '@reduxjs/toolkit/query';
import { skipToken } from '@reduxjs/toolkit/query';

import type { ErrorResponse } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import type { TransactionModel } from '@api/models';
import { getLoadState } from '@redux/api/loadState';
import type { FeedPageParam, FeedSelection, TransactionFeedPage } from '@redux/state/transaction/api';
import {
  feedSelectionKey,
  useGetTransactionsFeedInfiniteQuery,
  useGetTransactionsRevisionQuery,
} from '@redux/state/transaction/api';
import { getFeedView } from '@redux/state/transaction/selectors';
import { isApiError } from '@shared/utils';

interface FeedOptions {
  pageSize?: number;
  // Open the page holding this record instead of the newest one.
  aroundId?: string;
  // The rows on screen, top first; a refresh after a change keeps the topmost one still listed in its window.
  getVisibleIds?: () => string[];
}

interface Load {
  key: string;
  aroundId?: string;
  generation: number;
  start: FeedPageParam;
  // A reload of the same selection keeps its last pages on screen until its first page arrives.
  isReload: boolean;
  // The history revision this generation was started at; a newer one means its pages are out of date.
  revision?: number;
  // Rows next to a refresh's anchor, tried in turn when the one before is gone or no longer in the selection.
  fallbacks: string[];
  // The start is the record the caller asked for, not one a refresh picked.
  isRequestedStart: boolean;
  // The record the caller asked for could not be opened, so the history opened at its newest record.
  missedAroundId?: string;
}

type FeedData = InfiniteData<TransactionFeedPage, FeedPageParam>;

const ANCHOR_CANDIDATES = 4;

const submit = (key: string, aroundId: string | undefined, generation: number, revision?: number): Load => ({
  key,
  aroundId,
  generation,
  start: aroundId ? { aroundId } : {},
  isReload: false,
  revision,
  fallbacks: [],
  isRequestedStart: aroundId !== undefined,
});

const isCursorRejected = (error: unknown) => {
  const message = (error as Partial<ErrorResponse> | undefined)?.message;

  return (
    isApiError(error, 400, ApiErrorCode.VALIDATION_FAILED) &&
    Array.isArray(message) &&
    message.some(({ field }) => field === 'cursor')
  );
};

// The anchor row, then its neighbours below and above it, nearest first.
const anchorCandidates = (items: TransactionModel[], index: number) =>
  [0, 1, -1, 2, -2, 3, -3]
    .map((offset) => items[index + offset]?.id)
    .filter((id): id is string => id !== undefined)
    .slice(0, ANCHOR_CANDIDATES);

// One paged selection of the feed. A new selection, start record, reload or history revision is a new generation
// with its own cache entry, so a page still loading for an earlier one can never land in what is shown.
const useTransactionsFeed = (
  selection: FeedSelection | SkipToken,
  { pageSize, aroundId, getVisibleIds }: FeedOptions = {},
) => {
  const owner = useId();
  const key = selection === skipToken ? '' : `${feedSelectionKey(selection)}|${pageSize ?? ''}`;
  const revision = useGetTransactionsRevisionQuery(
    selection === skipToken ? skipToken : { spaceId: selection.spaceId },
  ).currentData;
  const [load, setLoad] = useState(() => submit(key, aroundId, 0, revision));
  const [kept, setKept] = useState<{ key: string; data: FeedData } | null>(null);

  let current = load;
  if (load.key !== key || load.aroundId !== aroundId) {
    current = submit(key, aroundId, load.generation + 1, revision);
    setLoad(current);
  }

  const generationArg = `${owner}${current.generation}`;
  const query = useGetTransactionsFeedInfiniteQuery(
    selection === skipToken ? skipToken : { selection, pageSize, generation: generationArg },
    { initialPageParam: current.start },
  );
  const { currentData, error, isError, isFetching, hasNextPage, hasPreviousPage, fetchNextPage, fetchPreviousPage } =
    query;
  const isFetchNextPageError = isError && query.direction === 'forward';
  const isFetchPreviousPageError = isError && query.direction === 'backward';

  if (currentData && kept?.data !== currentData) setKept({ key: current.key, data: currentData });

  const shown = currentData ?? (current.isReload && kept?.key === current.key ? kept.data : undefined);
  const view = useMemo(() => getFeedView(shown?.pages ?? []), [shown]);
  const hasPageError = isFetchNextPageError || isFetchPreviousPageError;

  const isStartRefused =
    current.start.aroundId !== undefined &&
    (isApiError(error, 404, ApiErrorCode.TRANSACTION_NOT_IN_FEED) ||
      isApiError(error, 404, ApiErrorCode.TRANSACTION_NOT_FOUND));
  const next = { generation: current.generation + 1, isReload: current.isReload || shown !== undefined };

  if (isStartRefused && current.fallbacks.length > 0) {
    // The anchor was deleted or left the selection: its nearest neighbour holds the window instead.
    const [nextAnchor, ...fallbacks] = current.fallbacks;
    current = { ...current, ...next, start: { aroundId: nextAnchor }, fallbacks, isRequestedStart: false };
    setLoad(current);
  } else if (isCursorRejected(error) || isStartRefused) {
    // Each answer is final for this start, so the next generation starts from the newest record.
    const missedAroundId = isStartRefused && current.isRequestedStart ? current.start.aroundId : current.missedAroundId;
    current = { ...current, ...next, start: {}, fallbacks: [], isRequestedStart: false, missedAroundId };
    setLoad(current);
  } else if (revision !== undefined && current.revision === undefined) {
    current = { ...current, revision };
    setLoad(current);
  } else if (revision !== undefined && revision !== current.revision) {
    // The history changed: one page around the topmost row on screen replaces the whole window, so no stale page
    // is kept or asked for again. At the newest page it is simply the newest page again.
    const firstPage = shown?.pages[0]?.items.length ?? 0;
    const visible = getVisibleIds?.() ?? [];
    const index = Math.max(
      0,
      view.items.findIndex(({ id }) => visible.includes(id)),
    );
    const candidates = shown && (hasPreviousPage || index >= firstPage) ? anchorCandidates(view.items, index) : [];
    const [anchor, ...fallbacks] = candidates;

    current = {
      ...current,
      ...next,
      revision,
      start: anchor ? { aroundId: anchor } : shown ? {} : current.start,
      fallbacks,
      isRequestedStart: anchor ? false : current.isRequestedStart,
    };
    setLoad(current);
  }

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
    () =>
      setLoad((prev) => ({
        ...prev,
        generation: prev.generation + 1,
        start: {},
        isReload: true,
        fallbacks: [],
        isRequestedStart: false,
      })),
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
    missedAroundId: current.missedAroundId,
    loadNextPage,
    loadPreviousPage,
    refresh,
    retry,
  };
};

export default useTransactionsFeed;
