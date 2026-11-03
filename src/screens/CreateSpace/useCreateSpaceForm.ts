import { useEffect, useRef } from 'react';
import * as yup from 'yup';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import type { CreateSpaceRequest } from '@api/dto';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { useGetCurrenciesQuery } from '@redux/state/currency/api';
import { selectProfileId } from '@redux/state/profile/selectors';
import { createSpaceAndSelect } from '@redux/state/space/thunks';
import { selectSpaceCreationAttempt } from '@redux/state/spaceCreation/selectors';
import type { SpaceCreationStatus } from '@redux/state/spaceCreation/slice';
import { isSameCreateSpaceRequest, restoreSpaceCreation } from '@redux/state/spaceCreation/thunks';
import type { ScreenNames } from '@shared/enums';
import { SpaceType } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import { useFormSubmitHandler } from '@hooks';

interface CreateSpaceFormData {
  type: SpaceType;
  name: string;
  currency: number;
  invites: string[];
}

const schema = yup.object().shape({
  type: yup.mixed<SpaceType>().oneOf(Object.values(SpaceType)).required(),
  name: yup.string().trim().required('Enter a space name'),
  currency: yup.number().typeError('Choose a currency').required('Choose a currency'),
  invites: yup.array().of(yup.string().required()).required(),
});

const toRequest = ({ name, currency, type, invites }: CreateSpaceFormData): CreateSpaceRequest => ({
  name: name.trim(),
  currency_id: Number(currency),
  type,
  invites: type === SpaceType.GROUP && invites.length > 0 ? invites : undefined,
});

const toFormData = ({ name, currency_id, type, invites }: CreateSpaceRequest): CreateSpaceFormData => ({
  name,
  currency: currency_id,
  type,
  invites: invites ?? [],
});

const PENDING_NOTICES: Partial<Record<SpaceCreationStatus, string>> = {
  unknown: "Your last space wasn't confirmed. Create it again: it won't be made twice.",
  expired: 'Your last space may already exist. Check your spaces before creating it again.',
};

type UseCreateSpaceFormProps = Pick<RootStackScreenProps<ScreenNames.CREATE_SPACE_SCREEN>, 'navigation'>;

const useCreateSpaceForm = ({ navigation }: UseCreateSpaceFormProps) => {
  const { currentData: currencies = [] } = useGetCurrenciesQuery();
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectProfileId);
  const attempt = useAppSelector(selectSpaceCreationAttempt);
  const isPrefilledRef = useRef(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting, isSubmitSuccessful, isDirty },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      type: SpaceType.GROUP,
      name: '',
      currency: undefined,
      invites: [] as string[],
    },
  });

  useEffect(() => {
    if (userId !== undefined) void dispatch(restoreSpaceCreation(userId));
  }, [dispatch, userId]);

  // An unanswered creation from an earlier visit or run comes back as it was sent, so sending it again reuses its key.
  const notice = attempt ? PENDING_NOTICES[attempt.status] : undefined;
  const unresolved = notice ? attempt : null;

  useEffect(() => {
    if (!unresolved || isPrefilledRef.current || isDirty) return;

    isPrefilledRef.current = true;
    reset(toFormData(unresolved.request));
  }, [unresolved, isDirty, reset]);

  const { onSubmit, isSubmitDisabled, submitError } = useFormSubmitHandler<CreateSpaceFormData>({
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
    onSubmit: (formData) => dispatch(createSpaceAndSelect(toRequest(formData))),
    onSuccess: () => navigation.goBack(),
  });

  const values = useWatch({ control }) as CreateSpaceFormData;
  const isUnresolvedShown = unresolved !== null && isSameCreateSpaceRequest(unresolved.request, toRequest(values));

  return {
    currencies: currencies.map((c) => ({ label: c.code, value: c.id })),
    control,
    watch,
    onSubmit,
    isSubmitDisabled,
    submitError,
    pendingNotice: isUnresolvedShown && !submitError ? notice : undefined,
  };
};

export default useCreateSpaceForm;
