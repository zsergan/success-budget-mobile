import { useState } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useBottomSheet } from '@gorhom/bottom-sheet';

import type { CreateLimitRequest } from '@api/dto';
import type { LimitModel } from '@api/models';
import { useAppDispatch } from '@redux/hooks';
import { addLimit, editLimit } from '@redux/state/limit/thunks';
import { amountSchema } from '@shared/utils';
import { useFormSubmitHandler } from '@hooks';
import type { LimitScope } from './types';

interface LimitFormData {
  scope: LimitScope;
  categoryIds: number[];
  name: string;
  amount: string;
}

const schema = yup.object().shape({
  scope: yup.mixed<LimitScope>().oneOf(['category', 'group', 'total']).required(),
  categoryIds: yup.array().of(yup.number().required()).required(),
  name: yup.string().default(''),
  amount: amountSchema,
});

const scopeForLimit = (limit: LimitModel): LimitScope =>
  limit.categories.length === 0 ? 'total' : limit.categories.length === 1 ? 'category' : 'group';

interface UseLimitEditorFormProps {
  limit?: LimitModel;
  initialScope?: LimitScope;
}

const useLimitEditorForm = ({ limit, initialScope = 'category' }: UseLimitEditorFormProps) => {
  const dispatch = useAppDispatch();
  const { close } = useBottomSheet();
  const [nameTouched, setNameTouched] = useState(false);

  const { control, handleSubmit, watch, setValue, reset, formState } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      scope: limit ? scopeForLimit(limit) : initialScope,
      categoryIds: limit ? limit.categories.map((category) => category.id) : [],
      name: limit?.name ?? '',
      amount: limit?.amount ?? '',
    },
  });

  const setScope = (scope: LimitScope) => {
    setValue('scope', scope);

    if (scope !== 'group') {
      setValue('categoryIds', scope === 'total' ? [] : watch('categoryIds').slice(0, 1));
    }
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
    }
  };

  const onNameChange = (value: string) => {
    setNameTouched(true);
    setValue('name', value);
  };

  const { onSubmit, isSubmitDisabled } = useFormSubmitHandler<LimitFormData>({
    handleSubmit,
    formState,
    onSubmit: (formData) => {
      const payload: CreateLimitRequest =
        formData.scope === 'total'
          ? { amount: formData.amount, category_ids: [] }
          : formData.scope === 'category'
            ? { amount: formData.amount, category_ids: formData.categoryIds }
            : { amount: formData.amount, category_ids: formData.categoryIds, name: formData.name };

      return limit
        ? dispatch(editLimit({ limitId: limit.id, limitData: payload })).unwrap()
        : dispatch(addLimit(payload)).unwrap();
    },
    onSuccess: () => close(),
    getInvalidMessage: (errors) => (errors.amount ? 'Enter an amount' : ''),
    reset,
  });

  return {
    control,
    watch,
    setScope,
    toggleCategory,
    onNameChange,
    onSubmit,
    isSubmitDisabled,
    closeBottomSheet: close,
  };
};

export default useLimitEditorForm;
