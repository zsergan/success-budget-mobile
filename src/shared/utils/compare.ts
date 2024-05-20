export const compareDays = (d1: Date | string, d2: Date | string) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);

  const year1 = date1.getFullYear();
  const month1 = date1.getMonth();
  const day1 = date1.getDate();
  const year2 = date2.getFullYear();

  const month2 = date2.getMonth();
  const day2 = date2.getDate();

  return year1 === year2 && month1 === month2 && day1 === day2;
};
