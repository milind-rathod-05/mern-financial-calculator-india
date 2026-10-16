/**
 * PPF Calculator
 * Interest calculated on minimum balance between 5th and end of month
 * Interest compounded annually, credited at financial year end
 * 
 * Simplified model: Annual contributions at start or end of year,
 * interest compounded annually.
 */
export const calculatePPF = ({
  currentBalance = 0,
  annualContribution,
  interestRate,
  years = 15,
  contributionSchedule = 'yearly-start', // 'yearly-start', 'yearly-end', 'monthly'
}) => {
  const balance = Number(currentBalance) || 0;
  const contribution = Math.min(Number(annualContribution) || 0, 150000); // Max limit ₹1,50,000 / year
  const rate = (Number(interestRate) || 7.1) / 100;
  const duration = Number(years) || 15;

  const yearWiseData = [];
  let currentBal = balance;
  let totalContributions = balance;
  let totalInterest = 0;

  for (let y = 1; y <= duration; y++) {
    const openingBalance = currentBal;
    let interest;

    if (contributionSchedule === 'yearly-start') {
      // Contribution at start of year earns full year interest
      currentBal += contribution;
      interest = currentBal * rate;
    } else if (contributionSchedule === 'monthly') {
      // Monthly contributions - simplified: each monthly installment earns proportional interest
      const monthlyAmount = contribution / 12;
      interest = openingBalance * rate;
      for (let m = 1; m <= 12; m++) {
        interest += (monthlyAmount * rate * (12 - m + 1)) / 12;
      }
      currentBal += contribution;
    } else {
      // yearly-end: contribution at end, earns no interest this year
      interest = currentBal * rate;
      currentBal += contribution;
    }

    interest = Math.round(interest * 100) / 100;
    currentBal += interest;
    totalContributions += contribution;
    totalInterest += interest;

    yearWiseData.push({
      year: y,
      openingBalance: Math.round(openingBalance * 100) / 100,
      contribution,
      interest,
      closingBalance: Math.round(currentBal * 100) / 100,
    });
  }

  return {
    totalContributions: Math.round(totalContributions * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    maturityValue: Math.round(currentBal * 100) / 100,
    yearWiseData,
  };
};

/**
 * SSA (Sukanya Samriddhi Account) Calculator
 * Deposit period: 15 years from opening (deposits only for first 15 years)
 * Maturity: 21 years from opening or marriage after age 18
 * Min deposit: ₹250, Max: ₹1,50,000 per year
 */
export const calculateSSA = ({
  dateOfBirth,
  accountOpeningDate,
  annualDeposit,
  interestRate,
  depositFrequency = 'yearly',
}) => {
  const deposit = Math.max(250, Math.min(Number(annualDeposit) || 0, 150000));
  const rate = (Number(interestRate) || 8.2) / 100;

  const dob = dateOfBirth ? new Date(dateOfBirth) : new Date();
  const openDate = accountOpeningDate ? new Date(accountOpeningDate) : new Date();

  // Account matures after 21 years from opening
  const maturityYears = 21;
  const depositYears = 15; // Deposits allowed for first 15 years

  const yearWiseData = [];
  let balance = 0;
  let totalDeposits = 0;
  let totalInterest = 0;

  for (let y = 1; y <= maturityYears; y++) {
    const openingBalance = balance;
    const yearDeposit = y <= depositYears ? deposit : 0;

    // Interest on opening balance + deposit (simplified annual compound)
    balance += yearDeposit;
    const interest = Math.round(balance * rate * 100) / 100;
    balance += interest;

    totalDeposits += yearDeposit;
    totalInterest += interest;

    const currentDate = new Date(openDate);
    currentDate.setFullYear(currentDate.getFullYear() + y);
    const childAge = Math.floor((currentDate - dob) / (365.25 * 24 * 60 * 60 * 1000));

    yearWiseData.push({
      year: y,
      financialYear: `${openDate.getFullYear() + y - 1}-${(openDate.getFullYear() + y).toString().slice(-2)}`,
      openingBalance: Math.round(openingBalance * 100) / 100,
      deposit: yearDeposit,
      interest,
      closingBalance: Math.round(balance * 100) / 100,
      childAge,
      isDepositYear: y <= depositYears,
    });
  }

  // Eligibility: girl child age must be <= 10 at account opening
  const ageAtOpening = Math.floor((openDate - dob) / (365.25 * 24 * 60 * 60 * 1000));
  const eligible = ageAtOpening <= 10 && ageAtOpening >= 0;

  const maturityDateObj = new Date(openDate.getFullYear() + maturityYears, openDate.getMonth(), openDate.getDate());
  const maturityDate = `${maturityDateObj.getFullYear()}-${String(maturityDateObj.getMonth() + 1).padStart(2, '0')}-${String(maturityDateObj.getDate()).padStart(2, '0')}`;

  return {
    totalDeposits: Math.round(totalDeposits * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    maturityValue: Math.round(balance * 100) / 100,
    yearWiseData,
    eligible,
    ageAtOpening,
    maturityDate,
  };
};

/**
 * Fixed Deposit Calculator
 * Cumulative: A = P × (1 + r/n)^(n*t)
 * Non-cumulative: periodic payout = P × r / payoutFrequency
 */
export const calculateFD = ({
  principal,
  annualRate,
  years,
  months = 0,
  compoundingFrequency = 4, // 4 = quarterly (standard for Indian banks)
  payoutOption = 'cumulative', // 'cumulative', 'monthly', 'quarterly', 'half-yearly', 'yearly'
  taxRate = 0,
}) => {
  const P = Number(principal) || 0;
  const rate = Number(annualRate) || 0;
  const totalYears = (Number(years) || 0) + (Number(months) || 0) / 12;
  const n = Number(compoundingFrequency) || 4;
  const tax = Number(taxRate) || 0;

  if (P <= 0 || totalYears <= 0) {
    return {
      principal: P,
      maturityValue: 0,
      totalInterest: 0,
      taxAmount: 0,
      postTaxInterest: 0,
      postTaxMaturity: 0,
      effectiveAnnualYield: 0,
    };
  }

  const r = rate / 100;

  if (payoutOption === 'cumulative') {
    const maturityValue = P * Math.pow(1 + r / n, n * totalYears);
    const totalInterest = maturityValue - P;
    const taxAmount = totalInterest * (tax / 100);
    const effectiveAnnualYield = (Math.pow(1 + r / n, n) - 1) * 100;

    return {
      principal: P,
      maturityValue: Math.round(maturityValue * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      postTaxInterest: Math.round((totalInterest - taxAmount) * 100) / 100,
      postTaxMaturity: Math.round((maturityValue - taxAmount) * 100) / 100,
      effectiveAnnualYield: Math.round(effectiveAnnualYield * 100) / 100,
    };
  } else {
    // Non-cumulative: periodic interest payout
    let payoutsPerYear;
    switch (payoutOption) {
      case 'monthly':
        payoutsPerYear = 12;
        break;
      case 'quarterly':
        payoutsPerYear = 4;
        break;
      case 'half-yearly':
        payoutsPerYear = 2;
        break;
      case 'yearly':
        payoutsPerYear = 1;
        break;
      default:
        payoutsPerYear = 4;
    }

    const periodicPayout = (P * r) / payoutsPerYear;
    const totalPayouts = Math.floor(payoutsPerYear * totalYears);
    const totalInterest = periodicPayout * totalPayouts;
    const taxAmount = totalInterest * (tax / 100);

    return {
      principal: P,
      periodicPayout: Math.round(periodicPayout * 100) / 100,
      payoutFrequency: payoutOption,
      totalPayouts,
      totalInterest: Math.round(totalInterest * 100) / 100,
      maturityValue: P, // Principal returned at maturity
      taxAmount: Math.round(taxAmount * 100) / 100,
      postTaxInterest: Math.round((totalInterest - taxAmount) * 100) / 100,
      postTaxMaturity: P,
    };
  }
};

/**
 * Recurring Deposit Calculator
 * Standard quarterly compounding as typical for Indian banks
 * Each monthly deposit compounds for remaining duration
 */
export const calculateRD = ({
  monthlyDeposit,
  annualRate,
  years,
  months = 0,
  compoundingFrequency = 4,
  taxRate = 0,
}) => {
  const P = Number(monthlyDeposit) || 0;
  const rate = Number(annualRate) || 0;
  const totalMonths = (Number(years) || 0) * 12 + (Number(months) || 0);
  const n = Number(compoundingFrequency) || 4;
  const tax = Number(taxRate) || 0;

  if (P <= 0 || totalMonths <= 0) {
    return {
      monthlyDeposit: 0,
      totalDeposits: 0,
      maturityValue: 0,
      totalInterest: 0,
      taxAmount: 0,
      postTaxInterest: 0,
      postTaxMaturity: 0,
      growthData: [],
    };
  }

  const r = rate / 100;
  const totalDeposits = P * totalMonths;

  // Each monthly installment compounds for remaining tenure
  let maturityValue = 0;
  const quarterlyRate = r / n;

  for (let m = 1; m <= totalMonths; m++) {
    const remainingMonths = totalMonths - m + 1;
    const quarters = remainingMonths / 3; // quarterly periods remaining
    maturityValue += P * Math.pow(1 + quarterlyRate, quarters);
  }

  const totalInterest = maturityValue - totalDeposits;
  const taxAmount = totalInterest * (tax / 100);

  // Month-wise/quarter-wise growth
  const growthData = [];
  let cumDeposit = 0;
  for (let m = 1; m <= totalMonths; m++) {
    cumDeposit += P;
    let valueAtMonth = 0;
    for (let d = 1; d <= m; d++) {
      const remMonths = m - d + 1;
      valueAtMonth += P * Math.pow(1 + quarterlyRate, remMonths / 3);
    }
    if (m % 3 === 0 || m === totalMonths) {
      // Show quarterly & final
      growthData.push({
        month: m,
        totalDeposits: Math.round(cumDeposit * 100) / 100,
        estimatedValue: Math.round(valueAtMonth * 100) / 100,
        estimatedInterest: Math.round((valueAtMonth - cumDeposit) * 100) / 100,
      });
    }
  }

  return {
    monthlyDeposit: P,
    totalDeposits: Math.round(totalDeposits * 100) / 100,
    maturityValue: Math.round(maturityValue * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    postTaxInterest: Math.round((totalInterest - taxAmount) * 100) / 100,
    postTaxMaturity: Math.round((maturityValue - taxAmount) * 100) / 100,
    growthData,
  };
};

/**
 * EPF Calculator
 */
export const calculateEPF = ({
  currentBalance = 0,
  monthlyBasicSalary,
  employeeContributionRate = 12, // % of basic
  employerContributionRate = 12, // % of basic (3.67% to EPF, 8.33% to EPS)
  employerEPFShare = 3.67, // % of basic that goes to EPF
  annualSalaryGrowth = 5,
  interestRate = 8.15,
  yearsOfService,
  includeEPS = false, // if true, use full employer rate; else use EPF share only
}) => {
  const balance = Number(currentBalance) || 0;
  const basicSalary = Number(monthlyBasicSalary) || 0;
  const empRate = Number(employeeContributionRate) / 100;
  const employerRate = includeEPS ? Number(employerContributionRate) / 100 : Number(employerEPFShare) / 100;
  const salaryGrowth = Number(annualSalaryGrowth) / 100;
  const rate = Number(interestRate) / 100;
  const years = Number(yearsOfService) || 0;

  const yearWiseData = [];
  let currentBal = balance;
  let currentSalary = basicSalary;
  let totalEmployeeContrib = 0;
  let totalEmployerContrib = 0;
  let totalInterest = 0;

  for (let y = 1; y <= years; y++) {
    const openingBalance = currentBal;
    const empContrib = currentSalary * empRate * 12;
    const employerContrib = currentSalary * employerRate * 12;
    const yearlyContrib = empContrib + employerContrib;

    // Interest on opening balance + monthly contributions (approximate mid-year compounding)
    const interest = (openingBalance + yearlyContrib / 2) * rate;

    currentBal += yearlyContrib + interest;
    totalEmployeeContrib += empContrib;
    totalEmployerContrib += employerContrib;
    totalInterest += interest;

    yearWiseData.push({
      year: y,
      monthlySalary: Math.round(currentSalary),
      employeeContribution: Math.round(empContrib),
      employerContribution: Math.round(employerContrib),
      interest: Math.round(interest),
      closingBalance: Math.round(currentBal),
      openingBalance: Math.round(openingBalance),
    });

    // Salary increment
    currentSalary *= 1 + salaryGrowth;
  }

  return {
    totalCorpus: Math.round(currentBal),
    totalEmployeeContribution: Math.round(totalEmployeeContrib),
    totalEmployerContribution: Math.round(totalEmployerContrib),
    totalInterest: Math.round(totalInterest),
    yearWiseData,
  };
};

/**
 * NPS Calculator
 */
export const calculateNPS = ({
  monthlyContribution,
  annualReturn,
  years,
  annuityPercent = 40, // min 40% must be used for annuity
  annuityRate = 6, // assumed annuity rate
}) => {
  const P = Number(monthlyContribution) || 0;
  const rate = Number(annualReturn) || 0;
  const duration = Number(years) || 0;
  const annuityPct = Math.max(40, Number(annuityPercent) || 40) / 100;
  const annuityRt = Number(annuityRate) / 100;

  // Use SIP formula for monthly contributions
  const monthlyRate = rate / 100 / 12;
  const totalMonths = duration * 12;
  const totalInvested = P * totalMonths;

  let corpus;
  if (monthlyRate === 0) {
    corpus = P * totalMonths;
  } else {
    corpus = P * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
  }

  const lumpSumWithdrawal = corpus * (1 - annuityPct);
  const annuityPurchase = corpus * annuityPct;
  const monthlyPension = (annuityPurchase * annuityRt) / 12;

  return {
    totalInvested: Math.round(totalInvested),
    totalCorpus: Math.round(corpus),
    wealthGained: Math.round(corpus - totalInvested),
    lumpSumWithdrawal: Math.round(lumpSumWithdrawal),
    annuityPurchase: Math.round(annuityPurchase),
    estimatedMonthlyPension: Math.round(monthlyPension),
    estimatedAnnualPension: Math.round(monthlyPension * 12),
  };
};

export default {
  calculatePPF,
  calculateSSA,
  calculateFD,
  calculateRD,
  calculateEPF,
  calculateNPS,
};
