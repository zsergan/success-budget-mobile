import { useState } from 'react';

import CategoryEditorSheet from '@components/CategoryEditor/CategoryEditorSheet';
import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import type { CategoryCreation } from './useCategoryCreation';

interface Props {
  creation: CategoryCreation;
}

// The sheet of `useCategoryCreation`. Every opening gets its own form, so an answer to an earlier one's request never
// reaches the one on screen.
const CategoryCreationSheet = ({ creation: { opening, sheetRef, handleDismiss, handleSaved } }: Props) => {
  // The form stays in the sheet while it closes.
  const [lastOpening, setLastOpening] = useState(opening);
  if (opening && opening !== lastOpening) setLastOpening(opening);
  const shown = opening ?? lastOpening;

  return (
    <BottomModal ref={sheetRef} fitContent onDismiss={handleDismiss}>
      {shown && (
        <CategoryEditorSheet
          key={shown.id}
          defaultTransactionType={shown.transactionType}
          onSaved={(category) => handleSaved(shown.id, category)}
        />
      )}
    </BottomModal>
  );
};

export default CategoryCreationSheet;
