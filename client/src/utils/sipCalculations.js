/**
 * SIP Future Value using ordinary annuity formula:
 * FV = P × [((1 + r)^n - 1) / r] 
 * where P = periodic investment, r = periodic rate, n = number of periods
 * 
 * For zero rate: FV = P × n
 */
export const calculateSIP = ({
  monthlyInvestment,
  annualReturn,
  years,
  months = 0,
  frequency = 'monthly',
}) => {
  // Validate inputs
  const P = Number(monthlyInvestment) || 0;
  const annualRate = Number(annualReturn) || 0;
  const totalYears = Number(years) || 0;
  const totalMonths = Number(months) || 0;

  if (P <= 0 || (totalYears <= 0 && totalMonths <= 0)) {
    return {
      totalInvested: 0,
      estimatedReturns: 0,
      maturityValue: 0,
      absoluteReturn: 0,
      annualizedReturn: annualRate,
      yearWiseData: [],
      frequency,
      periodicInvestment: 0,
      totalPeriods: 0,
    };
  }

  // Determine periods and periodic rate based on frequency
  let periodsPerYear;
  let periodicInvestment;
  switch (frequency) {
    case 'quarterly':
      periodsPerYear = 4;
      periodicInvestment = P * 3; // quarterly amount
      break;
    case 'yearly':
      periodsPerYear = 1;
      periodicInvestment = P * 12;
      break;
    default: // monthly
      periodsPerYear = 12;
      periodicInvestment = P;
  }

  const totalPeriods = Math.round(totalYears * periodsPerYear + totalMonths * (periodsPerYear / 12));
  if (totalPeriods <= 0) {
    return {
      totalInvested: 0,
      estimatedReturns: 0,
      maturityValue: 0,
      absoluteReturn: 0,
      annualizedReturn: annualRate,
      yearWiseData: [],
      frequency,
      periodicInvestment,
      totalPeriods: 0,
    };
  }

  const periodicRate = annualRate / 100 / periodsPerYear;

  let maturityValue;
  if (periodicRate === 0) {
    maturityValue = periodicInvestment * totalPeriods;
  } else {
    maturityValue = periodicInvestment * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate);
  }

  const totalInvested = periodicInvestment * totalPeriods;
  const estimatedReturns = maturityValue - totalInvested;
  const absoluteReturn = totalInvested > 0 ? (estimatedReturns / totalInvested) * 100 : 0;

  // Year-wise breakdown
  const yearWiseData = [];
  const totalYearsCalc = Math.ceil((totalYears * 12 + totalMonths) / 12);

  for (let y = 1; y <= totalYearsCalc; y++) {
    const periodsThisYear = Math.min(y * periodsPerYear, totalPeriods);
    let valueAtYear;
    if (periodicRate === 0) {
      valueAtYear = periodicInvestment * periodsThisYear;
    } else {
      valueAtYear = periodicInvestment * ((Math.pow(1 + periodicRate, periodsThisYear) - 1) / periodicRate);
    }
    const investedAtYear = periodicInvestment * periodsThisYear;
    yearWiseData.push({
      year: y,
      invested: Math.round(investedAtYear * 100) / 100,
      value: Math.round(valueAtYear * 100) / 100,
      gains: Math.round((valueAtYear - investedAtYear) * 100) / 100,
    });
  }

  return {
    totalInvested: Math.round(totalInvested * 100) / 100,
    estimatedReturns: Math.round(estimatedReturns * 100) / 100,
    maturityValue: Math.round(maturityValue * 100) / 100,
    absoluteReturn: Math.round(absoluteReturn * 100) / 100,
    annualizedReturn: annualRate,
    yearWiseData,
    frequency,
    periodicInvestment,
    totalPeriods,
  };
};

export default {
  calculateSIP,
};
