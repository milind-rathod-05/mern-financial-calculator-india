export const getFinancialYear = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed: April is month 3
  // Indian financial year runs from April 1 to March 31
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + Number(months));
  return d;
};

export const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + Number(years));
  return d;
};

export const getMonthsDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
};

export const getYearsDifference = (date1, date2) => {
  return getMonthsDifference(date1, date2) / 12;
};

export default {
  getFinancialYear,
  formatDate,
  addMonths,
  addYears,
  getMonthsDifference,
  getYearsDifference,
};
