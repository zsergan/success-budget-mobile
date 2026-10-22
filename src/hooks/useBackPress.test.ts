import { BackHandler } from 'react-native';
import { renderHook } from '@testing-library/react-native';

import useBackPress from './useBackPress';

let pressBack: () => boolean | null | undefined = () => false;

const remove = jest.fn();

beforeEach(() => {
  remove.mockClear();
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    pressBack = () => handler({} as never);
    return { remove };
  });
});

afterEach(() => jest.restoreAllMocks());

const renderBack = (isEnabled: boolean, onBack: () => void) =>
  renderHook(({ enabled, handler }: { enabled: boolean; handler: () => void }) => useBackPress(enabled, handler), {
    initialProps: { enabled: isEnabled, handler: onBack },
  });

it('gives Back to the handler enabled last, also after the one beneath it changes', () => {
  const lower = jest.fn();
  const upper = jest.fn();
  const below = renderBack(true, lower);
  renderBack(true, upper);

  const changedLower = jest.fn();
  below.rerender({ enabled: true, handler: changedLower });

  expect(pressBack()).toBe(true);
  expect(upper).toHaveBeenCalledTimes(1);
  expect(lower).not.toHaveBeenCalled();
  expect(changedLower).not.toHaveBeenCalled();
});

it('returns Back to the handler beneath once the upper one is disabled', () => {
  const lower = jest.fn();
  renderBack(true, lower);
  const above = renderBack(true, jest.fn());

  above.rerender({ enabled: false, handler: jest.fn() });
  pressBack();

  expect(lower).toHaveBeenCalledTimes(1);
});

it('lets Back through, and stops listening, once no handler is enabled', () => {
  const only = renderBack(true, jest.fn());
  expect(BackHandler.addEventListener).toHaveBeenCalledTimes(1);

  only.unmount();

  expect(remove).toHaveBeenCalledTimes(1);
  expect(pressBack()).toBe(false);
});
