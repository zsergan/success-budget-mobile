import * as yup from 'yup';
import type { FieldError } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useBottomSheet } from '@gorhom/bottom-sheet';

import type { CreateTransactionRequest } from '@api/dto';
import { TransactionType } from '@shared/enums';
import { useAppDispatch } from '@redux/hooks';
import { addTransaction } from '@redux/state/transaction/thunks';
import { addCurrentTime } from '@shared/utils';
import { useAlert } from '@hooks';

interface TransactionFormData {
  amount: string;
  wallet_id: number;
  transaction_type: TransactionType;
  category_id: number;
  date: Date;
  notes?: string;
}

type ValidationError = {
  [K in keyof TransactionFormData]?: FieldError;
};

const schema = yup.object().shape({
  amount: yup.string().required(),
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
  const { addAlert } = useAlert();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitSuccessful },
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

  const onSubmit = (formData: TransactionFormData) => {
    const payload: CreateTransactionRequest = {
      amount: formData.amount.replace(',', '.'),
      wallet_id: formData.wallet_id,
      category_id: formData.category_id,
      timestamp: addCurrentTime(formData.date),
      transaction_type: formData.transaction_type,
      description: formData.notes,
    };

    dispatch(addTransaction(payload)).then(() => close());
  };

  const onInvalid = (errors: ValidationError) => {
    const errorMessage = [errors.amount && 'Enter an amount', errors.category_id && 'Select a category']
      .filter(Boolean)
      .join('\n');

    addAlert(errorMessage);
  };

  return {
    control,
    watch,
    onSubmit: handleSubmit(onSubmit, onInvalid),
    isSubmitSuccessful,
    closeBottomSheet: close,
  };
};

export default useTransactionForm;
