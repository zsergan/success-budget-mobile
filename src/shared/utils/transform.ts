import { TransactionType } from '@shared/enums';

export const formatNumber = (num: number | string) => Number(num).toLocaleString('en-US').replace(/,/g, ' ');

export const formatAmount = (amount: number | string, transactionType: TransactionType, currency?: string) => {
  let formattedAmount = formatNumber(amount);

  if (currency) {
    formattedAmount = `${formattedAmount} ${currency}`;
  }

  return transactionType === TransactionType.EXPENSE ? `-${formattedAmount}` : formattedAmount;
};

export const addCurrentTime = (date: Date) => {
  const currentDate = new Date();
  date.setHours(currentDate.getHours());
  date.setMinutes(currentDate.getMinutes());
  date.setSeconds(currentDate.getSeconds());

  return date;
};

export const formatDateDDMMYYYY = (d: Date | string) => {
  const date = new Date(d);

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day < 10 ? `0${day}` : day}.${month < 10 ? `0${month}` : month}.${year}`;
};

export const formatDateHHMM = (d: Date | string) => {
  const date = new Date(d);

  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
};
