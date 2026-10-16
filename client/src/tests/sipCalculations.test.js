import { describe, it, expect } from 'vitest';
import { calculateSIP } from '../utils/sipCalculations';

describe('SIP Calculator', () => {
  it('should calculate basic monthly SIP correctly', () => {
    const result = calculateSIP({
      monthlyInvestment: 5000,
      annualReturn: 12,
      years: 10,
    });
    
    expect(result.totalInvested).toBe(600000);
    expect(result.maturityValue).toBeGreaterThan(1100000);
    expect(result.maturityValue).toBeLessThan(1200000);
    expect(result.estimatedReturns).toBe(result.maturityValue - result.totalInvested);
  });
  
  it('should return zero for zero investment', () => {
    const result = calculateSIP({
      monthlyInvestment: 0,
      annualReturn: 12,
      years: 10,
    });
    expect(result.totalInvested).toBe(0);
    expect(result.maturityValue).toBe(0);
  });
  
  it('should handle zero return rate', () => {
    const result = calculateSIP({
      monthlyInvestment: 10000,
      annualReturn: 0,
      years: 5,
    });
    expect(result.totalInvested).toBe(600000);
    expect(result.maturityValue).toBe(600000);
    expect(result.estimatedReturns).toBe(0);
  });
  
  it('should handle months along with years', () => {
    const result = calculateSIP({
      monthlyInvestment: 10000,
      annualReturn: 12,
      years: 2,
      months: 6,
    });
    expect(result.totalInvested).toBe(300000);
    expect(result.maturityValue).toBeGreaterThan(300000);
  });
  
  it('should calculate quarterly SIP', () => {
    const result = calculateSIP({
      monthlyInvestment: 5000,
      annualReturn: 12,
      years: 10,
      frequency: 'quarterly',
    });
    expect(result.totalInvested).toBe(600000);
    expect(result.maturityValue).toBeGreaterThan(1000000);
  });
  
  it('should generate correct year-wise data', () => {
    const result = calculateSIP({
      monthlyInvestment: 5000,
      annualReturn: 12,
      years: 5,
    });
    expect(result.yearWiseData).toHaveLength(5);
    expect(result.yearWiseData[0].year).toBe(1);
    expect(result.yearWiseData[4].year).toBe(5);
    // Each year's value should be greater than previous
    for (let i = 1; i < result.yearWiseData.length; i++) {
      expect(result.yearWiseData[i].value).toBeGreaterThan(result.yearWiseData[i-1].value);
    }
  });
  
  it('should calculate absolute return correctly', () => {
    const result = calculateSIP({
      monthlyInvestment: 5000,
      annualReturn: 12,
      years: 10,
    });
    const expectedAbsReturn = ((result.estimatedReturns / result.totalInvested) * 100);
    expect(result.absoluteReturn).toBeCloseTo(expectedAbsReturn, 0);
  });
});
