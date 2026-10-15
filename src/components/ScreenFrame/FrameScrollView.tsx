import type { Ref } from 'react';
import type { ScrollViewProps } from 'react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { useScreenTopInset } from './ScreenFrame';

const FrameScrollView = ({ contentContainerStyle, ...props }: ScrollViewProps & { ref?: Ref<ScrollView> }) => {
  const topInset = useScreenTopInset();
  const paddingTop = StyleSheet.flatten(contentContainerStyle)?.paddingTop;

  return (
    <ScrollView
      {...props}
      contentContainerStyle={[
        contentContainerStyle,
        { paddingTop: topInset + (typeof paddingTop === 'number' ? paddingTop : 0) },
      ]}
    />
  );
};

export default FrameScrollView;
