import { renderHook } from '@testing-library/react-native';

import useSingleSubmit from './useSingleSubmit';

it('joins a call made while the first is pending, and sends again once it has settled', async () => {
  let settle: () => void = () => {};
  const submit = jest.fn(() => new Promise<void>((resolve) => (settle = resolve)));
  const { result } = renderHook(() => useSingleSubmit(submit));

  const first = result.current('a');
  const second = result.current('b');

  expect(second).toBe(first);
  expect(submit).toHaveBeenCalledTimes(1);
  expect(submit).toHaveBeenCalledWith('a');

  settle();
  await first;
  result.current('c');

  expect(submit).toHaveBeenCalledTimes(2);
  expect(submit).toHaveBeenLastCalledWith('c');
});

it('lets the form be sent again after a failed attempt', async () => {
  const submit = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
  const { result } = renderHook(() => useSingleSubmit(submit));

  await expect(result.current('a')).rejects.toThrow('offline');
  await result.current('a');

  expect(submit).toHaveBeenCalledTimes(2);
});
