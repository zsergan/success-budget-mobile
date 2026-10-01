import { CIRCUMFERENCE, DONUT_SIZE, RADIUS, hitTestDonut, toDonutSegments } from './donutGeometry';

const at = (degrees: number, radius = RADIUS) => {
  const radians = (degrees * Math.PI) / 180;

  return [DONUT_SIZE / 2 + radius * Math.sin(radians), DONUT_SIZE / 2 - radius * Math.cos(radians)] as const;
};

describe('toDonutSegments', () => {
  it('gives each group exactly its share of the ring, in the order the server sent', () => {
    const segments = toDonutSegments([
      { key: 'a', amount: '750.00' },
      { key: 'b', amount: '250.00' },
    ]);

    expect(segments.map((segment) => segment.key)).toEqual(['a', 'b']);
    expect(segments[0].length).toBeCloseTo(CIRCUMFERENCE * 0.75);
    expect(segments[1].start).toBeCloseTo(CIRCUMFERENCE * 0.75);
  });

  it('never lets the gap swallow a tiny share, nor widens it', () => {
    const [, tiny] = toDonutSegments([
      { key: 'big', amount: '9999.00' },
      { key: 'tiny', amount: '1.00' },
    ]);

    expect(tiny.length).toBeCloseTo(CIRCUMFERENCE / 10000);
    expect(tiny.visibleLength).toBeCloseTo(tiny.length / 2);
    expect(tiny.visibleLength).toBeGreaterThan(0);
  });

  it('draws a single group as a whole ring and skips zero amounts', () => {
    const segments = toDonutSegments([
      { key: 'only', amount: '12.00' },
      { key: 'zero', amount: '0.00' },
    ]);

    expect(segments).toHaveLength(1);
    expect(segments[0].visibleLength).toBeCloseTo(CIRCUMFERENCE);
  });
});

describe('hitTestDonut', () => {
  const segments = toDonutSegments([
    { key: 'a', amount: '50.00' },
    { key: 'b', amount: '25.00' },
    { key: 'c', amount: '25.00' },
  ]);

  it('finds the segment under a tap, clockwise from 12 o’clock', () => {
    expect(hitTestDonut(...at(45), segments)).toBe('a');
    expect(hitTestDonut(...at(200), segments)).toBe('b');
    expect(hitTestDonut(...at(300), segments)).toBe('c');
  });

  it('ignores the hole and the corners', () => {
    expect(hitTestDonut(DONUT_SIZE / 2, DONUT_SIZE / 2, segments)).toBeNull();
    expect(hitTestDonut(0, 0, segments)).toBeNull();
  });
});
