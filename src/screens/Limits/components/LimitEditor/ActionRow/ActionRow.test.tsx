import { fireEvent, render, screen } from '@testing-library/react-native';

import ActionRow from './ActionRow';

jest.mock('@components', () => ({ Icon: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const renderRow = (canSubmit: boolean) => {
  const onSubmit = jest.fn();
  render(<ActionRow canSubmit={canSubmit} saveLabel="Save changes" onSubmit={onSubmit} />);

  return onSubmit;
};

it('blocks saving while the form cannot be submitted', () => {
  const onSubmit = renderRow(false);

  fireEvent.press(screen.getByText('Save changes'));

  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText('Save changes')).toBeDisabled();
});

it('saves once the form can be submitted', () => {
  const onSubmit = renderRow(true);

  fireEvent.press(screen.getByText('Save changes'));

  expect(onSubmit).toHaveBeenCalled();
  expect(screen.getByText('Save changes')).toBeEnabled();
});
