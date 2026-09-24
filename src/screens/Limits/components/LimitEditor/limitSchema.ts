import * as yup from 'yup';

import type { CreateLimitRequest } from '@api/dto';
import { positiveAmountSchema } from '@shared/utils';
import type { LimitScope } from './types';

export const MAX_LIMIT_AMOUNT = '99999999.99';
export const MAX_LIMIT_NAME_LENGTH = 60;

const MONEY_FORMAT = /^\d+(\.\d{1,2})?$/;

const amount = positiveAmountSchema
  .matches(MONEY_FORMAT, 'Enter an amount with at most two decimal places')
  .test(
    'is-within-max',
    `Enter an amount up to ${MAX_LIMIT_AMOUNT}`,
    (value) => Number(value) <= Number(MAX_LIMIT_AMOUNT),
  );

const categoryIds = yup
  .array(yup.number().required())
  .required()
  .transform((ids: unknown) => (Array.isArray(ids) ? Array.from(new Set(ids)) : ids))
  .when('scope', ([scope]: LimitScope[], schema) => {
    if (scope === 'total') return schema.length(0, 'A monthly total has no categories');
    if (scope === 'category') return schema.length(1, 'Pick a category');

    return schema.min(2, 'Pick at least two categories');
  });

const name = yup
  .string()
  .default('')
  .when('scope', ([scope]: LimitScope[], schema) =>
    scope === 'group'
      ? schema
          .trim()
          .required('Enter a limit name')
          // Code points, not UTF-16 units: the backend's MaxLength counts an emoji once.
          .test(
            'is-within-max',
            `Keep the name to ${MAX_LIMIT_NAME_LENGTH} characters`,
            (value) => Array.from(value ?? '').length <= MAX_LIMIT_NAME_LENGTH,
          )
      : schema,
  );

export const limitSchema = yup.object({
  scope: yup.mixed<LimitScope>().oneOf(['category', 'group', 'total']).required(),
  categoryIds,
  name,
  amount,
});

export type LimitFormValues = yup.InferType<typeof limitSchema>;

// Expects values the schema has already validated and normalized.
export const toLimitRequest = ({ scope, amount, categoryIds, name }: LimitFormValues): CreateLimitRequest =>
  scope === 'group' ? { amount, category_ids: categoryIds, name } : { amount, category_ids: categoryIds };
