import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import StatusBarBlur from '@components/StatusBarBlur/StatusBarBlur';

import styles from './style';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  // Defaults to all 4 edges. A screen behind the bottom tab bar must pass
  // ['top','left','right'] -- the tab bar already reserves the bottom inset.
  edges?: Edge[];
  // The screen's scroll view must pad its content by useScreenTopInset() so it starts below the status bar.
  blurredStatusBar?: boolean;
}

const ALL_EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];

const ScreenTopInsetContext = createContext(0);

export const useScreenTopInset = () => useContext(ScreenTopInsetContext);

const ScreenFrame = ({ children, style, edges = ALL_EDGES, blurredStatusBar }: Props) => {
  const { top } = useSafeAreaInsets();

  return (
    <SafeAreaView
      testID="screen-frame"
      style={[styles.root, style]}
      edges={blurredStatusBar ? edges.filter((edge) => edge !== 'top') : edges}
    >
      <ScreenTopInsetContext.Provider value={blurredStatusBar ? top : 0}>{children}</ScreenTopInsetContext.Provider>

      {blurredStatusBar && <StatusBarBlur />}
    </SafeAreaView>
  );
};

export default ScreenFrame;
