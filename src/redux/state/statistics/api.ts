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

// On `/api/v2`, whose breakdown groups by assignment instead of wallet.
// The three blocks provide no tags: a refetch would reuse the cycle's as_of and miss
// the change, so the tags bump this local marker instead and a new value starts a new cycle.
export const statisticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStatisticsSummary: build.query<StatisticsSummary, StatisticsArg>({
      query: ({ spaceId, query }) => ({
        url: `/spaces/${spaceId}/statistics/summary`,
        params: { ...query },
        apiVersion: 2,
      }),
    }),
    getStatisticsTrend: build.query<StatisticsTrend, StatisticsArg>({
      query: ({ spaceId, query }) => ({
        url: `/spaces/${spaceId}/statistics/trend`,
        params: { ...query },
        apiVersion: 2,
      }),
    }),
    getStatisticsBreakdown: build.query<StatisticsBreakdown, StatisticsBreakdownArg>({
      query: ({ spaceId, query, transactionType }) => {
        const params: StatisticsBreakdownQuery = { ...query, transaction_type: transactionType };

        return { url: `/spaces/${spaceId}/statistics/breakdown`, params: { ...params }, apiVersion: 2 };
      },
    }),
    getStatisticsRevision: build.query<number, SpaceArg>({
      queryFn: () => ({ data: ++revision }),
      // Members too: a breakdown names its people by their current names and membership.
      providesTags: (_result, _error, { spaceId }) => spaceTags(spaceId, 'Transactions', 'Categories', 'Members'),
    }),
  }),
});

export const {
  useGetStatisticsSummaryQuery,
  useGetStatisticsTrendQuery,
  useGetStatisticsBreakdownQuery,
  useGetStatisticsRevisionQuery,
} = statisticsApi;
