import { describe, it, expect } from 'vitest';
import {
  calculateLumpsum,
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateInflation,
  calculateGoalInvestment,
  calculateGold,
  calculateCAGR,
  calculateXIRR,
} from '../utils/financialCalculations';

describe('Lumpsum Calculator', () => {
  it('should calculate compound growth correctly', () => {
    const result = calculateLumpsum({ principal: 100000, annualReturn: 12, years: 10 });
    // 100000 * (1.12)^10 = ~310584.82
    expect(result.maturityValue).toBeCloseTo(310584.82, 0);
    expect(result.invested).toBe(100000);
  });
  
  it('should handle zero return', () => {
    const result = calculateLumpsum({ principal: 100000, annualReturn: 0, years: 10 });
    expect(result.maturityValue).toBe(100000);
    expect(result.returns).toBe(0);
  });
});

describe('Simple Interest', () => {
  it('should calculate correctly', () => {
    const result = calculateSimpleInterest({ principal: 100000, rate: 8, years: 5 });
    expect(result.interest).toBe(40000);
    expect(result.maturityAmount).toBe(140000);
  });
});

describe('Compound Interest', () => {
  it('should calculate with monthly compounding', () => {
    const result = calculateCompoundInterest({
      principal: 100000,
      rate: 12,
      years: 5,
      compoundingFrequency: 12,
    });
    // 100000 * (1 + 0.01)^60
    expect(result.maturityAmount).toBeCloseTo(181669.67, 0);
  });
  
  it('should calculate effective annual rate', () => {
    const result = calculateCompoundInterest({
      principal: 100000,
      rate: 12,
      years: 1,
      compoundingFrequency: 12,
    });
    // (1 + 0.12/12)^12 - 1 = ~12.68%
    expect(result.effectiveAnnualRate).toBeCloseTo(12.68, 0);
  });
});

describe('Inflation Calculator', () => {
  it('should calculate future cost', () => {
    const result = calculateInflation({ currentAmount: 100000, inflationRate: 6, years: 10, mode: 'future-cost' });
    expect(result.futureAmount).toBeCloseTo(179084.77, 0);
  });
  
  it('should calculate present value', () => {
    const result = calculateInflation({ currentAmount: 179085, inflationRate: 6, years: 10, mode: 'present-value' });
    expect(result.presentValue).toBeCloseTo(100000, 0);
  });
});

describe('CAGR Calculator', () => {
  it('should calculate CAGR correctly', () => {
    const result = calculateCAGR({ initialValue: 100000, finalValue: 200000, years: 5 });
    // (200000/100000)^(1/5) - 1 = ~14.87%
    expect(result.cagr).toBeCloseTo(14.87, 0);
  });
  
  it('should handle doubling in known period', () => {
    const result = calculateCAGR({ initialValue: 100000, finalValue: 200000, years: 6 });
    // Rule of 72: ~12%
    expect(result.cagr).toBeCloseTo(12.25, 0);
  });
});

describe('XIRR Calculator', () => {
  it('should calculate XIRR for simple investment', () => {
    const result = calculateXIRR([
      { date: '2020-01-01', amount: -100000 },
      { date: '2021-01-01', amount: 112000 },
    ]);
    expect(result.error).toBeNull();
    expect(result.xirr).toBeCloseTo(12, 0);
  });
  
  it('should handle multiple cash flows', () => {
    const result = calculateXIRR([
      { date: '2020-01-01', amount: -100000 },
      { date: '2020-07-01', amount: -50000 },
      { date: '2021-01-01', amount: 170000 },
    ]);
    expect(result.error).toBeNull();
    expect(result.xirr).toBeGreaterThan(0);
  });
  
  it('should return error for invalid cash flows', () => {
    const result = calculateXIRR([
      { date: '2020-01-01', amount: 100000 },
      { date: '2021-01-01', amount: 50000 },
    ]);
    expect(result.error).not.toBeNull();
  });
  
  it('should require at least 2 cash flows', () => {
    const result = calculateXIRR([{ date: '2020-01-01', amount: -100000 }]);
    expect(result.error).not.toBeNull();
  });
});

describe('Goal-Based Investment', () => {
  it('should calculate SIP and lumpsum needed', () => {
    const result = calculateGoalInvestment({
      targetAmount: 1000000,
      currentSavings: 0,
      years: 10,
      expectedReturn: 12,
    });
    expect(result.monthlySIPNeeded).toBeGreaterThan(0);
    expect(result.lumpsumNeeded).toBeGreaterThan(0);
    expect(result.lumpsumNeeded).toBeLessThan(result.targetAmount);
  });
});

describe('Gold Calculator', () => {
  it('should calculate profit correctly', () => {
    const result = calculateGold({
      investmentType: 'weight',
      goldWeight: 10,
      purchasePrice: 5000,
      currentPrice: 6000,
    });
    expect(result.profitLoss).toBe(10000);
    expect(result.returnPercent).toBe(20);
  });
});
