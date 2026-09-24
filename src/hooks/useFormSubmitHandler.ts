import type { FieldErrors, FieldValues, UseFormHandleSubmit } from 'react-hook-form';

import { useSessionGuard } from '@redux/hooks';
import { getErrorMessage } from '@shared/utils';
import useAlert from './useAlert';

interface UseFormSubmitHandlerOptions<TFormData extends FieldValues> {
  handleSubmit: UseFormHandleSubmit<TFormData>;
  formState: { isSubmitting: boolean; isSubmitSuccessful: boolean };
  onSubmit: (formData: TFormData) => Promise<unknown>;
  onSuccess: () => void;
  getInvalidMessage: (errors: FieldErrors<TFormData>) => string;
  /**
   * react-hook-form's own reset(), called right after a successful submit.
   * isSubmitSuccessful otherwise never clears on its own, so a form whose
   * instance survives the submit (e.g. a bottom sheet that stays mounted
   * and is just re-presented) has its submit button silently stuck disabled
   * on every later open. Screens that unmount on success (e.g. via
   * navigation.goBack()) don't need this, but passing it is harmless.
   */
  reset?: () => void;
}

const useFormSubmitHandler = <TFormData extends FieldValues>({
  handleSubmit,
  formState,
  onSubmit,
  onSuccess,
  getInvalidMessage,
  reset,
}: UseFormSubmitHandlerOptions<TFormData>) => {
  const { addAlert } = useAlert();
  const captureSession = useSessionGuard();

  const submit = async (formData: TFormData) => {
    const isSessionCurrent = captureSession();

    try {
      await onSubmit(formData);

      // Thrown so a result the ended session never saw doesn't mark the form as submitted.
      if (!isSessionCurrent()) throw new Error('The session this form was submitted in has ended.');

      reset?.();
      onSuccess();
    } catch (error) {
      // Includes the abort logout causes, which is not an isStale response.
      if (isSessionCurrent()) addAlert(getErrorMessage(error));

      throw error;
    }
  };

  const onInvalid = (errors: FieldErrors<TFormData>) => {
    addAlert(getInvalidMessage(errors));
  };

  const submitForm = handleSubmit(submit, onInvalid);

  return {
    // submit() rethrows after alerting so isSubmitSuccessful stays accurate; swallow it here.
    onSubmit: () => submitForm().catch(() => undefined),
    isSubmitDisabled: formState.isSubmitting || formState.isSubmitSuccessful,
  };
};

export default useFormSubmitHandler;
