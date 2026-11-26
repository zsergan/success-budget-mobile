import { fireEvent, render, screen } from '@testing-library/react-native';

import type { CategoryColor } from '@shared/categoryColors';
import { AppColor } from '@shared/enums';
import ColorPicker from './ColorPicker';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

const renderPicker = (value: CategoryColor = AppColor.AMBER, saved?: CategoryColor) => {
  const onChange = jest.fn();
  const onPreview = jest.fn();

  render(<ColorPicker value={value} saved={saved} icon="cafe" onChange={onChange} onPreview={onPreview} />);

  return { onChange, onPreview };
};

const hexField = () => screen.getByLabelText('Hex colour');
const apply = () => screen.getByRole('button', { name: 'Apply' });

describe('ColorPicker', () => {
  it('keeps the six presets and adds a Custom colour that opens inside the section', () => {
    renderPicker();

    ['Slate', 'Amber', 'Evergreen', 'Indigo', 'Clay', 'Plum', 'Custom colour'].forEach((name) =>
      expect(screen.getByRole('radio', { name })).toBeTruthy(),
    );
    expect(screen.getByRole('radio', { name: 'Amber' }).props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.queryByText('Custom colour')).toBeNull();

    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));

    expect(screen.getByText('Custom colour')).toBeTruthy();
    expect(screen.getByText('Not applied yet')).toBeTruthy();
    expect(screen.getByLabelText('Saturation and brightness')).toBeTruthy();
    expect(screen.getByLabelText('Hue')).toBeTruthy();
  });

  it('starts from the tone of the preset and previews it, the draft untouched', () => {
    const { onChange, onPreview } = renderPicker();

    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));

    expect(hexField().props.value).toBe('#B4720D');
    expect(onPreview).toHaveBeenLastCalledWith('#B4720D');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps a partly typed HEX to itself, and applies a complete one upper-case', () => {
    const { onChange, onPreview } = renderPicker();
    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));

    fireEvent.changeText(hexField(), '#0f8f');
    expect(hexField().props.value).toBe('#0F8F');
    expect(screen.getByText('Enter 6 hex digits, like #0F8F8A.')).toBeTruthy();
    expect(apply()).toBeDisabled();
    expect(onPreview).toHaveBeenLastCalledWith('#B4720D');

    fireEvent.changeText(hexField(), '0f8f8a');
    expect(screen.queryByText('Enter 6 hex digits, like #0F8F8A.')).toBeNull();
    expect(onPreview).toHaveBeenLastCalledWith('#0F8F8A');
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.press(apply());
    expect(onChange).toHaveBeenCalledWith('#0F8F8A');
    expect(onPreview).toHaveBeenLastCalledWith(null);
    expect(screen.queryByLabelText('Hex colour')).toBeNull();
  });

  it('refuses an alpha channel and anything that is not six hex digits', () => {
    renderPicker();
    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));

    fireEvent.changeText(hexField(), '#0F8F8A80');
    expect(hexField().props.value).toBe('#0F8F8A');

    fireEvent.changeText(hexField(), 'rgb(');
    expect(hexField().props.value).toBe('#B');
    expect(apply()).toBeDisabled();
  });

  it('drops what was picked on Cancel', () => {
    const { onChange, onPreview } = renderPicker();
    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));
    fireEvent.changeText(hexField(), '#0F8F8A');

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(onPreview).toHaveBeenLastCalledWith(null);
    expect(screen.queryByLabelText('Hex colour')).toBeNull();
  });

  it('reopens a saved custom colour where it is', () => {
    renderPicker('#C2416B', '#C2416B');

    expect(screen.getByRole('radio', { name: 'Custom colour' }).props.accessibilityState).toMatchObject({
      checked: true,
    });
    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));

    expect(screen.getByText('Saved: #C2416B')).toBeTruthy();
    expect(hexField().props.value).toBe('#C2416B');
  });

  it('says a draft’s custom colour is not yet the saved one', () => {
    renderPicker('#0F8F8A', AppColor.AMBER);
    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));

    expect(screen.getByText('Current: #0F8F8A')).toBeTruthy();
  });

  it('takes a preset at once and closes the custom colour', () => {
    const { onChange, onPreview } = renderPicker();
    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));

    fireEvent.press(screen.getByRole('radio', { name: 'Plum' }));

    expect(onChange).toHaveBeenCalledWith(AppColor.PLUM);
    expect(onPreview).toHaveBeenLastCalledWith(null);
    expect(screen.queryByLabelText('Hex colour')).toBeNull();
  });

  it('moves the hue from assistive technology', () => {
    const { onPreview } = renderPicker('#FF0000');
    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));

    fireEvent(screen.getByLabelText('Hue'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });

    expect(hexField().props.value).toBe('#FF2A00');
    expect(onPreview).toHaveBeenLastCalledWith('#FF2A00');
  });

  it('says when a very light colour is drawn darker for its icon', () => {
    renderPicker();
    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));

    fireEvent.changeText(hexField(), '#F4F1EA');

    expect(
      screen.getByText(
        'Very light colours are darkened for the icon so it stays visible. The saved value is still #F4F1EA.',
      ),
    ).toBeTruthy();
  });
});
