import type { AssignmentBreakdownItem } from '@api/dto';
import { homeAssignmentRows, homeMoney, homeNet } from './homeFigures';

const item = (key: string, amount: string): AssignmentBreakdownItem => ({
  kind: key.startsWith('member:') ? 'member' : (key as AssignmentBreakdownItem['kind']),
  key,
  user_id: key.startsWith('member:') ? Number(key.slice(7)) : null,
  name: key.startsWith('member:') ? `Member ${key.slice(7)}` : null,
  status: key.startsWith('member:') ? 'member' : null,
  amount,
  percent: 0,
  opens_history: true,
});

describe('homeAssignmentRows', () => {
  it('keeps the whole space and nobody however small, and lets the smaller people go first', () => {
    const { rows, total, hidden } = homeAssignmentRows({
      total_amount: '3150.00',
      source_count: 7,
      primary_items: [
        item('member:1', '980.00'),
        item('space', '820.00'),
        item('member:2', '450.00'),
        item('member:3', '300.00'),
        item('member:4', '260.00'),
        item('unassigned', '150.00'),
      ],
      other: {
        kind: 'other',
        key: 'other',
        opens_history: false,
        amount: '190.00',
        percent: 6,
        children: [item('member:5', '190.00')],
      },
    });

    expect(rows.map(({ key }) => key)).toEqual(['member:1', 'space', 'member:2', 'member:3', 'unassigned']);
    expect(total).toBe(7);
    expect(hidden).toBe(2);
  });

  it('shows every group when there are few', () => {
    const { rows, hidden } = homeAssignmentRows({
      total_amount: '100.00',
      source_count: 2,
      primary_items: [item('space', '60.00'), item('member:1', '40.00')],
      other: null,
    });

    expect(rows.map(({ key }) => key)).toEqual(['space', 'member:1']);
    expect(hidden).toBe(0);
  });
});

describe('hidden amounts', () => {
  it('hide the figure but keep the currency and the sign of a net', () => {
    expect(homeMoney('1250.00', 'USD', false)).toBe('$1 250.00');
    expect(homeMoney('1250.00', 'USD', true)).toBe('$••••');
    expect(homeNet('-120.50', 'USD', false)).toBe('-$120.50');
    expect(homeNet('-120.50', 'USD', true)).toBe('-$••••');
    expect(homeNet('0.00', 'USD', true)).toBe('$••••');
  });
});
