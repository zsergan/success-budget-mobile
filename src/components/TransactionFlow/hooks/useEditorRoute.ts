import { useEffect } from 'react';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppSelector } from '@redux/hooks';
import { hasOpenForm, selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import { ScreenNames } from '@shared/enums';
import type { RootStackParamList } from '@shared/types';

// Opens the editor route once the flow has a form and the sheet has gone; the route leaves by itself when the flow
// lets the form go, so there is never a second one. Returns whether it is in the stack.
const useEditorRoute = (isSheetUp: boolean) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const formSpaceId = useAppSelector((state) => {
    const flow = selectTransactionFlow(state);
    return flow && hasOpenForm(flow) ? flow.spaceId : null;
  });
  const isEditorOpen = useNavigationState<RootStackParamList, boolean>(({ routes }) =>
    routes.some(({ name }) => name === ScreenNames.TRANSACTION_EDITOR_SCREEN),
  );

  useEffect(() => {
    if (formSpaceId !== null && !isEditorOpen && !isSheetUp) {
      navigation.navigate(ScreenNames.TRANSACTION_EDITOR_SCREEN, { spaceId: formSpaceId });
    }
  }, [navigation, formSpaceId, isEditorOpen, isSheetUp]);

  return isEditorOpen;
};

export default useEditorRoute;
