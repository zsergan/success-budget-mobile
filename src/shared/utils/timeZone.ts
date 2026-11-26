// The device's IANA zone; the API refuses fixed offsets, so there is no offset fallback.
export const getDeviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
