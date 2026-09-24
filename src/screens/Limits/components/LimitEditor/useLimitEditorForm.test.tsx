import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-native';

import type { LimitCategoryModel, LimitModel } from '@api/models';
import { createAppStore } from '@redux/Store';
import { AppColor } from '@shared/enums';
import useLimitEditorForm from './useLimitEditorForm';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn() }),
}));
jest.mock('expo-secure-store');
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@gorhom/bottom-sheet', () => ({ useBottomSheet: () => ({ close: jest.fn() }) }));

const category = (id: number): LimitCategoryModel => ({ id, name: `C${id}`, icon: 'grocery', color: AppColor.SLATE });

const GROUP: LimitModel = {
  id: 9,
  name: 'Fun',
  amount: '100',
  spent: 0,
  inPercent: 0,
  categories: [category(1), category(2)],
};

const renderForm = (activeCategoryIds: number[] | undefined) => {
  const store = createAppStore();
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  return renderHook((props: { activeCategoryIds?: number[] }) => useLimitEditorForm({ limit: GROUP, ...props }), {
    wrapper: Wrapper,
    initialProps: { activeCategoryIds },
  });
};

it('drops a selected category once it is no longer active', () => {
  const { result, rerender } = renderForm([1, 2, 3]);

  expect(result.current.watch('categoryIds')).toEqual([1, 2]);

  rerender({ activeCategoryIds: [1, 3] });

  expect(result.current.watch('categoryIds')).toEqual([1]);
});

it('keeps the selection while the categories are still loading', () => {
  const { result } = renderForm(undefined);

  expect(result.current.watch('categoryIds')).toEqual([1, 2]);
});
