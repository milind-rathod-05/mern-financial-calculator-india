// Indian number formatting: ₹1,00,000
export const formatCurrency = (amount, decimals = 0) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const num = Number(amount);
  // Use Indian numbering system
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `₹${formatted}`;
};

export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercent = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '0%';
  return `${Number(num).toFixed(decimals)}%`;
};

export const parseCurrencyInput = (value) => {
  if (typeof value === 'number') return value;
  return Number(String(value).replace(/[₹,\s]/g, '')) || 0;
};

/**
 * Compact currency formatting for Indian notation (e.g. ₹1.5 Cr, ₹25 L, ₹10 K)
 */
export const formatCompactCurrency = (amount, decimals = 2) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const num = Math.abs(Number(amount));
  const sign = Number(amount) < 0 ? '-' : '';

  if (num >= 10000000) {
    // 1 Crore = 10,000,000
    const cr = num / 10000000;
    return `${sign}₹${cr.toFixed(decimals).replace(/\.00$/, '')} Cr`;
  }
  if (num >= 100000) {
    // 1 Lakh = 100,000
    const lk = num / 100000;
    return `${sign}₹${lk.toFixed(decimals).replace(/\.00$/, '')} L`;
  }
  if (num >= 1000) {
    // 1 Thousand = 1,000
    const k = num / 1000;
    return `${sign}₹${k.toFixed(decimals).replace(/\.00$/, '')} K`;
  }

  return formatCurrency(amount, decimals);
};

export default {
  formatCurrency,
  formatNumber,
  formatPercent,
  parseCurrencyInput,
  formatCompactCurrency,
};
