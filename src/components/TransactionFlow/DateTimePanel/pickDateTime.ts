// The picked instant never goes past now: a transaction cannot be in the future.
const notAfter = (date: Date, now: Date) => (date.getTime() > now.getTime() ? new Date(now) : date);

// A day keeps the time already picked.
export const pickDay = (pending: string, day: Date, now: Date) => {
  const next = new Date(pending);
  next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());

  return notAfter(next, now).toISOString();
};

// A time keeps the day already picked.
export const pickTime = (pending: string, time: Date, now: Date) => {
  const next = new Date(pending);
  next.setHours(time.getHours(), time.getMinutes(), 0, 0);

  return notAfter(next, now).toISOString();
};
