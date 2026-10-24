import type { ReactElement } from 'react';
import { Children, isValidElement, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { BackHandler, Keyboard } from 'react-native';
import { act, fireEvent, render as renderBare, screen } from '@testing-library/react-native';

import { pressSheetBackdrop, resetSheets, swipeDownSheet, withSheetHost } from '@components/ConfirmationSheet/testing';
import InputPicker from './InputPicker';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

const render = (ui: ReactElement) => {
  const result = renderBare(withSheetHost(ui));
  return { ...result, rerender: (next: ReactElement) => result.rerender(withSheetHost(next)) };
};

let pressBack: () => void = () => {};
beforeEach(() => {
  resetSheets();
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    pressBack = () => handler({} as never);
    return { remove: () => {} };
  });
});
afterEach(() => jest.restoreAllMocks());

const ITEMS = [
  { label: 'USD · US dollar', value: 7 },
  { label: 'EUR · Euro', value: 9 },
];

const list = () => screen.UNSAFE_getByType(Picker);

const items = () => Children.toArray(list().props.children).filter(isValidElement<{ label: string; value: unknown }>);

const rows = () => items().map((item) => item.props.label);

const chosenRow = () => items().find((item) => item.props.value === list().props.selectedValue)?.props.label;

const open = () => fireEvent.press(screen.getByRole('button', { name: 'Currency' }));

const close = () => fireEvent.press(screen.getByRole('button', { name: 'Done' }));

// What the native wheel reports when it settles on a row.
const turnTo = (row: number) => act(() => list().props.onValueChange(items()[row].props.value, row));

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
    turnTo(2);
    turnTo(0);

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

describe.each(['outlined', 'filled'] as const)('a %s picker, to a screen reader', (variant) => {
  const field = () => screen.getByRole('button', { name: 'Currency' });

  it('reads the picked item as its value, and the placeholder until then', () => {
    const props = {
      variant,
      label: 'Currency',
      placeholder: 'Pick a currency',
      items: ITEMS,
      onValueChange: jest.fn(),
    };
    const { rerender } = render(<InputPicker {...props} selectedValue={undefined} />);

    expect(field().props.accessibilityValue).toEqual({ text: 'Pick a currency' });

    rerender(<InputPicker {...props} selectedValue={7} />);

    expect(field().props.accessibilityValue).toEqual({ text: 'USD · US dollar' });
  });

  it('is expanded while its list is shown', () => {
    render(
      <InputPicker variant={variant} label="Currency" items={ITEMS} selectedValue={7} onValueChange={jest.fn()} />,
    );

    expect(field().props.accessibilityState).toMatchObject({ expanded: false });

    fireEvent.press(field());

    expect(field().props.accessibilityState).toMatchObject({ expanded: true });

    close();

    expect(field().props.accessibilityState).toMatchObject({ expanded: false });
  });

  it('is announced as unavailable when it is disabled', () => {
    render(
      <InputPicker
        variant={variant}
        label="Currency"
        items={ITEMS}
        selectedValue={7}
        onValueChange={jest.fn()}
        disabled
      />,
    );

    expect(field().props.accessibilityState).toMatchObject({ disabled: true });
  });
});

it('announces an outlined picker whose items are loading as busy and unavailable', () => {
  render(
    <InputPicker
      variant="outlined"
      label="Currency"
      placeholder="Loading currencies…"
      items={[]}
      selectedValue={undefined}
      onValueChange={jest.fn()}
      isLoading
    />,
  );

  expect(screen.getByRole('button', { name: 'Currency' }).props.accessibilityState).toMatchObject({
    disabled: true,
    busy: true,
  });
});

describe('the picked item', () => {
  const STRING_ITEMS = [
    { label: 'US dollar', value: 'USD' },
    { label: 'Euro', value: 'EUR' },
  ];

  it('is found by a numeric id', () => {
    render(
      <InputPicker
        variant="outlined"
        label="Currency"
        placeholder="Pick"
        items={ITEMS}
        selectedValue={9}
        onValueChange={jest.fn()}
      />,
    );

    open();

    expect(chosenRow()).toBe('EUR · Euro');
    expect(screen.getByRole('button', { name: 'Currency' }).props.accessibilityValue).toEqual({ text: 'EUR · Euro' });
  });

  it('is found by a string value', () => {
    render(
      <InputPicker
        variant="outlined"
        label="Currency"
        placeholder="Pick"
        items={STRING_ITEMS}
        selectedValue="EUR"
        onValueChange={jest.fn()}
      />,
    );

    open();

    expect(chosenRow()).toBe('Euro');
    expect(screen.getByText('Euro')).toBeTruthy();
  });

  it('counts as picked even when its label is empty', () => {
    render(
      <InputPicker
        variant="outlined"
        label="Currency"
        placeholder="Pick"
        items={[{ label: '', value: 'NONE' }, ...STRING_ITEMS]}
        selectedValue="NONE"
        onValueChange={jest.fn()}
      />,
    );

    open();

    expect(list().props.selectedValue).toBe('NONE');
    expect(screen.queryByText('Pick')).toBeNull();
  });

  it('leaves the list on the empty row when the value matches no item', () => {
    render(
      <InputPicker
        variant="outlined"
        label="Currency"
        placeholder="Pick"
        items={ITEMS}
        selectedValue={42}
        onValueChange={jest.fn()}
      />,
    );

    open();

    expect(chosenRow()).toBe('Pick');
    expect(screen.getByRole('button', { name: 'Currency' }).props.accessibilityValue).toEqual({ text: 'Pick' });
  });

  it('opens again on the item turned to last time', () => {
    const Form = () => {
      const [value, setValue] = useState<number | string | undefined>();

      return (
        <InputPicker
          variant="outlined"
          label="Currency"
          placeholder="Pick"
          items={ITEMS}
          selectedValue={value}
          onValueChange={setValue}
        />
      );
    };
    render(<Form />);

    open();
    turnTo(1);
    close();
    open();

    expect(chosenRow()).toBe('USD · US dollar');
  });
});

describe('the list', () => {
  const renderPicker = () => {
    const onBlur = jest.fn();
    render(
      <InputPicker
        variant="outlined"
        label="Currency"
        placeholder="Pick a currency"
        items={ITEMS}
        selectedValue={undefined}
        onValueChange={jest.fn()}
        onBlur={onBlur}
      />,
    );

    return { onBlur };
  };

  it.each([
    ['Done', close],
    ['the backdrop', pressSheetBackdrop],
    ['a swipe', swipeDownSheet],
    ['Android Back', () => act(() => pressBack())],
  ])('closes on %s, reported once as a blur, and opens again', (_way, closeList) => {
    const { onBlur } = renderPicker();

    open();
    expect(screen.getByRole('header', { name: 'Currency' })).toBeTruthy();
    closeList();

    expect(screen.UNSAFE_queryByType(Picker)).toBeNull();
    expect(onBlur).toHaveBeenCalledTimes(1);

    open();

    expect(screen.UNSAFE_queryByType(Picker)).not.toBeNull();
  });

  it('opens once the keyboard has gone, not over it', () => {
    let hideKeyboard: () => void = () => {};
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
    jest.spyOn(Keyboard, 'addListener').mockImplementation((_event, listener) => {
      hideKeyboard = () => listener({} as never);
      return { remove: () => {} } as never;
    });
    renderPicker();

    open();

    expect(dismiss).toHaveBeenCalled();
    expect(screen.UNSAFE_queryByType(Picker)).toBeNull();

    act(() => hideKeyboard());

    expect(screen.UNSAFE_queryByType(Picker)).not.toBeNull();
  });
});
