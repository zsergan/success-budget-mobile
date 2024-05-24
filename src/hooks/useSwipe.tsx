import type { Swipeable } from 'react-native-gesture-handler';
import { useRef } from 'react';

const useSwipe = () => {
  const row: Array<Swipeable | null> = [];
  const prevOpenedRow = useRef<Swipeable | null>(null);

  const closeRows = (index: number) => {
    if (prevOpenedRow && prevOpenedRow.current !== row[index]) {
      prevOpenedRow.current?.close();
    }
    prevOpenedRow.current = row[index];
  };

  const swipeRef = (ref: Swipeable | null, index: number) => (row[index] = ref);

  const onBegan = (index: number) => closeRows(index);

  return { swipeRef, onBegan };
};

export default useSwipe;
