import { useCallback } from 'react';

import { useAppSelector, useAppStore } from '@redux/hooks';
import type { RootState } from '@redux/Store';
import { hasOpenForm, selectTransactionFlow } from '@redux/state/transactionFlow/selectors';

// The flow an editor route shows: the open form of the space the route was opened for, or nothing once that flow
// ended or left the form. `getFlow` reads it as it is now, for a handler that runs after the render.
const useEditorFlow = (spaceId: number) => {
  const store = useAppStore();
  const select = useCallback(
    (state: RootState) => {
      const flow = selectTransactionFlow(state);
      return flow && hasOpenForm(flow) && flow.spaceId === spaceId ? flow : null;
    },
    [spaceId],
  );
  const flow = useAppSelector(select);
  const getFlow = useCallback(() => select(store.getState()), [select, store]);

  return { flow, getFlow };
};

export default useEditorFlow;
