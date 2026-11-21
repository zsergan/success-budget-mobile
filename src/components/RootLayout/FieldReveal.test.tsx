import { useRef } from 'react';
import type { EmitterSubscription, View } from 'react-native';
import { Keyboard, ScrollView, View as NativeView } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { FieldRevealProvider, useFieldRevealScroll, useRevealWhileFocused } from './FieldReveal';

interface Box {
  top: number;
  height: number;
}

type MeasureCallback = (x: number, y: number, width: number, height: number) => void;

// Frames and native measurements answer only when a test lets them, like the native side does.
let frames: FrameRequestCallback[] = [];
let measurements: (() => void)[] = [];
let keyboardListeners: Record<string, (() => void)[]> = {};

// A measurement reports the box as it is when the native side answers, not when it was asked.
const measured = (box: Box) => (callback: MeasureCallback) =>
  measurements.push(() => callback(0, box.top, 400, box.height));

const makeScroll = (viewport: Box) => ({
  viewport,
  scrollTo: jest.fn(),
  getNativeScrollRef: () => ({ measureInWindow: measured(viewport) }),
});

const makeField = (box: Box) => ({ box, measureInWindow: measured(box) });

type Scroll = ReturnType<typeof makeScroll>;
type Field = ReturnType<typeof makeField>;

const runFrame = () =>
  act(() => {
    const queued = frames;
    frames = [];
    queued.forEach((callback) => callback(0));
  });

const answerMeasurements = () =>
  act(() => {
    while (measurements.length) measurements.shift()!();
  });

const settle = () => {
  runFrame();
  answerMeasurements();
};

const keyboardDidShow = () => act(() => keyboardListeners.keyboardDidShow?.forEach((listener) => listener()));

interface FieldProps {
  field: Field;
  isFocused: boolean;
  testID?: string;
}

const FieldBlock = ({ field, isFocused, testID }: FieldProps) => {
  const ref = useRef(field as unknown as View);
  const { onLayout } = useRevealWhileFocused(ref, isFocused);

  return <NativeView testID={testID} onLayout={onLayout} />;
};

const Screen = ({ scroll, fields }: { scroll: Scroll; fields: FieldProps[] }) => {
  const scrollRef = useRef(scroll as unknown as ScrollView);
  const reveal = useFieldRevealScroll(scrollRef);

  return (
    <ScrollView testID="scroll" onScroll={reveal.onScroll} onLayout={reveal.onLayout}>
      <FieldRevealProvider value={reveal.value}>
        {fields.map((props, index) => (
          <FieldBlock key={index} {...props} />
        ))}
      </FieldRevealProvider>
    </ScrollView>
  );
};

const scrolledBy = (y: number) =>
  fireEvent.scroll(screen.getByTestId('scroll'), { nativeEvent: { contentOffset: { x: 0, y } } });

const relaidOut = (testID = 'scroll') => fireEvent(screen.getByTestId(testID), 'layout', {});

beforeEach(() => {
  frames = [];
  measurements = [];
  keyboardListeners = {};
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  jest.spyOn(Keyboard, 'addListener').mockImplementation((event, listener) => {
    (keyboardListeners[event] ??= []).push(listener as () => void);
    return {
      remove: () => {
        keyboardListeners[event] = keyboardListeners[event].filter((item) => item !== listener);
      },
    } as EmitterSubscription;
  });
});

afterEach(() => jest.restoreAllMocks());

it('scrolls a focused field below the visible area up into it, with room under its message', () => {
  const scroll = makeScroll({ top: 0, height: 600 });
  const bottom = makeField({ top: 620, height: 80 });
  render(<Screen scroll={scroll} fields={[{ field: bottom, isFocused: false }]} />);
  settle();

  scrolledBy(50);
  screen.rerender(<Screen scroll={scroll} fields={[{ field: bottom, isFocused: true }]} />);
  settle();

  expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 50 + 620 + 80 + 16 - 600 });
});

it('leaves a focused field that is already in view where it is', () => {
  const scroll = makeScroll({ top: 0, height: 600 });
  const field = makeField({ top: 200, height: 80 });

  render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);
  settle();
  keyboardDidShow();
  settle();

  expect(scroll.scrollTo).not.toHaveBeenCalled();
});

it('brings a focused field above the visible area back into it, never scrolling past the top', () => {
  const scroll = makeScroll({ top: 100, height: 600 });
  const field = makeField({ top: 40, height: 80 });

  render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);
  settle();

  expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 0 });
});

it('reveals the field once the keyboard shrinks the view after the focus, and not after it closes', () => {
  const scroll = makeScroll({ top: 0, height: 700 });
  const field = makeField({ top: 500, height: 80 });
  render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);
  settle();

  expect(scroll.scrollTo).not.toHaveBeenCalled();

  scroll.viewport.height = 400;
  relaidOut();
  settle();

  expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 500 + 80 + 16 - 400 });

  scroll.scrollTo.mockClear();
  screen.rerender(<Screen scroll={scroll} fields={[{ field, isFocused: false }]} />);
  scroll.viewport.height = 700;
  relaidOut();
  keyboardDidShow();
  settle();

  expect(scroll.scrollTo).not.toHaveBeenCalled();
});

it('checks the field again once the keyboard is up, when the native size was not settled before', () => {
  const scroll = makeScroll({ top: 0, height: 700 });
  const field = makeField({ top: 500, height: 80 });
  render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);

  // The layout event comes while the native side still reports the view's old size.
  relaidOut();
  settle();
  expect(scroll.scrollTo).not.toHaveBeenCalled();

  scroll.viewport.height = 400;
  keyboardDidShow();
  settle();

  expect(scroll.scrollTo).toHaveBeenCalledTimes(1);
  expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 500 + 80 + 16 - 400 });
});

it('measures once for requests that come before the next frame', () => {
  const scroll = makeScroll({ top: 0, height: 400 });
  const field = makeField({ top: 500, height: 80 });
  render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);

  relaidOut();
  keyboardDidShow();
  settle();

  expect(scroll.scrollTo).toHaveBeenCalledTimes(1);
});

it('reveals the next field when the focus moves while the keyboard is already up', () => {
  const scroll = makeScroll({ top: 0, height: 400 });
  const upper = makeField({ top: 100, height: 80 });
  const lower = makeField({ top: 450, height: 80 });
  const layout = (upperFocused: boolean, lowerFocused: boolean) => (
    <Screen
      scroll={scroll}
      fields={[
        { field: upper, isFocused: upperFocused },
        { field: lower, isFocused: lowerFocused },
      ]}
    />
  );
  render(layout(true, false));
  settle();

  screen.rerender(layout(false, true));
  settle();

  expect(scroll.scrollTo).toHaveBeenCalledTimes(1);
  expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 450 + 80 + 16 - 400 });
});

it('drops a measurement that answers after its field lost the focus', () => {
  const scroll = makeScroll({ top: 0, height: 400 });
  const field = makeField({ top: 450, height: 80 });
  render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);
  runFrame();

  screen.rerender(<Screen scroll={scroll} fields={[{ field, isFocused: false }]} />);
  answerMeasurements();

  expect(scroll.scrollTo).not.toHaveBeenCalled();
});

it('drops a measurement that answers after its field is gone', () => {
  const scroll = makeScroll({ top: 0, height: 400 });
  const field = makeField({ top: 450, height: 80 });
  render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);
  runFrame();

  screen.rerender(<Screen scroll={scroll} fields={[]} />);
  answerMeasurements();

  expect(scroll.scrollTo).not.toHaveBeenCalled();
});

it('drops a measurement that answers after the focus moved to another field', () => {
  const scroll = makeScroll({ top: 0, height: 400 });
  const upper = makeField({ top: 100, height: 80 });
  const lower = makeField({ top: 450, height: 80 });
  const layout = (upperFocused: boolean, lowerFocused: boolean) => (
    <Screen
      scroll={scroll}
      fields={[
        { field: upper, isFocused: upperFocused },
        { field: lower, isFocused: lowerFocused },
      ]}
    />
  );
  render(layout(false, true));
  runFrame();

  screen.rerender(layout(true, false));
  answerMeasurements();
  settle();

  expect(scroll.scrollTo).not.toHaveBeenCalled();
});

it('follows a focused multiline field as it grows, by only what it grew', () => {
  const scroll = makeScroll({ top: 0, height: 400 });
  const field = makeField({ top: 300, height: 52 });
  render(<Screen scroll={scroll} fields={[{ field, isFocused: true, testID: 'note' }]} />);
  settle();
  expect(scroll.scrollTo).not.toHaveBeenCalled();

  field.box.height = 88;
  relaidOut('note');
  settle();

  expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 300 + 88 + 16 - 400 });
});

it('ignores the layout of a field that is not focused', () => {
  const scroll = makeScroll({ top: 0, height: 400 });
  const field = makeField({ top: 450, height: 80 });
  render(<Screen scroll={scroll} fields={[{ field, isFocused: false, testID: 'note' }]} />);

  relaidOut('note');
  settle();

  expect(scroll.scrollTo).not.toHaveBeenCalled();
});

it('never pulls the view back while the user scrolls', () => {
  const scroll = makeScroll({ top: 0, height: 400 });
  const field = makeField({ top: 300, height: 52 });
  render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);
  settle();

  field.box.top = 600;
  scrolledBy(300);
  settle();

  expect(frames).toHaveLength(0);
  expect(scroll.scrollTo).not.toHaveBeenCalled();
});
