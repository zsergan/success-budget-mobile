import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { renderWithTheme } from '@components/ThemeProvider/themeTestUtils';
import { colorThemes } from '@shared/theme';

import PasswordInput from '../PasswordInput/PasswordInput';
import Input from './Input';

describe('an outlined input', () => {
  it('shows its hint until an error takes its place', () => {
    const { rerender } = render(<Input variant="outlined" label="Password" hint="At least 8 characters." />);

    expect(screen.getByText('At least 8 characters.')).toBeTruthy();

    rerender(<Input variant="outlined" label="Password" hint="At least 8 characters." error="Too short." />);

    expect(screen.getByText('Too short.')).toBeTruthy();
    expect(screen.queryByText('At least 8 characters.')).toBeNull();
  });

  it('is named by its label', () => {
    render(<Input variant="outlined" label="Email" />);

    expect(screen.getByLabelText('Email')).toBeTruthy();
  });

  it('reads its hint, or the error in its place, as the field’s accessibility hint', () => {
    const { rerender } = render(<Input variant="outlined" label="Password" hint="At least 8 characters." />);

    expect(screen.getByLabelText('Password').props.accessibilityHint).toBe('At least 8 characters.');

    rerender(<Input variant="outlined" label="Password" hint="At least 8 characters." error="Too short." />);

    expect(screen.getByLabelText('Password').props.accessibilityHint).toBe('Too short.');
  });
});

it('names the password toggle by what it does next', () => {
  render(<PasswordInput variant="outlined" label="Password" />);

  fireEvent.press(screen.getByRole('button', { name: 'Show password' }));

  expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
});

it('keeps what was typed and its focus through a theme change', async () => {
  const Field = () => {
    const [value, setValue] = useState('');

    return <Input variant="outlined" label="Email" value={value} onChangeText={setValue} />;
  };
  const { setTheme } = await renderWithTheme(<Field />);

  fireEvent(screen.getByLabelText('Email'), 'focus');
  fireEvent.changeText(screen.getByLabelText('Email'), 'anna@mail.com');
  await setTheme('dark');

  const field = screen.getByLabelText('Email');
  const { colors } = colorThemes.dark;
  expect(field.props.value).toBe('anna@mail.com');
  expect(field.props.keyboardAppearance).toBe('dark');
  expect(StyleSheet.flatten(field.props.style).color).toBe(colors.text);
  // The focused box keeps its focus border, now in the dark theme's colour.
  expect(StyleSheet.flatten(field.parent?.parent?.props.style).borderColor).toBe(colors.text);
});
