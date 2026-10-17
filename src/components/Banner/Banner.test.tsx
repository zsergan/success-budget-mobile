import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import Icon from '@components/Icon/Icon';
import { colorThemes } from '@shared/theme';
import Banner from './Banner';

const { colors } = colorThemes.light;

const iconNames = () => screen.UNSAFE_getAllByType(Icon).map((icon) => icon.props.name);

describe.each(['inline', 'card'] as const)('a %s banner', (variant) => {
  it('draws the action’s icon only when it is given one', () => {
    const props = { variant, tone: 'warn', text: 'Offline.', actionLabel: 'Open', onAction: jest.fn() } as const;
    const { rerender } = render(<Banner {...props} />);

    expect(iconNames()).toEqual(['alert']);

    rerender(<Banner {...props} actionIcon="refresh" />);

    expect(iconNames()).toEqual(['alert', 'refresh']);
  });

  it('keeps its action named while it is busy, and says it is busy and unavailable', () => {
    const props = {
      variant,
      tone: 'danger',
      text: 'Couldn’t load.',
      actionLabel: 'Retry',
      onAction: jest.fn(),
    } as const;
    const { rerender } = render(<Banner {...props} />);

    expect(screen.getByRole('button', { name: 'Retry' }).props.accessibilityState).toMatchObject({
      disabled: false,
      busy: false,
    });

    rerender(<Banner {...props} isBusy />);

    expect(screen.queryByText('Retry')).toBeNull();
    expect(screen.getByRole('button', { name: 'Retry' }).props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
  });

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
