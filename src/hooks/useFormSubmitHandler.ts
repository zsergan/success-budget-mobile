import type { FieldErrors, FieldValues, UseFormHandleSubmit } from 'react-hook-form';

import { useSessionGuard } from '@redux/hooks';
import { getErrorMessage } from '@shared/utils';
import useAlert from './useAlert';

interface UseFormSubmitHandlerOptions<TFormData extends FieldValues, TResult> {
  handleSubmit: UseFormHandleSubmit<TFormData>;
  formState: { isSubmitting: boolean; isSubmitSuccessful: boolean };
  onSubmit: (formData: TFormData) => Promise<TResult>;
  onSuccess: (result: TResult) => void;
  getInvalidMessage?: (errors: FieldErrors<TFormData>) => string;
  // isSubmitSuccessful never clears on its own; a form that stays mounted after submit needs this.
  reset?: () => void;
}

const useFormSubmitHandler = <TFormData extends FieldValues, TResult = unknown>({
  handleSubmit,
  formState,
  onSubmit,
  onSuccess,
  getInvalidMessage,
  reset,
}: UseFormSubmitHandlerOptions<TFormData, TResult>) => {
  const { addAlert } = useAlert();
  const captureSession = useSessionGuard();

  const submit = async (formData: TFormData) => {
    const isSessionCurrent = captureSession();

    try {
      const result = await onSubmit(formData);

      // Thrown so a result the ended session never saw doesn't mark the form as submitted.
      if (!isSessionCurrent()) throw new Error('The session this form was submitted in has ended.');

      reset?.();
      onSuccess(result);
    } catch (error) {
      // Includes the abort logout causes, which is not an isStale response.
      if (isSessionCurrent()) addAlert(getErrorMessage(error));

      throw error;
    }
  };

  const onInvalid = getInvalidMessage && ((errors: FieldErrors<TFormData>) => addAlert(getInvalidMessage(errors)));

  const submitForm = handleSubmit(submit, onInvalid);

  return {
    // submit() rethrows after alerting so isSubmitSuccessful stays accurate; swallow it here.
    onSubmit: () => submitForm().catch(() => undefined),
    isSubmitDisabled: formState.isSubmitting || formState.isSubmitSuccessful,
  };
};

export default useFormSubmitHandler;
