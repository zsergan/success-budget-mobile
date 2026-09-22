import { useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import type { CategoryModel } from '@api/models';

const useCategoryEditor = () => {
  const editorRef = useRef<BottomSheetModal>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryModel | undefined>(undefined);

  const openCreate = () => {
    setEditingCategory(undefined);
    editorRef.current?.present();
  };

  const openEdit = (category: CategoryModel) => {
    setEditingCategory(category);
    editorRef.current?.present();
  };

  return { editorRef, editingCategory, openCreate, openEdit };
};

export default useCategoryEditor;
