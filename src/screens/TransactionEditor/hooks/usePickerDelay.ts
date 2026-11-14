import { useCallback, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';

import { afterKeyboardHides } from '@shared/utils';

// A picker opens once the keyboard has gone. Only the last one asked for opens, and none once the screen lost focus
// or its draft changed; the action still checks for itself that it may run.
const usePickerDelay = (draftId: number | undefined) => {
  const navigation = useNavigation();
  const cancelRef = useRef<(() => void) | null>(null);

  const cancel = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
  }, []);

  useEffect(() => cancel, [draftId, cancel]);
  useEffect(() => navigation.addListener('blur', cancel), [navigation, cancel]);

  const run = useCallback(
    (action: () => void) => {
      cancel();
      cancelRef.current = afterKeyboardHides(() => {
        cancelRef.current = null;
        action();
      });
    },
    [cancel],
  );

  return { run, cancel };
};

export default usePickerDelay;
