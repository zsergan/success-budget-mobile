import { Children, isValidElement } from 'react';
import { Picker } from '@react-native-picker/picker';
import { fireEvent, render, screen } from '@testing-library/react-native';

import InputPicker from './InputPicker';

const ITEMS = [
  { label: 'USD · US dollar', value: 7 },
  { label: 'EUR · Euro', value: 9 },
];

const list = () => screen.UNSAFE_getByType(Picker);

const items = () => Children.toArray(list().props.children).filter(isValidElement<{ label: string; value: unknown }>);

const rows = () => items().map((item) => item.props.label);

const chosenRow = () => items().find((item) => item.props.value === list().props.selectedValue)?.props.label;

const open = () => fireEvent.press(screen.getByRole('button', { name: 'Currency' }));

describe('a picker with a placeholder', () => {
  it('starts its list on an empty row, not on the first item, while nothing is picked', () => {
    render(
      <InputPicker
        variant="outlined"
        label="Currency"
        placeholder="Pick a currency"
        items={ITEMS}
        selectedValue={undefined}
        onValueChange={jest.fn()}
      />,
    );

    open();

    expect(rows()).toEqual(['Pick a currency', 'USD · US dollar', 'EUR · Euro']);
    expect(chosenRow()).toBe('Pick a currency');
  });

  it('reports an item by its own index, and the empty row as no value', () => {
    const onValueChange = jest.fn();
    render(
      <InputPicker
        variant="outlined"
        label="Currency"
        placeholder="Pick a currency"
        items={ITEMS}
        selectedValue={7}
        onValueChange={onValueChange}
      />,
    );

    open();
    list().props.onValueChange(9, 2);
    list().props.onValueChange('', 0);

    expect(onValueChange.mock.calls).toEqual([
      [9, 1],
      [undefined, -1],
    ]);
  });

  it('keeps the list on the picked item', () => {
    render(
      <InputPicker
        variant="outlined"
        label="Currency"
        placeholder="Pick a currency"
        items={ITEMS}
        selectedValue={9}
        onValueChange={jest.fn()}
      />,
    );

    open();

    expect(chosenRow()).toBe('EUR · Euro');
  });
});

it('lists only the items when there is no placeholder', () => {
  const onValueChange = jest.fn();
  render(
    <InputPicker variant="outlined" label="Currency" items={ITEMS} selectedValue={7} onValueChange={onValueChange} />,
  );

  open();
  list().props.onValueChange(9, 1);

  expect(rows()).toEqual(['USD · US dollar', 'EUR · Euro']);
  expect(onValueChange).toHaveBeenCalledWith(9, 1);
});
