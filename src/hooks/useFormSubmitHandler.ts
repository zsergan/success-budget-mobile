import type { FieldErrors, FieldValues, UseFormHandleSubmit } from 'react-hook-form';

import { getErrorMessage } from '@shared/utils';
import useAlert from './useAlert';

interface UseFormSubmitHandlerOptions<TFormData extends FieldValues> {
  handleSubmit: UseFormHandleSubmit<TFormData>;
  onSubmit: (formData: TFormData) => Promise<unknown>;
  onSuccess: () => void;
  getInvalidMessage: (errors: FieldErrors<TFormData>) => string;
}

// Shared by every create/edit form: waits for the thunk to really succeed or
// fail (dispatch().unwrap() promises always resolve otherwise, even on a
// rejected action) before calling onSuccess, alerts on either a server error
// or a validation error, and keeps react-hook-form isSubmitSuccessful
// accurate by rethrowing after alerting -- caught here so that rethrow never
// surfaces as an unhandled promise rejection at the call site.
const useFormSubmitHandler = <TFormData extends FieldValues>({
  handleSubmit,
  onSubmit,
  onSuccess,
  getInvalidMessage,
}: UseFormSubmitHandlerOptions<TFormData>) => {
  const { addAlert } = useAlert();

  const submit = async (formData: TFormData) => {
    try {
      await onSubmit(formData);
      onSuccess();
    } catch (error) {
      addAlert(getErrorMessage(error));
      throw error;
    }
  };

  const onInvalid = (errors: FieldErrors<TFormData>) => {
    addAlert(getInvalidMessage(errors));
  };

  const submitForm = handleSubmit(submit, onInvalid);

  return {
    onSubmit: () => submitForm().catch(() => undefined),
  };
};

export default useFormSubmitHandler;
