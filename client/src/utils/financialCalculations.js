/**
 * Lumpsum: A = P × (1 + r/100)^t
 */
export const calculateLumpsum = ({ principal, annualReturn, years }) => {
  const P = Number(principal) || 0;
  const r = Number(annualReturn) || 0;
  const t = Number(years) || 0;

  if (P <= 0 || t <= 0) return { invested: 0, returns: 0, maturityValue: 0, absoluteReturn: 0, yearWiseData: [] };

  const maturityValue = P * Math.pow(1 + r / 100, t);
  const returns = maturityValue - P;

  const yearWiseData = [];
  for (let y = 1; y <= t; y++) {
    const value = P * Math.pow(1 + r / 100, y);
    yearWiseData.push({
      year: y,
      invested: P,
      value: Math.round(value * 100) / 100,
      gains: Math.round((value - P) * 100) / 100,
    });
  }

  return {
    invested: P,
    returns: Math.round(returns * 100) / 100,
    maturityValue: Math.round(maturityValue * 100) / 100,
    absoluteReturn: P > 0 ? Math.round((returns / P) * 10000) / 100 : 0,
    yearWiseData,
  };
};

/**
 * Simple Interest: SI = P × R × T / 100
 */
export const calculateSimpleInterest = ({ principal, rate, years }) => {
  const P = Number(principal) || 0;
  const R = Number(rate) || 0;
  const T = Number(years) || 0;

  const interest = (P * R * T) / 100;
  return {
    principal: P,
    interest: Math.round(interest * 100) / 100,
    maturityAmount: Math.round((P + interest) * 100) / 100,
  };
};

/**
 * Compound Interest: A = P × (1 + r/n)^(n*t)
 * With optional regular contributions
 */
export const calculateCompoundInterest = ({
  principal,
  rate,
  years,
  compoundingFrequency = 12,
  periodicContribution = 0,
  contributionFrequency = 12, // how many times per year
}) => {
  const P = Number(principal) || 0;
  const r = Number(rate) || 0;
  const t = Number(years) || 0;
  const n = Number(compoundingFrequency) || 12;
  const contrib = Number(periodicContribution) || 0;
  const contribFreq = Number(contributionFrequency) || 12;

  const ratePerPeriod = r / 100 / n;
  const totalPeriods = n * t;

  // Principal growth
  const principalGrowth = P * Math.pow(1 + ratePerPeriod, totalPeriods);

  // Contribution growth (annuity)
  let contributionGrowth = 0;
  if (contrib > 0 && ratePerPeriod > 0) {
    // Adjust contribution to match compounding periods
    const adjustedContrib = (contrib * contribFreq) / n;
    contributionGrowth = adjustedContrib * ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod);
  } else if (contrib > 0) {
    contributionGrowth = contrib * contribFreq * t;
  }

  const maturityAmount = principalGrowth + contributionGrowth;
  const totalContributions = P + contrib * contribFreq * t;
  const totalInterest = maturityAmount - totalContributions;

  return {
    principal: P,
    totalContributions: Math.round(totalContributions * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    maturityAmount: Math.round(maturityAmount * 100) / 100,
    effectiveAnnualRate: Math.round((Math.pow(1 + r / 100 / n, n) - 1) * 10000) / 100,
  };
};

/**
 * Inflation Calculator
 * Future cost = Present × (1 + inflation)^years
 * Present value of future = Future / (1 + inflation)^years  
 */
export const calculateInflation = ({
  currentAmount,
  inflationRate,
  years,
  mode = 'future-cost', // 'future-cost' or 'present-value'
}) => {
  const amount = Number(currentAmount) || 0;
  const rate = Number(inflationRate) || 0;
  const t = Number(years) || 0;

  const factor = Math.pow(1 + rate / 100, t);

  if (mode === 'future-cost') {
    const futureAmount = amount * factor;
    return {
      currentAmount: amount,
      futureAmount: Math.round(futureAmount * 100) / 100,
      inflationImpact: Math.round((futureAmount - amount) * 100) / 100,
      purchasingPowerLoss: Math.round((1 - 1 / factor) * 10000) / 100,
    };
  } else {
    const presentValue = factor > 0 ? amount / factor : 0;
    return {
      futureAmount: amount,
      presentValue: Math.round(presentValue * 100) / 100,
      purchasingPower: amount > 0 ? Math.round((presentValue / amount) * 10000) / 100 : 0,
    };
  }
};

/**
 * Goal-Based Investment Calculator
 * Calculate monthly SIP or lumpsum needed to reach a target
 */
export const calculateGoalInvestment = ({
  goalName = '',
  targetAmount,
  currentSavings = 0,
  years,
  expectedReturn,
  inflationRate = 0,
}) => {
  const target = Number(targetAmount) || 0;
  const savings = Number(currentSavings) || 0;
  const t = Number(years) || 0;
  const r = Number(expectedReturn) || 0;
  const inflation = Number(inflationRate) || 0;

  // Inflation-adjusted target
  const inflationAdjustedTarget = target * Math.pow(1 + inflation / 100, t);

  // Growth of current savings
  const savingsGrowth = savings * Math.pow(1 + r / 100, t);

  // Amount still needed
  const amountNeeded = Math.max(0, inflationAdjustedTarget - savingsGrowth);

  // Lumpsum needed today
  const lumpsumNeeded = amountNeeded / Math.pow(1 + r / 100, t);

  // Monthly SIP needed
  const monthlyRate = r / 100 / 12;
  const totalMonths = t * 12;
  let monthlySIP;
  if (monthlyRate === 0) {
    monthlySIP = totalMonths > 0 ? amountNeeded / totalMonths : amountNeeded;
  } else {
    monthlySIP = (amountNeeded * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }

  return {
    goalName,
    targetAmount: target,
    inflationAdjustedTarget: Math.round(inflationAdjustedTarget),
    currentSavings: savings,
    savingsGrowth: Math.round(savingsGrowth),
    amountNeeded: Math.round(amountNeeded),
    lumpsumNeeded: Math.round(lumpsumNeeded),
    monthlySIPNeeded: Math.round(monthlySIP),
  };
};

/**
 * Gold Investment Calculator
 */
export const calculateGold = ({
  investmentType = 'amount', // 'amount' or 'weight'
  investmentAmount = 0,
  goldWeight = 0, // grams
  purchasePrice, // per gram
  currentPrice, // per gram
  makingChargesPercent = 0,
  taxPercent = 0,
  sellingCostPercent = 0,
}) => {
  const buyPrice = Number(purchasePrice) || 0;
  const sellPrice = Number(currentPrice) || 0;

  let weight;
  let totalBuyCost;
  if (investmentType === 'amount') {
    const amount = Number(investmentAmount) || 0;
    const makingCharges = buyPrice * (Number(makingChargesPercent) / 100);
    const effectiveBuyPrice = buyPrice + makingCharges;
    weight = effectiveBuyPrice > 0 ? amount / effectiveBuyPrice : 0;
    totalBuyCost = amount;
  } else {
    weight = Number(goldWeight) || 0;
    const makingCharges = buyPrice * (Number(makingChargesPercent) / 100);
    totalBuyCost = weight * (buyPrice + makingCharges);
  }

  const currentValue = weight * sellPrice;
  const sellingCost = currentValue * (Number(sellingCostPercent) / 100);
  const tax = Math.max(0, currentValue - totalBuyCost) * (Number(taxPercent) / 100);
  const netValue = currentValue - sellingCost - tax;
  const profitLoss = netValue - totalBuyCost;
  const returnPercent = totalBuyCost > 0 ? (profitLoss / totalBuyCost) * 100 : 0;

  return {
    goldWeight: Math.round(weight * 1000) / 1000,
    totalBuyCost: Math.round(totalBuyCost * 100) / 100,
    currentValue: Math.round(currentValue * 100) / 100,
    sellingCost: Math.round(sellingCost * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    netValue: Math.round(netValue * 100) / 100,
    profitLoss: Math.round(profitLoss * 100) / 100,
    returnPercent: Math.round(returnPercent * 100) / 100,
  };
};

/**
 * CAGR = (Final/Initial)^(1/years) - 1
 */
export const calculateCAGR = ({ initialValue, finalValue, years }) => {
  const initial = Number(initialValue) || 0;
  const final_ = Number(finalValue) || 0;
  const t = Number(years) || 0;

  if (initial <= 0 || t <= 0) return { cagr: 0, absoluteReturn: 0, totalGain: 0 };

  const cagr = (Math.pow(final_ / initial, 1 / t) - 1) * 100;
  const absoluteReturn = ((final_ - initial) / initial) * 100;

  return {
    initialValue: initial,
    finalValue: final_,
    years: t,
    cagr: Math.round(cagr * 100) / 100,
    absoluteReturn: Math.round(absoluteReturn * 100) / 100,
    totalGain: Math.round((final_ - initial) * 100) / 100,
  };
};

/**
 * XIRR - Extended Internal Rate of Return
 * Uses Newton-Raphson method to find rate where NPV = 0
 * NPV = sum of cashFlow[i] * (1 + rate)^(-daysDiff[i]/365)
 */
export const calculateXIRR = (cashFlows) => {
  // cashFlows: [{date: '2020-01-01', amount: -10000}, {date: '2021-01-01', amount: 12000}]
  if (!cashFlows || cashFlows.length < 2) {
    return { xirr: null, error: 'At least 2 cash flows required' };
  }

  const hasPositive = cashFlows.some((cf) => Number(cf.amount) > 0);
  const hasNegative = cashFlows.some((cf) => Number(cf.amount) < 0);
  if (!hasPositive || !hasNegative) {
    return { xirr: null, error: 'Cash flows must include both positive and negative values' };
  }

  // Sort by date
  const sorted = [...cashFlows].sort((a, b) => new Date(a.date) - new Date(b.date));
  const dates = sorted.map((cf) => new Date(cf.date));
  const amounts = sorted.map((cf) => Number(cf.amount));
  const firstDate = dates[0];

  // Days from first date
  const daysDiff = dates.map((d) => (d - firstDate) / (1000 * 60 * 60 * 24));

  // Newton-Raphson
  const npv = (r) => {
    let sum = 0;
    for (let i = 0; i < amounts.length; i++) {
      sum += amounts[i] * Math.pow(1 + r, -daysDiff[i] / 365);
    }
    return sum;
  };

  const npvDerivative = (r) => {
    let sum = 0;
    for (let i = 0; i < amounts.length; i++) {
      const exp = -daysDiff[i] / 365;
      sum += amounts[i] * exp * Math.pow(1 + r, exp - 1);
    }
    return sum;
  };

  let rate = 0.1; // initial guess
  const maxIterations = 1000;
  const tolerance = 1e-10;
  let converged = false;

  for (let i = 0; i < maxIterations; i++) {
    const fValue = npv(rate);
    const fDerivative = npvDerivative(rate);

    if (Math.abs(fDerivative) < 1e-14) {
      rate += 0.05;
      continue;
    }

    const newRate = rate - fValue / fDerivative;

    if (Math.abs(newRate - rate) < tolerance) {
      rate = newRate;
      converged = true;
      break;
    }

    rate = newRate;

    // Guard against out of bounds during NR
    if (rate <= -0.999 || rate > 100 || isNaN(rate)) {
      break;
    }
  }

  if (converged && !isNaN(rate)) {
    return {
      xirr: Math.round(rate * 10000) / 100,
      npv: Math.round(npv(rate) * 100) / 100,
      error: null,
    };
  }

  // Fallback: Bisection method for robust convergence
  let low = -0.99;
  let high = 10.0;
  let fLow = npv(low);
  let fHigh = npv(high);

  if (fLow * fHigh > 0) {
    // Expand high range
    high = 100.0;
    fHigh = npv(high);
  }

  if (fLow * fHigh < 0) {
    for (let i = 0; i < 200; i++) {
      const mid = (low + high) / 2;
      const fMid = npv(mid);

      if (Math.abs(fMid) < 1e-7 || (high - low) / 2 < tolerance) {
        return {
          xirr: Math.round(mid * 10000) / 100,
          npv: Math.round(fMid * 100) / 100,
          error: null,
        };
      }

      if (fLow * fMid < 0) {
        high = mid;
        fHigh = fMid;
      } else {
        low = mid;
        fLow = fMid;
      }
    }
  }

  return { xirr: null, error: 'Calculation did not converge. Check your cash flows.' };
};

export default {
  calculateLumpsum,
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateInflation,
  calculateGoalInvestment,
  calculateGold,
  calculateCAGR,
  calculateXIRR,
};
