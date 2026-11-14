import { useCallback, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { CategoryModel } from '@api/models';
import { useBackPress, useSheetPresence } from '@hooks';
import { useAppDispatch } from '@redux/hooks';
import type { TransactionFlow } from '@redux/state/transactionFlow/slice';
import { categoryCreated } from '@redux/state/transactionFlow/slice';
import type { TransactionType } from '@shared/enums';

// One showing of the category sheet, for the draft it was opened on.
interface Opening {
  id: number;
  draftId: number;
  transactionType: TransactionType;
}

let lastOpeningId = 0;

interface Options {
  // The flow this screen may act for now, or null while something covers it or a write runs.
  getIdleFlow: () => TransactionFlow | null;
  // Runs the opening once the keyboard has gone, unless the screen's picker delay dropped it meanwhile.
  runDelayed: (action: () => void) => void;
  // After the new category went to the draft.
  onCreated?: () => void;
}

// A new category made from the screen this is used on, in a sheet that screen owns. Each opening answers for itself:
// once it has ended (Cancel, a swipe, Back, the screen going) a late answer to its request changes nothing here.
const useCategoryCreation = ({ getIdleFlow, runDelayed, onCreated }: Options) => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const [opening, setOpening] = useState<Opening | null>(null);
  const openingRef = useRef<Opening | null>(null);
  const { ref: sheetRef, settleDismiss } = useSheetPresence(opening !== null);

  const end = useCallback((id: number | undefined) => {
    if (id === undefined || openingRef.current?.id !== id) return false;

    openingRef.current = null;
    setOpening(null);
    return true;
  }, []);

  const isOpen = useCallback(() => openingRef.current !== null, []);

  const open = useCallback(() => {
    const flow = getIdleFlow();
    if (!flow || openingRef.current) return;

    const { draftId } = flow;
    runDelayed(() => {
      const current = getIdleFlow();
      if (!current?.draft || current.draftId !== draftId || openingRef.current || !navigation.isFocused()) return;

      lastOpeningId += 1;
      openingRef.current = { id: lastOpeningId, draftId, transactionType: current.draft.transactionType };
      setOpening(openingRef.current);
    });
  }, [getIdleFlow, runDelayed, navigation]);

  // Back, in any of its forms, closes the sheet alone; the screen under it and the draft stay.
  const close = useCallback(() => {
    Keyboard.dismiss();
    end(openingRef.current?.id);
  }, [end]);

  useBackPress(opening !== null, close);

  // A swipe, the backdrop or the sheet's own ✕.
  const handleDismiss = useCallback(() => {
    if (settleDismiss()) end(openingRef.current?.id);
  }, [settleDismiss, end]);

  const handleSaved = useCallback(
    (id: number, category: CategoryModel) => {
      const current = openingRef.current;
      if (!current || !end(id)) return;

      dispatch(
        categoryCreated({
          draftId: current.draftId,
          categoryId: category.id,
          transactionType: category.transactionType,
        }),
      );
      onCreated?.();
    },
    [dispatch, end, onCreated],
  );

  return { opening, sheetRef, isOpen, open, close, handleDismiss, handleSaved };
};

export type CategoryCreation = ReturnType<typeof useCategoryCreation>;

export default useCategoryCreation;
