import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import type { ErrorResponse, StatisticsQuery } from '@api/dto';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { StatisticsArg, StatisticsBreakdownArg } from '@redux/state/statistics/api';
import {
  useGetStatisticsBreakdownQuery,
  useGetStatisticsRevisionQuery,
  useGetStatisticsSummaryQuery,
  useGetStatisticsTrendQuery,
} from '@redux/state/statistics/api';
import {
  areStatisticsConsistent,
  getDeviceTimeZone,
  isAsOfRejected,
  toStatisticsQuery,
} from '@redux/state/statistics/selectors';
import { TransactionType } from '@shared/enums';
import type { DateRange } from '@shared/utils';

// A return to the screen or the app refreshes only data older than this.
export const STATS_STALE_AFTER_MS = 30_000;

const BLOCKS = ['summary', 'trend', 'breakdown'] as const;

type BlockName = (typeof BLOCKS)[number];

interface BlockArgs {
  summary: StatisticsArg;
  trend: StatisticsArg;
  breakdown: StatisticsBreakdownArg;
}

type CurrentArgs = { [Block in BlockName]: BlockArgs[Block] | typeof skipToken };

// One load cycle: all three blocks share its space, period, zone and as_of.
interface Cycle {
  id: number;
  scopeKey: string;
  spaceId: number;
  query: StatisticsQuery;
  // null: the device clock was rejected, so the server's clock is used (echoed by summary).
  asOf: string | null;
  startedAt: number;
  // The one automatic reload after control sums disagreed; it is not repeated.
  isReconciling: boolean;
}

interface CycleState {
  cycle: Cycle | null;
  // Per block, the latest cycle of this scope whose request succeeded, kept on screen while a newer one runs.
  lastGood: Partial<BlockArgs>;
  useServerClock: boolean;
  seenRevision: { spaceId: number | null; revision: number } | null;
}

interface RestartOptions {
  useServerClock?: boolean;
  isReconciling?: boolean;
}

export interface StatsBlock<T> {
  data: T | undefined;
  // Nothing to show yet.
  isLoading: boolean;
  // Showing an earlier cycle's data while this cycle's request runs.
  isUpdating: boolean;
  // Failed with nothing to show.
  hasError: boolean;
  // Showing an earlier cycle's data because this cycle's request failed.
  updateFailed: boolean;
  // Why this cycle's request failed, while it stays failed.
  error: ErrorResponse | undefined;
  retry: () => void;
}

interface QueryLike<T> {
  currentData?: T;
  isError: boolean;
  error?: unknown;
  refetch: () => unknown;
}

// Not a failure to retry: the user is no longer a member of the space, or it is gone.
export const isSpaceAccessDenied = (error: ErrorResponse | undefined) => error?.statusCode === 403;

let lastCycleId = 0;

const argKey = (arg: StatisticsArg | typeof skipToken) => (arg === skipToken ? '' : JSON.stringify(arg));

const cycleArg = (cycle: Cycle, asOf: string | null): StatisticsArg => ({
  spaceId: cycle.spaceId,
  cycleId: cycle.id,
  query: asOf === null ? cycle.query : { ...cycle.query, as_of: asOf },
});

const startCycle = (
  base: Pick<Cycle, 'scopeKey' | 'spaceId' | 'query'>,
  useServerClock: boolean,
  isReconciling = false,
): Cycle => ({
  ...base,
  id: ++lastCycleId,
  asOf: useServerClock ? null : new Date().toISOString(),
  startedAt: Date.now(),
  isReconciling,
});

const restart = (prev: CycleState, options: RestartOptions): CycleState => {
  if (!prev.cycle) return prev;

  const useServerClock = options.useServerClock ?? prev.useServerClock;

  return { ...prev, useServerClock, cycle: startCycle(prev.cycle, useServerClock, options.isReconciling) };
};

const toBlock = <T>(
  current: QueryLike<T>,
  fallback: QueryLike<T>,
  { isSkipped, isBlocked, retry }: { isSkipped: boolean; isBlocked: boolean; retry: () => void },
): StatsBlock<T> => {
  const failed = current.isError || isBlocked;
  const error = current.isError ? (current.error as ErrorResponse | undefined) : undefined;

  if (current.currentData !== undefined) {
    return {
      data: current.currentData,
      isLoading: false,
      isUpdating: false,
      hasError: false,
      updateFailed: false,
      error: undefined,
      retry,
    };
  }

  if (fallback.currentData !== undefined) {
    return {
      data: fallback.currentData,
      isLoading: false,
      isUpdating: !failed,
      hasError: false,
      updateFailed: failed,
      error,
      retry,
    };
  }

  return {
    data: undefined,
    isLoading: !isSkipped && !failed,
    hasError: failed,
    isUpdating: false,
    updateFailed: false,
    error,
    retry,
  };
};

const useStatsData = (range: DateRange) => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [timeZone, setTimeZone] = useState(getDeviceTimeZone);

  const query = toStatisticsQuery(range, timeZone);
  const scopeKey = spaceId === null ? null : JSON.stringify([spaceId, query]);

  const [stored, setStored] = useState<CycleState>({
    cycle: null,
    lastGood: {},
    useServerClock: false,
    seenRevision: null,
  });

  // A new space, period or zone replaces the cycle in this same render, so the
  // previous scope's figures are never shown under the new header.
  let state = stored;
  if ((stored.cycle?.scopeKey ?? null) !== scopeKey) {
    state = {
      ...stored,
      cycle: scopeKey === null ? null : startCycle({ scopeKey, spaceId: spaceId!, query }, stored.useServerClock),
      lastGood: {},
    };
    setStored(state);
  }

  const { cycle } = state;

  const summaryArg = cycle ? cycleArg(cycle, cycle.asOf) : skipToken;
  const summary = useGetStatisticsSummaryQuery(summaryArg);

  // On the server's clock the other blocks wait for the as_of summary was answered with.
  const sharedAsOf = cycle?.asOf ?? summary.currentData?.period.as_of ?? null;
  const isWaitingForAsOf = !!cycle && sharedAsOf === null;
  const blockArg = cycle && !isWaitingForAsOf ? cycleArg(cycle, sharedAsOf) : skipToken;

  const trend = useGetStatisticsTrendQuery(blockArg);
  const breakdownArg = blockArg === skipToken ? skipToken : { ...blockArg, transactionType: TransactionType.EXPENSE };
  const breakdown = useGetStatisticsBreakdownQuery(breakdownArg);

  const current = { summary, trend, breakdown };
  const currentArgs: CurrentArgs = { summary: summaryArg, trend: blockArg, breakdown: breakdownArg };

  const succeeded = BLOCKS.filter(
    (block) =>
      current[block].currentData !== undefined &&
      argKey(state.lastGood[block] ?? skipToken) !== argKey(currentArgs[block]),
  );
  if (succeeded.length > 0) {
    const lastGood = succeeded.reduce<Partial<BlockArgs>>(
      (args, block) => ({ ...args, [block]: currentArgs[block] }),
      state.lastGood,
    );
    state = { ...state, lastGood };
    setStored(state);
  }

  const fallbackArg = <Block extends BlockName>(block: Block): BlockArgs[Block] | typeof skipToken => {
    const arg = state.lastGood[block];

    return arg && argKey(arg) !== argKey(currentArgs[block]) ? (arg as BlockArgs[Block]) : skipToken;
  };

  const summaryFallback = useGetStatisticsSummaryQuery(fallbackArg('summary'));
  const trendFallback = useGetStatisticsTrendQuery(fallbackArg('trend'));
  const breakdownFallback = useGetStatisticsBreakdownQuery(fallbackArg('breakdown'));

  // Adjusting state during render (not in an effect) keeps each render's blocks on one cycle.
  const restartInRender = (options: RestartOptions) => {
    state = restart(state, options);
    setStored(state);
  };

  const asOfRejected = [summary, trend, breakdown].some((block) => isAsOfRejected(block.error));
  if (asOfRejected && cycle && cycle.asOf !== null) {
    restartInRender({ useServerClock: true, isReconciling: cycle.isReconciling });
  }

  const isInconsistent =
    summary.currentData !== undefined &&
    trend.currentData !== undefined &&
    breakdown.currentData !== undefined &&
    !areStatisticsConsistent(summary.currentData, trend.currentData, breakdown.currentData);
  if (isInconsistent && cycle && !cycle.isReconciling) {
    restartInRender({ isReconciling: true });
  }

  // A successful mutation bumps the revision; the first value for a space is only its baseline.
  const { currentData: revision } = useGetStatisticsRevisionQuery(useSpaceArg());
  if (revision !== undefined && revision !== state.seenRevision?.revision) {
    const isBump = state.seenRevision?.spaceId === spaceId;
    state = { ...state, seenRevision: { spaceId, revision } };
    setStored(state);
    if (isBump) restartInRender({});
  }

  const refresh = () => {
    const zone = getDeviceTimeZone();

    // A changed zone is a new scope and starts its own cycle; otherwise this one restarts.
    if (zone === timeZone) setStored((prev) => restart(prev, {}));
    else setTimeZone(zone);
  };

  const cycleStartedAt = cycle?.startedAt;
  const refreshIfStale = () => {
    if (cycleStartedAt !== undefined && Date.now() - cycleStartedAt >= STATS_STALE_AFTER_MS) refresh();
  };

  const isSkipped = cycle === null;
  const summaryBlock = toBlock(summary, summaryFallback, { isSkipped, isBlocked: false, retry: summary.refetch });
  const waitingRetry = isWaitingForAsOf ? summary.refetch : undefined;
  const isBlocked = isWaitingForAsOf && summary.isError;
  const trendBlock = toBlock(trend, trendFallback, {
    isSkipped,
    isBlocked,
    retry: waitingRetry ?? trend.refetch,
  });
  const breakdownBlock = toBlock(breakdown, breakdownFallback, {
    isSkipped,
    isBlocked,
    retry: waitingRetry ?? breakdown.refetch,
  });

  const blocks = [summaryBlock, trendBlock, breakdownBlock];
  // A blocked block carries no error of its own; summary's is the one it waits on.
  const errors = blocks.map((block) => block.error ?? (block.hasError ? summaryBlock.error : undefined));
  const retryFailed = () => {
    const failed = blocks.filter((block) => block.hasError || block.updateFailed);
    // Blocks waiting on summary share its retry; run it once.
    new Set(failed.map((block) => block.retry)).forEach((retry) => retry());
  };

  return {
    summary: summaryBlock,
    trend: trendBlock,
    breakdown: breakdownBlock,
    isUpdating: blocks.some((block) => block.isUpdating),
    updateFailed: blocks.some((block) => block.updateFailed),
    // Every block failed with nothing to show: one screen-wide failure instead of three cards.
    loadFailed: blocks.every((block) => block.hasError),
    loadError: errors.find((error) => error !== undefined),
    accessDenied: errors.some(isSpaceAccessDenied),
    refresh,
    refreshIfStale,
    retryFailed,
  };
};

export default useStatsData;
