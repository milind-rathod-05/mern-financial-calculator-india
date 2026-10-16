/**
 * Step-Up SIP: Monthly SIP increases by stepUpRate% or fixed amount each year.
 * 
 * Calculation approach:
 * For each year, the monthly contribution is:
 *   - Percentage: P_y = P_1 * (1 + stepUp/100)^(y-1)
 *   - Fixed: P_y = P_1 + (y-1) * stepUpAmount
 * 
 * For each month within a year, compound forward to end:
 *   FV = sum over all months of [contribution_m * (1 + monthlyRate)^(totalMonths - m)]
 */
export const calculateStepUpSIP = ({
  initialMonthlyAmount,
  annualReturn,
  years,
  stepUpRate = 0,
  stepUpType = 'percentage', // 'percentage' or 'fixed'
  stepUpAmount = 0,
  compareWithRegular = true,
}) => {
  const P = Number(initialMonthlyAmount) || 0;
  const rate = Number(annualReturn) || 0;
  const duration = Number(years) || 0;
  const stepUp = stepUpType === 'percentage' ? (Number(stepUpRate) || 0) : 0;
  const fixedStepUp = stepUpType === 'fixed' ? (Number(stepUpAmount) || 0) : 0;

  if (P <= 0 || duration <= 0) {
    return {
      totalInvested: 0,
      maturityValue: 0,
      estimatedReturns: 0,
      absoluteReturn: 0,
      finalMonthlyAmount: 0,
      yearWiseData: [],
      comparison: null,
    };
  }

  const monthlyRate = rate / 100 / 12;
  const totalMonths = duration * 12;

  let totalInvested = 0;
  let maturityValue = 0;
  const yearWiseData = [];
  let currentMonthlyAmount = P;

  // Also calculate regular SIP for comparison
  let regularTotal = 0;
  let regularMaturity = 0;

  for (let year = 1; year <= duration; year++) {
    // Determine monthly amount for this year
    if (year > 1) {
      if (stepUpType === 'percentage') {
        currentMonthlyAmount = P * Math.pow(1 + stepUp / 100, year - 1);
      } else {
        currentMonthlyAmount = P + (year - 1) * fixedStepUp;
      }
    }

    const monthlyAmount = Math.round(currentMonthlyAmount * 100) / 100;
    let annualContribution = 0;

    for (let month = 1; month <= 12; month++) {
      const absoluteMonth = (year - 1) * 12 + month;
      const remainingMonths = totalMonths - absoluteMonth;

      // Step-up SIP
      totalInvested += monthlyAmount;
      annualContribution += monthlyAmount;
      if (monthlyRate === 0) {
        maturityValue += monthlyAmount;
      } else {
        maturityValue += monthlyAmount * Math.pow(1 + monthlyRate, remainingMonths);
      }

      // Regular SIP
      regularTotal += P;
      if (monthlyRate === 0) {
        regularMaturity += P;
      } else {
        regularMaturity += P * Math.pow(1 + monthlyRate, remainingMonths);
      }
    }

    yearWiseData.push({
      year,
      monthlyAmount: Math.round(monthlyAmount),
      annualContribution: Math.round(annualContribution * 100) / 100,
      cumulativeInvested: Math.round(totalInvested * 100) / 100,
      estimatedValue: Math.round(maturityValue * 100) / 100,
      estimatedGains: Math.round((maturityValue - totalInvested) * 100) / 100,
    });
  }

  const estimatedReturns = maturityValue - totalInvested;
  const finalMonthlyAmount = currentMonthlyAmount;

  const comparison = compareWithRegular ? {
    regular: {
      totalInvested: Math.round(regularTotal * 100) / 100,
      maturityValue: Math.round(regularMaturity * 100) / 100,
      estimatedReturns: Math.round((regularMaturity - regularTotal) * 100) / 100,
    },
    stepUp: {
      totalInvested: Math.round(totalInvested * 100) / 100,
      maturityValue: Math.round(maturityValue * 100) / 100,
      estimatedReturns: Math.round(estimatedReturns * 100) / 100,
    },
    additionalWealth: Math.round((maturityValue - regularMaturity) * 100) / 100,
    additionalInvestment: Math.round((totalInvested - regularTotal) * 100) / 100,
  } : null;

  return {
    totalInvested: Math.round(totalInvested * 100) / 100,
    maturityValue: Math.round(maturityValue * 100) / 100,
    estimatedReturns: Math.round(estimatedReturns * 100) / 100,
    absoluteReturn: totalInvested > 0 ? Math.round((estimatedReturns / totalInvested) * 10000) / 100 : 0,
    finalMonthlyAmount: Math.round(finalMonthlyAmount),
    yearWiseData,
    comparison,
  };
};

export default {
  calculateStepUpSIP,
};
