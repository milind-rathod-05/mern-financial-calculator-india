import { describe, it, expect } from 'vitest';
import { calculateStepUpSIP } from '../utils/stepUpSipCalculations';
import { calculateSIP } from '../utils/sipCalculations';

describe('Step-Up SIP Calculator', () => {
  it('should calculate step-up SIP with percentage increase', () => {
    const result = calculateStepUpSIP({
      initialMonthlyAmount: 5000,
      annualReturn: 12,
      years: 15,
      stepUpRate: 10,
      stepUpType: 'percentage',
    });
    
    expect(result.totalInvested).toBeGreaterThan(0);
    expect(result.maturityValue).toBeGreaterThan(result.totalInvested);
    expect(result.finalMonthlyAmount).toBeGreaterThan(5000);
    // After 14 years of 10% step-up: 5000 * 1.1^14
    expect(result.finalMonthlyAmount).toBeCloseTo(5000 * Math.pow(1.1, 14), -2);
  });
  
  it('step-up SIP with 0% increase should match regular SIP', () => {
    const stepUpResult = calculateStepUpSIP({
      initialMonthlyAmount: 5000,
      annualReturn: 12,
      years: 10,
      stepUpRate: 0,
      stepUpType: 'percentage',
    });
    
    const regularResult = calculateSIP({
      monthlyInvestment: 5000,
      annualReturn: 12,
      years: 10,
    });
    
    expect(stepUpResult.totalInvested).toBeCloseTo(regularResult.totalInvested, 0);
    expect(stepUpResult.maturityValue).toBeCloseTo(regularResult.maturityValue, 0);
  });
  
  it('should calculate step-up SIP with fixed rupee increase', () => {
    const result = calculateStepUpSIP({
      initialMonthlyAmount: 5000,
      annualReturn: 12,
      years: 10,
      stepUpType: 'fixed',
      stepUpAmount: 1000,
    });
    
    expect(result.finalMonthlyAmount).toBe(5000 + 9 * 1000); // 14000
    expect(result.totalInvested).toBeGreaterThan(600000); // More than regular SIP
  });
  
  it('step-up SIP should have higher maturity than regular SIP', () => {
    const stepUpResult = calculateStepUpSIP({
      initialMonthlyAmount: 5000,
      annualReturn: 12,
      years: 15,
      stepUpRate: 10,
      stepUpType: 'percentage',
    });
    
    const regularResult = calculateSIP({
      monthlyInvestment: 5000,
      annualReturn: 12,
      years: 15,
    });
    
    expect(stepUpResult.maturityValue).toBeGreaterThan(regularResult.maturityValue);
    expect(stepUpResult.totalInvested).toBeGreaterThan(regularResult.totalInvested);
  });
  
  it('should provide comparison data when requested', () => {
    const result = calculateStepUpSIP({
      initialMonthlyAmount: 5000,
      annualReturn: 12,
      years: 10,
      stepUpRate: 10,
      compareWithRegular: true,
    });
    
    expect(result.comparison).not.toBeNull();
    expect(result.comparison.additionalWealth).toBeGreaterThan(0);
    expect(result.comparison.regular.maturityValue).toBeLessThan(result.comparison.stepUp.maturityValue);
  });
  
  it('should handle zero investment', () => {
    const result = calculateStepUpSIP({
      initialMonthlyAmount: 0,
      annualReturn: 12,
      years: 10,
      stepUpRate: 10,
    });
    expect(result.totalInvested).toBe(0);
    expect(result.maturityValue).toBe(0);
  });
  
  it('should generate correct year-wise data', () => {
    const result = calculateStepUpSIP({
      initialMonthlyAmount: 5000,
      annualReturn: 12,
      years: 5,
      stepUpRate: 10,
    });
    expect(result.yearWiseData).toHaveLength(5);
    // Monthly amount should increase each year
    for (let i = 1; i < result.yearWiseData.length; i++) {
      expect(result.yearWiseData[i].monthlyAmount).toBeGreaterThan(result.yearWiseData[i-1].monthlyAmount);
    }
  });
});
