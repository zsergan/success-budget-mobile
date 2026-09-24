import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useBottomSheet } from '@gorhom/bottom-sheet';

import type { CreateTransactionRequest } from '@api/dto';
import { TransactionType } from '@shared/enums';
import { requireSpaceId } from '@redux/api/baseApi';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useCreateTransactionMutation } from '@redux/state/transaction/api';
import { positiveAmountSchema } from '@shared/utils';
import { useFormSubmitHandler } from '@hooks';

export interface TransactionFormData {
  amount: string;
  wallet_id: number;
  transaction_type: TransactionType;
  category_id: number;
  date: Date;
  notes?: string;
}

const schema = yup.object().shape({
  amount: positiveAmountSchema,
  wallet_id: yup.number().required(),
  transaction_type: yup.mixed<TransactionType>().oneOf([TransactionType.EXPENSE, TransactionType.INCOME]).required(),
  category_id: yup.number().required(),
  date: yup.date().required(),
  notes: yup.string().max(140),
});

interface UseTransactionFormProps {
  transactionType: TransactionType;
  initialWalletId: number;
}

const useTransactionForm = ({ transactionType, initialWalletId }: UseTransactionFormProps) => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [createTransaction] = useCreateTransactionMutation();
  const { close } = useBottomSheet();

  const {
    control,
    handleSubmit,
    watch,
    resetField,
    reset,
    formState: { isSubmitting, isSubmitSuccessful, isValid, errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      amount: '',
      wallet_id: initialWalletId,
      transaction_type: transactionType,
      category_id: undefined,
      date: new Date(),
      notes: '',
    },
  });

  const { onSubmit, isSubmitDisabled } = useFormSubmitHandler<TransactionFormData>({
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
    onSubmit: async (formData) => {
      const payload: CreateTransactionRequest = {
        amount: formData.amount,
        wallet_id: formData.wallet_id,
        category_id: formData.category_id,
        timestamp: formData.date.toISOString(),
        transaction_type: formData.transaction_type,
        description: formData.notes,
      };

      return createTransaction({ spaceId: requireSpaceId(spaceId), data: payload }).unwrap();
    },
    onSuccess: () => {
      close();
    },
    getInvalidMessage: (errors) =>
      [errors.amount && 'Enter an amount', errors.category_id && 'Select a category'].filter(Boolean).join('\n'),
    reset,
  });

  return {
    control,
    watch,
    resetField,
    onSubmit,
    isSubmitDisabled,
    isValid,
    errors,
    closeBottomSheet: close,
  };
};

export default useTransactionForm;
