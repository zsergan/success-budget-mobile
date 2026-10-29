import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useBottomSheet } from '@gorhom/bottom-sheet';

import type { LimitModel } from '@api/models';
import { requireSpaceId } from '@redux/api/baseApi';
import { useAppSelector } from '@redux/hooks';
import { useCreateLimitMutation, useUpdateLimitMutation } from '@redux/state/limit/api';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useFormSubmitHandler } from '@hooks';
import type { LimitScope } from './types';
import { limitSchema, toLimitRequest, type LimitFormValues } from './limitSchema';

const scopeForLimit = (limit: LimitModel): LimitScope =>
  limit.categories.length === 0 ? 'total' : limit.categories.length === 1 ? 'category' : 'group';

interface UseLimitEditorFormProps {
  limit?: LimitModel;
  initialScope?: LimitScope;
  // Undefined until the categories have loaded.
  activeCategoryIds?: number[];
}

const useLimitEditorForm = ({ limit, initialScope = 'category', activeCategoryIds }: UseLimitEditorFormProps) => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [createLimit] = useCreateLimitMutation();
  const [updateLimit] = useUpdateLimitMutation();
  const { close } = useBottomSheet();
  const [nameTouched, setNameTouched] = useState(false);

  const { control, handleSubmit, watch, getValues, setValue, trigger, reset, formState } = useForm({
    mode: 'onChange',
    resolver: yupResolver(limitSchema),
    defaultValues: {
      scope: limit ? scopeForLimit(limit) : initialScope,
      categoryIds: limit ? limit.categories.map((category) => category.id) : [],
      name: limit?.name ?? '',
      amount: limit?.amount ?? '',
    },
  });

  // A category archived since the editor opened can no longer be sent; the picker only shows active ones.
  useEffect(() => {
    if (!activeCategoryIds) return;

    const selected = getValues('categoryIds');
    const stillActive = selected.filter((id) => activeCategoryIds.includes(id));

    if (stillActive.length !== selected.length) setValue('categoryIds', stillActive, { shouldValidate: true });
  }, [activeCategoryIds, getValues, setValue]);

  const setScope = (scope: LimitScope) => {
    setValue('scope', scope);

    if (scope !== 'group') {
      setValue('categoryIds', scope === 'total' ? [] : watch('categoryIds').slice(0, 1));
    }

    trigger(['scope', 'categoryIds']);
  };

  const toggleCategory = (categoryId: number, allCategoryNames: Record<number, string>) => {
    const scope = watch('scope');
    const current = watch('categoryIds');

    const next =
      scope === 'category'
        ? current.includes(categoryId)
          ? []
          : [categoryId]
        : current.includes(categoryId)
          ? current.filter((id) => id !== categoryId)
          : [...current, categoryId];

    setValue('categoryIds', next);

    if (scope === 'group' && !nameTouched) {
      setValue('name', next.map((id) => allCategoryNames[id]).join(', '));
      trigger(['categoryIds', 'name']);
    } else {
      trigger('categoryIds');
    }
  };

  const onNameChange = (value: string) => {
    setNameTouched(true);
    setValue('name', value, { shouldValidate: true });
  };

  const { onSubmit, isSubmitDisabled, submitError } = useFormSubmitHandler<LimitFormValues>({
    handleSubmit,
    formState,
    onSubmit: async (formData) => {
      const payload = toLimitRequest(formData);

      return limit
        ? updateLimit({ spaceId: requireSpaceId(spaceId), limitId: limit.id, data: payload }).unwrap()
        : createLimit({ spaceId: requireSpaceId(spaceId), data: payload }).unwrap();
    },
    onSuccess: () => close(),
    reset,
  });

  return {
    control,
    watch,
    setScope,
    toggleCategory,
    onNameChange,
    onSubmit,
    canSubmit: formState.isValid && !formState.isValidating && !isSubmitDisabled,
    errors: formState.errors,
    submitError,
    closeBottomSheet: close,
  };
};

export default useLimitEditorForm;
