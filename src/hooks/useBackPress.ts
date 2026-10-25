import { useEffect, useLayoutEffect, useRef } from 'react';
import type { NativeEventSubscription } from 'react-native';
import { BackHandler } from 'react-native';

interface Entry {
  onBack: () => void;
}

// Android Back goes to the most recently enabled handler alone, so a sheet stacked above another takes it first
// whatever order their effects subscribe in; a handler that changes keeps its place.
const stack: Entry[] = [];
let subscription: NativeEventSubscription | null = null;

const handleBackPress = () => {
  const top = stack[stack.length - 1];
  if (!top) return false;

  top.onBack();
  return true;
};

const useBackPress = (isEnabled: boolean, onBack: () => void) => {
  const entryRef = useRef<Entry>({ onBack });
  useLayoutEffect(() => {
    entryRef.current.onBack = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!isEnabled) return;

    const entry = entryRef.current;
    stack.push(entry);
    subscription ??= BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      stack.splice(stack.indexOf(entry), 1);
      if (stack.length === 0) {
        subscription?.remove();
        subscription = null;
      }
    };
  }, [isEnabled]);
};

export default useBackPress;
