import { TransactionType } from '@shared/enums';

export const formatNumber = (num: number | string) => Number(num).toLocaleString('en-US').replace(/,/g, ' ');

export const formatCurrencyAmount = (amount: number | string, currencyCode?: string) =>
  currencyCode ? `${formatNumber(amount)} ${currencyCode}` : formatNumber(amount);

const MONEY_TEXT = /^(-?)(\d+)(?:\.(\d{1,2}))?$/;

// Grouped as text rather than through Number, so a server total past Number's precision keeps its cents.
const splitMoney = (amount: number | string) => {
  const match = MONEY_TEXT.exec(typeof amount === 'number' ? amount.toFixed(2) : amount.trim());
  if (!match) return null;

  const [, minus, whole, fraction = ''] = match;
  const cents = fraction.padEnd(2, '0');
  const units = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = /[1-9]/.test(whole + cents) ? (minus ? -1 : 1) : 0;

  return { sign, digits: `${units}.${cents}` };
};

const withCurrency = (text: string, currencyCode?: string) => (currencyCode ? `${text} ${currencyCode}` : text);

// History money: always two decimal places.
export const formatMoneyAmount = (amount: number | string, currencyCode?: string) => {
  const money = splitMoney(amount);
  if (!money) return withCurrency(String(amount), currencyCode);

  return withCurrency(`${money.sign < 0 ? '-' : ''}${money.digits}`, currencyCode);
};

// A total that nets out either way; zero takes no sign.
export const formatSignedAmount = (amount: number | string, currencyCode?: string) => {
  const money = splitMoney(amount);
  if (!money) return withCurrency(String(amount), currencyCode);

  const sign = money.sign > 0 ? '+' : money.sign < 0 ? '-' : '';

  return withCurrency(`${sign}${money.digits}`, currencyCode);
};

export const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const formatAmount = (amount: number | string, transactionType: TransactionType, currency?: string) =>
  `${transactionType === TransactionType.EXPENSE ? '-' : '+'}${formatMoneyAmount(amount, currency)}`;

export const formatDateDDMMYYYY = (d: Date | string) => {
  const date = new Date(d);

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day < 10 ? `0${day}` : day}.${month < 10 ? `0${month}` : month}.${year}`;
};

export const formatDateMM = (d: Date | string) => {
  const date = new Date(d);

  const month = date.toLocaleString('default', { month: 'long' });

  return `${month}`;
};

export const formatDateHHMM = (d: Date | string) => {
  const date = new Date(d);

  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
};

export const formatMonthYear = (d: Date | string) =>
  new Date(d).toLocaleString('en-US', { month: 'long', year: 'numeric' });

export const formatDateLong = (d: Date | string) =>
  new Date(d).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDayMonth = (d: Date | string) =>
  new Date(d).toLocaleString('en-US', { day: 'numeric', month: 'short' });
