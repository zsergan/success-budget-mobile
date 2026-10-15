import { useRef } from 'react';
import type { View } from 'react-native';
import { ScrollView } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { FieldRevealProvider, useFieldRevealScroll, useRevealWhileFocused } from './FieldReveal';

interface Box {
  top: number;
  height: number;
}

type Measure = (callback: (x: number, y: number, width: number, height: number) => void) => void;

const measured =
  (box: Box): Measure =>
  (callback) =>
    callback(0, box.top, 400, box.height);

// The scroll view's visible area and a field's block, both in window coordinates, as the native side reports them.
const makeScroll = (viewport: Box) => ({
  viewport,
  scrollTo: jest.fn(),
  getNativeScrollRef: () => ({ measureInWindow: measured(viewport) }),
});

const makeField = (box: Box) => ({ box, measureInWindow: measured(box) });

type Scroll = ReturnType<typeof makeScroll>;
type Field = ReturnType<typeof makeField>;

const FieldBlock = ({ field, isFocused, message }: { field: Field; isFocused: boolean; message?: string }) => {
  const ref = useRef(field as unknown as View);
  useRevealWhileFocused(ref, isFocused, message);

  return null;
};

interface ScreenProps {
  scroll: Scroll;
  fields: { field: Field; isFocused: boolean; message?: string }[];
}

const Screen = ({ scroll, fields }: ScreenProps) => {
  const scrollRef = useRef(scroll as unknown as ScrollView);
  const reveal = useFieldRevealScroll(scrollRef);

  return (
    <ScrollView testID="scroll" onScroll={reveal.onScroll} onLayout={reveal.onLayout}>
      <FieldRevealProvider value={reveal.value}>
        {fields.map(({ field, isFocused, message }, index) => (
          <FieldBlock key={index} field={field} isFocused={isFocused} message={message} />
        ))}
      </FieldRevealProvider>
    </ScrollView>
  );
};

const scrolledBy = (y: number) =>
  fireEvent.scroll(screen.getByTestId('scroll'), { nativeEvent: { contentOffset: { x: 0, y } } });

const relaidOut = () => fireEvent(screen.getByTestId('scroll'), 'layout', {});

beforeEach(() => {
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 0;
  });
});

afterEach(() => jest.restoreAllMocks());

it('scrolls a focused field below the visible area up into it, with room under its message', () => {
  const scroll = makeScroll({ top: 0, height: 600 });
  const bottom = makeField({ top: 620, height: 80 });
  const { rerender } = render(<Screen scroll={scroll} fields={[{ field: bottom, isFocused: false }]} />);

  scrolledBy(50);
  rerender(<Screen scroll={scroll} fields={[{ field: bottom, isFocused: true }]} />);

  expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 50 + 620 + 80 + 16 - 600 });
});

it('leaves a focused field that is already in view where it is', () => {
  const scroll = makeScroll({ top: 0, height: 600 });
  const field = makeField({ top: 200, height: 80 });

  render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);

  expect(scroll.scrollTo).not.toHaveBeenCalled();
});

it('brings a focused field above the visible area back into it, never scrolling past the top', () => {
  const scroll = makeScroll({ top: 100, height: 600 });
  const field = makeField({ top: 40, height: 80 });

  render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);

  expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 0 });
});

it('reveals the field again when an error appears under it', () => {
  const scroll = makeScroll({ top: 0, height: 600 });
  const field = makeField({ top: 500, height: 80 });
  const { rerender } = render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);

  expect(scroll.scrollTo).not.toHaveBeenCalled();

  field.box.height = 110;
  rerender(<Screen scroll={scroll} fields={[{ field, isFocused: true, message: 'Passwords don’t match.' }]} />);

  expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 500 + 110 + 16 - 600 });
});

it('reveals the focused field again once the keyboard shrinks the view, and not after it closes', () => {
  const scroll = makeScroll({ top: 0, height: 700 });
  const field = makeField({ top: 500, height: 80 });
  const { rerender } = render(<Screen scroll={scroll} fields={[{ field, isFocused: true }]} />);

  expect(scroll.scrollTo).not.toHaveBeenCalled();

  scroll.viewport.height = 400;
  relaidOut();

  expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 500 + 80 + 16 - 400 });

  scroll.scrollTo.mockClear();
  rerender(<Screen scroll={scroll} fields={[{ field, isFocused: false }]} />);
  scroll.viewport.height = 700;
  relaidOut();

  expect(scroll.scrollTo).not.toHaveBeenCalled();
});

const UPPER_TO_LOWER = {
  'the focus comes before the blur': [
    [true, true],
    [false, true],
  ],
  'the blur comes before the focus': [
    [false, false],
    [false, true],
  ],
};

it.each(Object.entries(UPPER_TO_LOWER))('follows the focus to the next field when %s', (_order, steps) => {
  const scroll = makeScroll({ top: 0, height: 400 });
  const upper = makeField({ top: 100, height: 80 });
  const lower = makeField({ top: 450, height: 80 });
  const layout = ([upperFocused, lowerFocused]: boolean[]) => (
    <Screen
      scroll={scroll}
      fields={[
        { field: upper, isFocused: upperFocused },
        { field: lower, isFocused: lowerFocused },
      ]}
    />
  );
  const { rerender } = render(layout([true, false]));

  steps.forEach((step) => rerender(layout(step)));
  scroll.scrollTo.mockClear();
  relaidOut();

  expect(scroll.scrollTo).toHaveBeenCalledWith({ y: 450 + 80 + 16 - 400 });
});
