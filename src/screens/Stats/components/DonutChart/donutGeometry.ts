import type { Money } from '@api/dto';

export const DONUT_SIZE = 150;
export const RADIUS = 58;
export const STROKE = 20;
export const SELECTED_STROKE = 26;
export const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// The gap after each segment along the ring; never more than half of the segment it trims.
const SEGMENT_GAP = 3;
// Taps a little off the ring still count; the hole and the space around stay outside.
const TOUCH_SLOP = 6;

export interface DonutSegment {
  key: string;
  // Where the segment starts and how far it reaches along the ring, from 12 o'clock clockwise.
  start: number;
  length: number;
  visibleLength: number;
}

// Arcs follow the amounts exactly: a tiny share stays tiny instead of being widened to be tappable.
export const toDonutSegments = (groups: { key: string; amount: Money }[]): DonutSegment[] => {
  const values = groups.map((group) => Math.max(Number(group.amount) || 0, 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return [];

  const drawn = values.filter((value) => value > 0).length;
  let start = 0;

  return groups.flatMap((group, index) => {
    if (values[index] <= 0) return [];

    const length = (CIRCUMFERENCE * values[index]) / total;
    const gap = drawn > 1 ? Math.min(SEGMENT_GAP, length / 2) : 0;
    const segment = { key: group.key, start, length, visibleLength: length - gap };
    start += length;

    return [segment];
  });
};

// The segment under a tap on the donut's own box, or null for the hole and the corners.
export const hitTestDonut = (x: number, y: number, segments: DonutSegment[]): string | null => {
  const dx = x - DONUT_SIZE / 2;
  const dy = y - DONUT_SIZE / 2;
  const distance = Math.hypot(dx, dy);
  const reach = SELECTED_STROKE / 2 + TOUCH_SLOP;
  if (distance < RADIUS - reach || distance > RADIUS + reach) return null;

  const angle = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI);
  const position = (angle / (2 * Math.PI)) * CIRCUMFERENCE;

  return (
    segments.find((segment) => position >= segment.start && position < segment.start + segment.length)?.key ?? null
  );
};
