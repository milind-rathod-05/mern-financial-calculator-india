import { describe, it, expect } from 'vitest';
import { generateAmortization } from '../utils/loanCalculations';

describe('Amortization Calculations - Advanced', () => {
  it('lump-sum prepayment should reduce balance', () => {
    const result = generateAmortization({
      loanAmount: 2000000,
      annualRate: 9,
      years: 15,
      prepayments: [{ month: 12, amount: 200000 }],
      prepaymentMode: 'reduce-tenure',
    });
    
    // After prepayment at month 12, balance should drop significantly
    const balanceBefore = result.schedule[10].closingBalance;
    const balanceAfter = result.schedule[12].closingBalance;
    expect(balanceBefore - balanceAfter).toBeGreaterThan(200000); // including regular principal
  });
  
  it('reduce-emi mode should keep same tenure but lower EMI', () => {
    const result = generateAmortization({
      loanAmount: 2000000,
      annualRate: 9,
      years: 10,
      prepayments: [{ month: 6, amount: 500000 }],
      prepaymentMode: 'reduce-emi',
    });
    
    // EMI after prepayment should be lower than before
    const emiBefore = result.schedule[4].emiAmount;
    const emiAfter = result.schedule[7].emiAmount;
    expect(emiAfter).toBeLessThan(emiBefore);
  });
  
  it('total interest with prepayment should be less than without', () => {
    const withoutPrepay = generateAmortization({
      loanAmount: 2000000,
      annualRate: 9,
      years: 15,
    });
    
    const withPrepay = generateAmortization({
      loanAmount: 2000000,
      annualRate: 9,
      years: 15,
      extraMonthlyPayment: 5000,
    });
    
    expect(withPrepay.summary.totalInterest).toBeLessThan(withoutPrepay.summary.totalInterest);
  });
  
  it('final payment should never exceed remaining balance + interest', () => {
    const result = generateAmortization({
      loanAmount: 500000,
      annualRate: 12,
      years: 3,
      extraMonthlyPayment: 2000,
    });
    
    const lastPayment = result.schedule[result.schedule.length - 1];
    const maxPayment = lastPayment.openingBalance * (1 + 12/100/12) + lastPayment.openingBalance;
    expect(lastPayment.emiAmount + lastPayment.extraPayment).toBeLessThanOrEqual(maxPayment);
  });
  
  it('summary totals should reconcile with schedule', () => {
    const result = generateAmortization({
      loanAmount: 1000000,
      annualRate: 10,
      years: 5,
    });
    
    const totalPrincipal = result.schedule.reduce((sum, row) => sum + row.principal, 0);
    const totalInterest = result.schedule.reduce((sum, row) => sum + row.interest, 0);
    
    expect(result.summary.totalPrincipal).toBeCloseTo(totalPrincipal, 0);
    expect(result.summary.totalInterest).toBeCloseTo(totalInterest, 0);
  });
});
