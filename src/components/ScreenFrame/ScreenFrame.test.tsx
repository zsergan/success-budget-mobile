import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render, screen } from '@testing-library/react-native';

import ScreenFrame, { useScreenTopInset } from './ScreenFrame';

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

const TopInset = () => <Text>{`inset ${useScreenTopInset()}`}</Text>;

const renderFrame = (blurredStatusBar?: boolean) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ScreenFrame blurredStatusBar={blurredStatusBar}>
        <TopInset />
      </ScreenFrame>
    </SafeAreaProvider>,
  );

describe('ScreenFrame', () => {
  it('hands the status bar inset to the content when the status bar is blurred', () => {
    renderFrame(true);

    expect(screen.getByText('inset 62')).toBeTruthy();
  });

  it('leaves the top inset to the safe area otherwise', () => {
    renderFrame();

    expect(screen.getByText('inset 0')).toBeTruthy();
  });
});
