import { useEffect, useRef, useState } from 'react';
import type { FieldValues, UseFormHandleSubmit } from 'react-hook-form';

import { useSheetPresentation } from '@components/Modals/BottomSheetModal/sheetPresentation';
import { useSessionGuard } from '@redux/hooks';
import { getErrorMessage } from '@shared/utils';
import useToast from './useToast';

interface UseFormSubmitHandlerOptions<TFormData extends FieldValues, TResult> {
  handleSubmit: UseFormHandleSubmit<TFormData>;
  formState: { isSubmitting: boolean; isSubmitSuccessful: boolean };
  onSubmit: (formData: TFormData) => Promise<TResult>;
  onSuccess: (result: TResult) => void;
  // isSubmitSuccessful never clears on its own; a form that stays mounted after submit needs this.
  reset?: () => void;
}

let lastSubmission = 0;

// Submits a valid form once at a time. Invalid fields show their own errors; a failed request is `submitError`, for
// the form to show in place, or, once the form is closing or gone (its sheet closed meanwhile), a toast on the screen
// it was sent from, once the sheets have closed and while that screen is still the one on screen.
const useFormSubmitHandler = <TFormData extends FieldValues, TResult = unknown>({
  handleSubmit,
  formState,
  onSubmit,
  onSuccess,
  reset,
}: UseFormSubmitHandlerOptions<TFormData, TResult>) => {
  const captureSession = useSessionGuard();
  const toast = useToast();
  const presentation = useSheetPresentation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // The form the user sent from is still the one on screen, and not on its way out.
  const isOnScreen = (shownIn?: number) => {
    const now = presentation?.current();
    return isMountedRef.current && (!now || (now.id === shownIn && !now.isClosing));
  };

  const submit = async (formData: TFormData) => {
    const isSessionCurrent = captureSession();
    const ticket = toast.begin();
    const shownIn = presentation?.current().id;
    setSubmitError(null);

    try {
      const result = await onSubmit(formData);

      // Thrown so a result the ended session never saw doesn't mark the form as submitted.
      if (!isSessionCurrent()) throw new Error('The session this form was submitted in has ended.');

      reset?.();
      onSuccess(result);
    } catch (error) {
      // Includes the abort logout causes, which is not an isStale response.
      if (isSessionCurrent()) {
        const message = getErrorMessage(error);

        if (isOnScreen(shownIn)) {
          setSubmitError(message);
        } else {
          lastSubmission += 1;
          const subject = `form-submit:${lastSubmission}`;
          ticket.showAfterSheetsClose({ tone: 'error', text: message, subject });

          // A close the sheet reverses brings the form back, so the error returns to it.
          if (presentation && isMountedRef.current && presentation.current().id === shownIn) {
            const stopWatching = presentation.subscribe(() => {
              const now = presentation.current();
              if (now.isClosing) return;

              stopWatching();
              if (now.id !== shownIn) return;
              ticket.resolve(subject);
              if (isMountedRef.current) setSubmitError(message);
            });
          }
        }
      }

      throw error;
    }
  };

  return {
    // submit() rethrows after reporting so isSubmitSuccessful stays accurate; swallow it here.
    onSubmit: () => handleSubmit(submit)().catch(() => undefined),
    isSubmitDisabled: formState.isSubmitting || formState.isSubmitSuccessful,
    submitError,
  };
};

export default useFormSubmitHandler;
