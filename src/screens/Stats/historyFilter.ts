import type { StatisticsBreakdown } from '@api/dto';
import type { AssignmentKey } from '@api/models';
import { toMobileIcon } from '@api/models';
import { TransactionKind } from '@shared/enums';
import type { HistoryFilter } from '@shared/types';

import { assignmentItemLabel } from '@shared/utils';
import type { BreakdownGroup } from './statsItems';

// Every category and every assignment group opens its transactions, Other's children too; the bounds pass through
// untouched so the list's sum matches the row.
export const toHistoryFilter = (
  group: BreakdownGroup,
  { period, transaction_type: transactionType }: Pick<StatisticsBreakdown, 'period' | 'transaction_type'>,
  spaceId: number,
  selfId: number | undefined,
): HistoryFilter | null => {
  if (!group.opens_history || period.actual_end_date === null) return null;

  const base = {
    spaceId,
    fromDate: period.start_date,
    toDate: period.actual_end_date,
    transactionType,
    kind: TransactionKind.REGULAR,
  };

  return group.kind === 'category'
    ? { ...base, name: group.name, icon: toMobileIcon(group.icon), color: group.color, categoryId: group.id }
    : { ...base, name: assignmentItemLabel(group, selfId), assignment: group.key as AssignmentKey };
};
