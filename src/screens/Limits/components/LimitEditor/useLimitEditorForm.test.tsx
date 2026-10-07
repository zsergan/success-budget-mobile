import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import type { LimitCategoryModel, LimitModel } from '@api/models';
import { createAppStore } from '@redux/Store';
import { spaceSelected } from '@redux/state/space/thunks';
import { AppColor } from '@shared/enums';
import useLimitEditorForm from './useLimitEditorForm';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn() }),
}));
jest.mock('expo-secure-store');
jest.mock('@gorhom/bottom-sheet', () => ({ useBottomSheet: () => ({ close: jest.fn() }) }));

const mockCreateLimit = jest.fn();
const mockUpdateLimit = jest.fn();
jest.mock('@redux/state/limit/api', () => ({
  ...jest.requireActual('@redux/state/limit/api'),
  useCreateLimitMutation: () => [mockCreateLimit],
  useUpdateLimitMutation: () => [mockUpdateLimit],
}));

beforeEach(() => jest.clearAllMocks());

const category = (id: number): LimitCategoryModel => ({ id, name: `C${id}`, icon: 'grocery', color: AppColor.SLATE });

const GROUP: LimitModel = {
  id: 9,
  name: 'Fun',
  amount: '100',
  spent: 0,
  inPercent: 0,
  categories: [category(1), category(2)],
};

const SINGLE: LimitModel = { ...GROUP, id: 8, name: null, categories: [category(1)] };

const TOTAL: LimitModel = { ...GROUP, id: 7, name: null, categories: [] };

const NAMES = { 1: 'C1', 2: 'C2', 3: 'C3' };

// null opens the editor for a new limit.
const renderForm = async (activeCategoryIds: number[] | undefined, limit: LimitModel | null = GROUP) => {
  const store = createAppStore();
  store.dispatch(spaceSelected(1));
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  const rendered = renderHook(
    (props: { activeCategoryIds?: number[] }) => useLimitEditorForm({ limit: limit ?? undefined, ...props }),
    {
      wrapper: Wrapper,
      initialProps: { activeCategoryIds },
    },
  );
  // Validation resolves asynchronously; let it settle inside act.
  await act(async () => {});

  return rendered;
};

it('drops a selected category once it is no longer active', async () => {
  const { result, rerender } = await renderForm([1, 2, 3]);

  expect(result.current.watch('categoryIds')).toEqual([1, 2]);

  await act(async () => rerender({ activeCategoryIds: [1, 3] }));

  expect(result.current.watch('categoryIds')).toEqual([1]);
});

it('keeps the selection while the categories are still loading', async () => {
  const { result } = await renderForm(undefined);

  expect(result.current.watch('categoryIds')).toEqual([1, 2]);
});

it('sends the values the schema normalized', async () => {
  mockUpdateLimit.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  const { result } = await renderForm([1, 2], { ...GROUP, name: '  Weekend  ', amount: '12,5' });

  await act(() => result.current.onSubmit());

  expect(mockUpdateLimit).toHaveBeenCalledWith({
    spaceId: 1,
    limitId: 9,
    data: { amount: '12.5', category_ids: [1, 2], name: 'Weekend' },
  });
});

it('blocks a direct submit of an invalid form', async () => {
  const { result } = await renderForm([1, 2, 3], null);

  await act(() => result.current.onSubmit());

  expect(mockCreateLimit).not.toHaveBeenCalled();
  expect(result.current.errors.amount?.message).toBe('Enter an amount');
  expect(result.current.errors.categoryIds?.message).toBe('Pick a category');
});

it('turns a group into the monthly total without its categories or name', async () => {
  mockUpdateLimit.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  const { result } = await renderForm([1, 2, 3], { ...GROUP, amount: '1500,50' });

  await act(async () => result.current.setScope('total'));
  await act(() => result.current.onSubmit());

  expect(mockUpdateLimit).toHaveBeenCalledWith({
    spaceId: 1,
    limitId: 9,
    data: { amount: '1500.50', category_ids: [] },
  });
});

describe('canSubmit', () => {
  it.each([
    ['group', GROUP],
    ['single', SINGLE],
    ['total', TOTAL],
  ])('holds for an unchanged saved %s limit', async (_, limit) => {
    const { result } = await renderForm([1, 2, 3], limit);

    expect(result.current.canSubmit).toBe(true);
  });

  it('stays off for a new limit until it is filled in', async () => {
    const { result } = await renderForm([1, 2, 3], null);
    expect(result.current.canSubmit).toBe(false);

    await act(async () => result.current.toggleCategory(1, NAMES));
    expect(result.current.canSubmit).toBe(false);
  });

  it('follows a switch to and from the monthly total', async () => {
    const { result } = await renderForm([1, 2, 3], SINGLE);

    await act(async () => result.current.setScope('total'));
    expect(result.current.watch('categoryIds')).toEqual([]);
    expect(result.current.canSubmit).toBe(true);

    await act(async () => result.current.setScope('category'));
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.errors.categoryIds?.message).toBe('Pick a category');
  });

  it('follows a type switch', async () => {
    const { result } = await renderForm([1, 2, 3]);

    await act(async () => result.current.setScope('category'));
    expect(result.current.watch('categoryIds')).toEqual([1]);
    expect(result.current.canSubmit).toBe(true);

    await act(async () => result.current.setScope('group'));
    expect(result.current.canSubmit).toBe(false);
  });

  it('follows a category pick together with the auto-filled name', async () => {
    const { result } = await renderForm([1, 2, 3], SINGLE);

    await act(async () => result.current.setScope('group'));
    expect(result.current.canSubmit).toBe(false);

    await act(async () => result.current.toggleCategory(2, NAMES));
    expect(result.current.watch('name')).toBe('C1, C2');
    expect(result.current.canSubmit).toBe(true);
  });

  it('follows an archived category leaving the selection', async () => {
    const { result, rerender } = await renderForm([1, 2, 3]);
    expect(result.current.canSubmit).toBe(true);

    await act(async () => rerender({ activeCategoryIds: [1, 3] }));
    expect(result.current.canSubmit).toBe(false);
  });
});

describe('group name', () => {
  it('flags an auto-filled name over 60 characters', async () => {
    const { result } = await renderForm([1, 2, 3], SINGLE);
    const longNames = { 1: 'a'.repeat(30), 2: 'b'.repeat(30) };

    await act(async () => result.current.setScope('group'));
    await act(async () => result.current.toggleCategory(2, longNames));

    expect(result.current.control.getFieldState('name').error?.message).toBe('Keep the name to 60 characters');
    expect(result.current.canSubmit).toBe(false);
  });

  it('stops following the categories once edited by hand', async () => {
    const { result } = await renderForm([1, 2, 3], SINGLE);

    await act(async () => result.current.setScope('group'));
    await act(async () => result.current.onNameChange('Mine'));
    await act(async () => result.current.toggleCategory(2, NAMES));

    expect(result.current.watch('name')).toBe('Mine');
  });
});
