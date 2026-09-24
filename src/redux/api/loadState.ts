interface QueryResult {
  currentData?: unknown;
  isError: boolean;
  isUninitialized: boolean;
}

// Loading and failure only describe a query with no result yet for its current
// argument; a background refetch, failed or not, keeps the last result on screen.
export const getLoadState = ({ currentData, isError, isUninitialized }: QueryResult) => ({
  isLoading: !isUninitialized && currentData === undefined && !isError,
  hasError: currentData === undefined && isError,
});
