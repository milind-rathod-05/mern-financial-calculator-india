import { describe, it, expect } from 'vitest';
import { calculatePPF, calculateSSA, calculateFD, calculateRD, calculateEPF, calculateNPS } from '../utils/schemeCalculations';

describe('PPF Calculator', () => {
  it('should calculate 15-year PPF maturity', () => {
    const result = calculatePPF({
      annualContribution: 150000,
      interestRate: 7.1,
      years: 15,
      contributionSchedule: 'yearly-start',
    });
    expect(result.totalContributions).toBe(2250000);
    expect(result.maturityValue).toBeGreaterThan(2250000);
    expect(result.yearWiseData).toHaveLength(15);
  });
  
  it('should cap contribution at ₹1,50,000', () => {
    const result = calculatePPF({
      annualContribution: 200000, // should be capped
      interestRate: 7.1,
      years: 15,
    });
    expect(result.totalContributions).toBe(2250000); // 150000 * 15
  });
});

describe('FD Calculator', () => {
  it('should calculate cumulative FD', () => {
    const result = calculateFD({
      principal: 100000,
      annualRate: 7,
      years: 5,
      compoundingFrequency: 4,
      payoutOption: 'cumulative',
    });
    // 100000 * (1 + 0.07/4)^(4*5)
    expect(result.maturityValue).toBeCloseTo(141478.28, 0);
  });
  
  it('should calculate non-cumulative FD periodic payout', () => {
    const result = calculateFD({
      principal: 100000,
      annualRate: 7,
      years: 1,
      payoutOption: 'quarterly',
    });
    expect(result.periodicPayout).toBeCloseTo(1750, 0); // 100000 * 7% / 4
    expect(result.maturityValue).toBe(100000); // principal returned
  });
});

describe('RD Calculator', () => {
  it('should calculate RD maturity', () => {
    const result = calculateRD({
      monthlyDeposit: 5000,
      annualRate: 7,
      years: 5,
    });
    expect(result.totalDeposits).toBe(300000);
    expect(result.maturityValue).toBeGreaterThan(300000);
  });
});

describe('NPS Calculator', () => {
  it('should calculate NPS corpus', () => {
    const result = calculateNPS({
      monthlyContribution: 5000,
      annualReturn: 10,
      years: 30,
    });
    expect(result.totalInvested).toBe(1800000);
    expect(result.totalCorpus).toBeGreaterThan(result.totalInvested);
    expect(result.estimatedMonthlyPension).toBeGreaterThan(0);
  });
});
