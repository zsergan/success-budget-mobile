import type { CreateTransactionRequest, UpdateTransactionRequest } from '@api/dto';
import type { CalendarDate } from '@shared/utils/calendarDate';
import { calendarDateInZone } from '@shared/utils/calendarDate';
import type { TimestampCreateBody, TimestampUpdateBody } from './historical';

// Where the history before calendar dates was entered; the server dated every existing record by this zone, so a
// write stored then is dated the same way, wherever the device is now. It is also the zone the converted write is
// sent with: the day it names is never after today there.
export const HISTORY_TIME_ZONE = 'America/Chicago';

// The Chicago day of an earlier build's instant; null for anything that is not one.
export const historicalDate = (timestamp: unknown): CalendarDate | null => {
  if (typeof timestamp !== 'string') return null;

  const instant = new Date(timestamp);
  if (Number.isNaN(instant.getTime())) return null;

  try {
    return calendarDateInZone(instant, HISTORY_TIME_ZONE);
  } catch {
    return null;
  }
};

// An earlier build's create body with its instant replaced by the day and the zone it is sent with; null when the
// instant cannot be read.
export const convertCreateBody = ({ timestamp, ...body }: TimestampCreateBody): CreateTransactionRequest | null => {
  const date = historicalDate(timestamp);

  return date === null ? null : { ...body, date, time_zone: HISTORY_TIME_ZONE };
};

// An edit that changed the instant changes the day instead; one that did not keeps its fields as they were.
export const convertUpdateBody = ({ timestamp, ...body }: TimestampUpdateBody): UpdateTransactionRequest | null => {
  if (timestamp === undefined) return body;

  const date = historicalDate(timestamp);

  return date === null ? null : { ...body, date, time_zone: HISTORY_TIME_ZONE };
};
