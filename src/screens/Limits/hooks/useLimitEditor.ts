import { useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import type { LimitModel } from '@api/models';
import type { LimitScope } from '../LimitEditor/useLimitEditorForm';

interface EditorTarget {
  limit?: LimitModel;
  scope?: LimitScope;
}

const useLimitEditor = () => {
  const editorRef = useRef<BottomSheetModal>(null);
  const [editorTarget, setEditorTarget] = useState<EditorTarget>({});
  const [editorKey, setEditorKey] = useState(0);

  const openEditor = (target: EditorTarget) => {
    setEditorTarget(target);
    setEditorKey((key) => key + 1);
    editorRef.current?.present();
  };

  return { editorTarget, editorKey, openEditor, editorRef };
};

export default useLimitEditor;
