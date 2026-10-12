import type {
  StatisticsBreakdown,
  StatisticsBreakdownQuery,
  StatisticsQuery,
  StatisticsSummary,
  StatisticsTrend,
} from '@api/dto';
import type { SpaceArg } from '@redux/api/baseApi';
import { baseApi, spaceTags } from '@redux/api/baseApi';
import type { TransactionType } from '@shared/enums';

export interface StatisticsArg extends SpaceArg {
  query: StatisticsQuery;
  // Keys the cache only, never sent: without as_of a new load cycle would otherwise reuse the last answer.
  cycleId: number;
}

export interface StatisticsBreakdownArg extends StatisticsArg {
  transactionType: TransactionType;
}

let revision = 0;

// The three blocks provide no tags: a refetch would reuse the cycle's as_of and miss
// the change, so the tags bump this local marker instead and a new value starts a new cycle.
export const statisticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStatisticsSummary: build.query<StatisticsSummary, StatisticsArg>({
      query: ({ spaceId, query }) => ({ url: `/spaces/${spaceId}/statistics/summary`, params: { ...query } }),
    }),
    getStatisticsTrend: build.query<StatisticsTrend, StatisticsArg>({
      query: ({ spaceId, query }) => ({ url: `/spaces/${spaceId}/statistics/trend`, params: { ...query } }),
    }),
    getStatisticsBreakdown: build.query<StatisticsBreakdown, StatisticsBreakdownArg>({
      query: ({ spaceId, query, transactionType }) => {
        const params: StatisticsBreakdownQuery = { ...query, transaction_type: transactionType };

        return { url: `/spaces/${spaceId}/statistics/breakdown`, params: { ...params } };
      },
    }),
    getStatisticsRevision: build.query<number, SpaceArg>({
      queryFn: () => ({ data: ++revision }),
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions', 'Wallets', 'Categories'),
    }),
  }),
});

export const {
  useGetStatisticsSummaryQuery,
  useGetStatisticsTrendQuery,
  useGetStatisticsBreakdownQuery,
  useGetStatisticsRevisionQuery,
} = statisticsApi;
