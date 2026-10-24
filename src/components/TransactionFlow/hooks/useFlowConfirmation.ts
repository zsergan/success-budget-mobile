import useConfirmation from '@hooks/useConfirmation';
import type { RootState } from '@redux/Store';
import { selectTransactionFlow } from '@redux/state/transactionFlow/selectors';

// A confirmation over the flow answers for the draft and view it was asked in; once either changes it is gone.
const selectConfirmScope = (state: RootState) => {
  const flow = selectTransactionFlow(state);
  return flow ? `${flow.draftId}:${flow.view.name}` : null;
};

const useFlowConfirmation = () => useConfirmation(selectConfirmScope);

export default useFlowConfirmation;
