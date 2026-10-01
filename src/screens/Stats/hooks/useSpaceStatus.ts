import type { ErrorResponse } from '@api/dto';
import { useAppSelector } from '@redux/hooks';
import { useGetSpacesQuery } from '@redux/state/space/api';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';

export type SpaceStatus = 'ready' | 'loading' | 'failed' | 'missing';

// Why there is no space to ask about: the list is on its way, it failed, or it holds nothing selected.
const useSpaceStatus = () => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const { currentData: spaces, isError, error, refetch } = useGetSpacesQuery();

  const status: SpaceStatus =
    spaceId !== null ? 'ready' : spaces !== undefined ? 'missing' : isError ? 'failed' : 'loading';

  return {
    status,
    spaces: spaces ?? [],
    error: status === 'failed' ? (error as ErrorResponse | undefined) : undefined,
    retry: refetch,
  };
};

export default useSpaceStatus;
