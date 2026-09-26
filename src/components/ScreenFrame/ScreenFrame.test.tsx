import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render, screen } from '@testing-library/react-native';
import type { ReactTestRendererJSON, ReactTestRendererNode } from 'react-test-renderer';

import FrameScrollView from './FrameScrollView';
import ScreenFrame, { useScreenTopInset } from './ScreenFrame';

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

type RenderedNode = ReactTestRendererNode | ReactTestRendererNode[] | null;

const findByTestId = (node: RenderedNode, testID: string): ReactTestRendererJSON | undefined => {
  if (!node || typeof node === 'string') {
    return undefined;
  }
  if (Array.isArray(node)) {
    return node.map((child) => findByTestId(child, testID)).find(Boolean);
  }
  return node.props.testID === testID ? node : findByTestId(node.children, testID);
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

  it('draws the blur after the content and lets touches through it', () => {
    renderFrame(true);

    const frame = findByTestId(screen.toJSON(), 'screen-frame');
    const blur = frame?.children?.at(-1);

    expect(typeof blur === 'object' && blur.props.testID).toBe('status-bar-blur');
    expect(StyleSheet.flatten(screen.getByTestId('status-bar-blur').props.style)).toMatchObject({
      pointerEvents: 'none',
    });
  });

  it('adds the inset on top of the scroll content padding', () => {
    render(
      <SafeAreaProvider initialMetrics={metrics}>
        <ScreenFrame blurredStatusBar>
          <FrameScrollView testID="scroll" contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }} />
        </ScreenFrame>
      </SafeAreaProvider>,
    );

    const contentStyle = StyleSheet.flatten(screen.getByTestId('scroll').props.contentContainerStyle);
    expect(contentStyle).toMatchObject({ paddingTop: 74, paddingBottom: 40 });
  });
});
