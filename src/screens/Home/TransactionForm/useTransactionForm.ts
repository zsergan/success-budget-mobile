import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useBottomSheet } from '@gorhom/bottom-sheet';

import type { CreateTransactionRequest } from '@api/dto';
import { TransactionType } from '@shared/enums';
import { useAppDispatch } from '@redux/hooks';
import { addTransaction } from '@redux/state/transaction/thunks';
import { addCurrentTime, amountSchema } from '@shared/utils';
import { useFormSubmitHandler } from '@hooks';

interface TransactionFormData {
  amount: string;
  wallet_id: number;
  transaction_type: TransactionType;
  category_id: number;
  date: Date;
  notes?: string;
}

const schema = yup.object().shape({
  amount: amountSchema,
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
  const dispatch = useAppDispatch();
  const { close } = useBottomSheet();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(schema),
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
    onSubmit: (formData) => {
      const payload: CreateTransactionRequest = {
        amount: formData.amount,
        wallet_id: formData.wallet_id,
        category_id: formData.category_id,
        timestamp: addCurrentTime(formData.date),
        transaction_type: formData.transaction_type,
        description: formData.notes,
      };

      return dispatch(addTransaction(payload)).unwrap();
    },
    onSuccess: () => close(),
    getInvalidMessage: (errors) =>
      [errors.amount && 'Enter an amount', errors.category_id && 'Select a category'].filter(Boolean).join('\n'),
  });

  return {
    control,
    watch,
    onSubmit,
    isSubmitDisabled,
    closeBottomSheet: close,
  };
};

export default useTransactionForm;
