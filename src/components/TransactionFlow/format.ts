import { formatDateHHMM, formatDayMonth, formatDateLong } from '@shared/utils';
import { compareDays } from '@shared/utils/compare';

// "Today, 17:59", "Yesterday, 09:10", "29 Aug, 18:20", and the year only when it is not this one.
export const formatDateTime = (value: string | Date, now = new Date()) => {
  const date = new Date(value);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const day = compareDays(date, now)
    ? 'Today'
    : compareDays(date, yesterday)
      ? 'Yesterday'
      : date.getFullYear() === now.getFullYear()
        ? formatDayMonth(date)
        : formatDateLong(date);

  return `${day}, ${formatDateHHMM(date)}`;
};
