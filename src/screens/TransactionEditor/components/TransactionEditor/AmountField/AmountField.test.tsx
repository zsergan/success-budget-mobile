import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import AmountField from './AmountField';

type FieldProps = Partial<Parameters<typeof AmountField>[0]>;

const field = (props: FieldProps) => (
  <AmountField
    value=""
    onChange={jest.fn()}
    autoFocus={false}
    typeColor="#c00"
    isIncome={false}
    currencyCode="USD"
    {...props}
  />
);

const slotWidth = () =>
  StyleSheet.flatten(screen.getByTestId('amount-sign-slot', { includeHiddenElements: true }).props.style).width;
const sign = () => screen.getByText(/^[+−]$/, { includeHiddenElements: true });
const signOpacity = () => StyleSheet.flatten(sign().props.style).opacity;

describe('AmountField', () => {
  it('keeps the sign slot one width from empty to the first character and back', () => {
    render(field({}));
    const width = slotWidth();
    expect(width).toBeGreaterThan(0);
    expect(signOpacity()).toBe(0);

    screen.rerender(field({ value: '5' }));
    expect(slotWidth()).toBe(width);
    expect(signOpacity()).toBe(1);

    screen.rerender(field({ value: '' }));
    expect(slotWidth()).toBe(width);
    expect(signOpacity()).toBe(0);
  });

  it('hides the sign for input that is only spaces', () => {
    render(field({ value: '  ' }));

    expect(signOpacity()).toBe(0);
  });

  it('switches the sign with the type without touching the value or the slot', () => {
    render(field({ value: '12.5' }));
    const width = slotWidth();
    expect(sign().children).toEqual(['−']);

    screen.rerender(field({ value: '12.5', isIncome: true }));

    expect(sign().children).toEqual(['+']);
    expect(slotWidth()).toBe(width);
    expect(screen.getByLabelText('Amount').props.value).toBe('12.5');
  });

  it.each(['1', '1234567', '1234567890'])('keeps the slot width at every font-size tier: %s', (value) => {
    render(field({}));
    const width = slotWidth();

    screen.rerender(field({ value }));

    expect(slotWidth()).toBe(width);
  });

  it('passes the typed text to onChange unchanged, with no sign in it', () => {
    const onChange = jest.fn();
    render(field({ onChange }));

    fireEvent.changeText(screen.getByLabelText('Amount'), ' 1,5 ');

    expect(onChange).toHaveBeenCalledWith(' 1,5 ');
  });

  it('keeps the sign out of the accessibility tree', () => {
    render(field({ value: '5' }));

    expect(screen.queryByText('−')).toBeNull();
    expect(screen.getByTestId('amount-sign-slot', { includeHiddenElements: true }).props).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    });
  });
});
