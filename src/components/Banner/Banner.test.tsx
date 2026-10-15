import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import Icon from '@components/Icon/Icon';
import { colors } from '@shared/theme';
import Banner from './Banner';

const iconNames = () => screen.UNSAFE_getAllByType(Icon).map((icon) => icon.props.name);

describe.each(['inline', 'card'] as const)('a %s banner', (variant) => {
  it('shows the icon it is given', () => {
    render(<Banner variant={variant} tone="warn" text="Offline." icon="offline" />);

    expect(iconNames()).toEqual(['offline']);
  });

  it('shows an alert for a problem, and a check for a success, when it is given no icon', () => {
    const { rerender } = render(<Banner variant={variant} tone="danger" text="Couldn’t save." />);

    expect(iconNames()).toEqual(['alert']);

    rerender(<Banner variant={variant} tone="success" text="Saved." />);

    expect(iconNames()).toEqual(['check']);
  });

  it('draws a success in the theme’s green', () => {
    render(<Banner variant={variant} tone="success" text="Saved." />);

    expect(screen.UNSAFE_getByType(Icon).props.color).toBe(variant === 'card' ? colors.okText : colors.ok);
  });
});

it('tints a success card with the theme’s green surface and border', () => {
  render(<Banner variant="card" tone="success" title="Email confirmed" text="You can sign in now." />);

  expect(StyleSheet.flatten(screen.UNSAFE_getByProps({ accessibilityRole: 'alert' }).props.style)).toMatchObject({
    backgroundColor: colors.okSoft,
    borderColor: colors.okBorder,
  });
  expect(StyleSheet.flatten(screen.getByText('Email confirmed').props.style).color).toBe(colors.okText);
});
