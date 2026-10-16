/**
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 * where P = principal, r = monthly interest rate, n = number of months
 * For zero interest: EMI = P / n
 */
export const calculateEMI = ({ loanAmount, annualRate, years, months = 0 }) => {
  const P = Number(loanAmount) || 0;
  const rate = Number(annualRate) || 0;
  const totalMonths = (Number(years) || 0) * 12 + (Number(months) || 0);

  if (P <= 0 || totalMonths <= 0) {
    return {
      emi: 0,
      totalPayment: 0,
      totalInterest: 0,
      principal: P,
      tenure: totalMonths,
      monthlyRate: 0,
    };
  }

  const monthlyRate = rate / 100 / 12;
  let emi;

  if (monthlyRate === 0) {
    emi = P / totalMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    emi = (P * monthlyRate * factor) / (factor - 1);
  }

  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - P;

  return {
    emi: Math.round(emi * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    principal: P,
    tenure: totalMonths,
    monthlyRate,
  };
};

/**
 * Safe date formatter for YYYY-MM-DD
 */
const formatISODate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generate complete amortization schedule
 * Supports extra monthly payments and lump-sum prepayments
 * 
 * Prepayment modes:
 * - 'reduce-tenure': Keep EMI same, reduce number of payments
 * - 'reduce-emi': Keep tenure same, reduce EMI after prepayment
 */
export const generateAmortization = ({
  loanAmount,
  annualRate,
  years,
  months = 0,
  extraMonthlyPayment = 0,
  prepayments = [], // [{month: 6, amount: 100000}]
  prepaymentMode = 'reduce-tenure', // 'reduce-tenure' or 'reduce-emi'
  startDate = new Date(),
}) => {
  const P = Number(loanAmount) || 0;
  const rate = Number(annualRate) || 0;
  const totalMonths = (Number(years) || 0) * 12 + (Number(months) || 0);
  const extraPayment = Number(extraMonthlyPayment) || 0;

  if (P <= 0 || totalMonths <= 0) return { schedule: [], yearlySummary: [], summary: {} };

  const monthlyRate = rate / 100 / 12;

  // Calculate base EMI
  let baseEMI;
  if (monthlyRate === 0) {
    baseEMI = P / totalMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    baseEMI = (P * monthlyRate * factor) / (factor - 1);
  }

  // Also calculate original schedule totals for comparison
  const originalTotalPayment = baseEMI * totalMonths;
  const originalTotalInterest = originalTotalPayment - P;

  const schedule = [];
  let balance = P;
  let currentEMI = baseEMI;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalExtraPaid = 0;
  const baseStart = new Date(startDate);
  const startDay = baseStart.getDate();
  let emiNumber = 0;

  // Create prepayment lookup
  const prepaymentMap = {};
  (prepayments || []).forEach((pp) => {
    prepaymentMap[pp.month] = (prepaymentMap[pp.month] || 0) + Number(pp.amount);
  });

  while (balance > 0.01 && emiNumber < totalMonths * 2) {
    emiNumber++;
    // Advance month safely
    const paymentDate = new Date(baseStart.getFullYear(), baseStart.getMonth() + emiNumber, startDay);
    if (paymentDate.getDate() !== startDay) {
      paymentDate.setDate(0);
    }

    const openingBalance = balance;

    // Calculate interest for this month
    const interestComponent = balance * monthlyRate;

    // Calculate principal component
    let principalComponent = currentEMI - interestComponent;

    // Handle extra and lump-sum prepayments
    let extraThisMonth = extraPayment;
    if (prepaymentMap[emiNumber]) {
      extraThisMonth += prepaymentMap[emiNumber];
    }

    // Ensure we don't overpay
    const potentialPayment = principalComponent + extraThisMonth;
    if (potentialPayment > balance) {
      // Adjust: pay only what's needed
      if (principalComponent >= balance) {
        principalComponent = balance;
        extraThisMonth = 0;
        currentEMI = principalComponent + interestComponent;
      } else {
        extraThisMonth = balance - principalComponent;
      }
    }

    balance -= (principalComponent + extraThisMonth);
    if (balance < 0.01) balance = 0; // Clean up floating point

    totalPrincipalPaid += principalComponent + extraThisMonth;
    totalInterestPaid += interestComponent;
    totalExtraPaid += extraThisMonth;

    schedule.push({
      emiNumber,
      paymentDate: formatISODate(paymentDate),
      openingBalance: Math.round(openingBalance * 100) / 100,
      emiAmount: Math.round((principalComponent + interestComponent) * 100) / 100,
      principal: Math.round(principalComponent * 100) / 100,
      interest: Math.round(interestComponent * 100) / 100,
      extraPayment: Math.round(extraThisMonth * 100) / 100,
      totalPrincipalPaid: Math.round(totalPrincipalPaid * 100) / 100,
      closingBalance: Math.round(balance * 100) / 100,
    });

    if (balance <= 0) break;

    // If reduce-emi mode and there was a prepayment, recalculate EMI
    if (prepaymentMode === 'reduce-emi' && prepaymentMap[emiNumber] && balance > 0) {
      const remainingMonths = totalMonths - emiNumber;
      if (remainingMonths > 0) {
        if (monthlyRate === 0) {
          currentEMI = balance / remainingMonths;
        } else {
          const factor = Math.pow(1 + monthlyRate, remainingMonths);
          currentEMI = (balance * monthlyRate * factor) / (factor - 1);
        }
      }
    }
  }

  // Yearly summary
  const yearlySummary = [];
  const yearMap = {};
  schedule.forEach((row) => {
    const year = new Date(row.paymentDate).getFullYear();
    if (!yearMap[year]) {
      yearMap[year] = { year, principal: 0, interest: 0, extraPayment: 0, totalPayment: 0, closingBalance: 0 };
    }
    yearMap[year].principal += row.principal;
    yearMap[year].interest += row.interest;
    yearMap[year].extraPayment += row.extraPayment;
    yearMap[year].totalPayment += row.emiAmount + row.extraPayment;
    yearMap[year].closingBalance = row.closingBalance;
  });

  Object.values(yearMap).forEach((y) => {
    yearlySummary.push({
      ...y,
      principal: Math.round(y.principal * 100) / 100,
      interest: Math.round(y.interest * 100) / 100,
      extraPayment: Math.round(y.extraPayment * 100) / 100,
      totalPayment: Math.round(y.totalPayment * 100) / 100,
    });
  });

  const interestSaved = Math.max(0, originalTotalInterest - totalInterestPaid);
  const monthsReduced = Math.max(0, totalMonths - schedule.length);

  return {
    schedule,
    yearlySummary,
    summary: {
      originalEMI: Math.round(baseEMI * 100) / 100,
      currentEMI: Math.round(currentEMI * 100) / 100,
      totalPrincipal: Math.round(totalPrincipalPaid * 100) / 100,
      totalInterest: Math.round(totalInterestPaid * 100) / 100,
      totalExtraPayments: Math.round(totalExtraPaid * 100) / 100,
      totalPayment: Math.round((totalPrincipalPaid + totalInterestPaid) * 100) / 100,
      actualTenure: schedule.length,
      originalTenure: totalMonths,
      interestSaved: Math.round(interestSaved * 100) / 100,
      monthsReduced,
      payoffDate: schedule.length > 0 ? schedule[schedule.length - 1].paymentDate : null,
    },
  };
};

// Loan presets
export const LOAN_PRESETS = {
  home: { name: 'Home Loan', icon: 'Home', defaultAmount: 5000000, defaultYears: 20, defaultRate: 8.5 },
  personal: { name: 'Personal Loan', icon: 'User', defaultAmount: 500000, defaultYears: 5, defaultRate: 12 },
  car: { name: 'Car Loan', icon: 'Car', defaultAmount: 800000, defaultYears: 7, defaultRate: 9 },
  education: { name: 'Education Loan', icon: 'GraduationCap', defaultAmount: 1000000, defaultYears: 10, defaultRate: 8 },
  custom: { name: 'Custom Loan', icon: 'Settings', defaultAmount: 1000000, defaultYears: 10, defaultRate: 10 },
};

export default {
  calculateEMI,
  generateAmortization,
  LOAN_PRESETS,
};
