import { describe, it, expect } from 'vitest';
import { calculateEMI, generateAmortization } from '../utils/loanCalculations';

describe('EMI Calculator', () => {
  it('should calculate EMI for standard home loan', () => {
    const result = calculateEMI({
      loanAmount: 5000000,
      annualRate: 8.5,
      years: 20,
    });
    
    expect(result.emi).toBeGreaterThan(43000);
    expect(result.emi).toBeLessThan(44000);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalPayment).toBeGreaterThan(result.principal);
  });
  
  it('should handle zero interest rate', () => {
    const result = calculateEMI({
      loanAmount: 1200000,
      annualRate: 0,
      years: 10,
    });
    
    expect(result.emi).toBe(10000); // 1200000 / 120 months
    expect(result.totalInterest).toBe(0);
    expect(result.totalPayment).toBe(1200000);
  });
  
  it('should return zero for zero loan amount', () => {
    const result = calculateEMI({
      loanAmount: 0,
      annualRate: 8.5,
      years: 20,
    });
    expect(result.emi).toBe(0);
  });
  
  it('should handle months along with years', () => {
    const result = calculateEMI({
      loanAmount: 1000000,
      annualRate: 10,
      years: 5,
      months: 6,
    });
    expect(result.tenure).toBe(66);
    expect(result.emi).toBeGreaterThan(0);
  });
  
  it('total payment should equal principal + interest', () => {
    const result = calculateEMI({
      loanAmount: 3000000,
      annualRate: 9,
      years: 15,
    });
    expect(result.totalPayment).toBeCloseTo(result.principal + result.totalInterest, 0);
  });
});

describe('Amortization Schedule', () => {
  it('should generate correct number of payments', () => {
    const result = generateAmortization({
      loanAmount: 1000000,
      annualRate: 10,
      years: 5,
    });
    
    expect(result.schedule).toHaveLength(60);
  });
  
  it('total principal should equal loan amount', () => {
    const result = generateAmortization({
      loanAmount: 1000000,
      annualRate: 10,
      years: 5,
    });
    
    const totalPrincipal = result.schedule.reduce((sum, row) => sum + row.principal + row.extraPayment, 0);
    expect(totalPrincipal).toBeCloseTo(1000000, 0);
  });
  
  it('closing balance of last payment should be zero', () => {
    const result = generateAmortization({
      loanAmount: 1000000,
      annualRate: 10,
      years: 5,
    });
    
    const lastPayment = result.schedule[result.schedule.length - 1];
    expect(lastPayment.closingBalance).toBeCloseTo(0, 0);
  });
  
  it('extra payments should reduce tenure', () => {
    const withExtra = generateAmortization({
      loanAmount: 1000000,
      annualRate: 10,
      years: 5,
      extraMonthlyPayment: 5000,
      prepaymentMode: 'reduce-tenure',
    });
    
    expect(withExtra.schedule.length).toBeLessThan(60);
    expect(withExtra.summary.monthsReduced).toBeGreaterThan(0);
    expect(withExtra.summary.interestSaved).toBeGreaterThan(0);
  });
  
  it('zero interest amortization should have equal principal payments', () => {
    const result = generateAmortization({
      loanAmount: 1200000,
      annualRate: 0,
      years: 10,
    });
    
    expect(result.schedule).toHaveLength(120);
    expect(result.schedule[0].principal).toBeCloseTo(10000, 0);
    expect(result.schedule[0].interest).toBe(0);
  });
  
  it('should generate yearly summary', () => {
    const result = generateAmortization({
      loanAmount: 1000000,
      annualRate: 10,
      years: 5,
    });
    
    expect(result.yearlySummary.length).toBeGreaterThan(0);
  });
  
  it('opening balance of payment n should equal closing balance of payment n-1', () => {
    const result = generateAmortization({
      loanAmount: 2000000,
      annualRate: 9,
      years: 10,
    });
    
    for (let i = 1; i < result.schedule.length; i++) {
      expect(result.schedule[i].openingBalance).toBeCloseTo(result.schedule[i-1].closingBalance, 0);
    }
  });
});
