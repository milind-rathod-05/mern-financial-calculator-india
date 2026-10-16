import { describe, it, expect } from 'vitest';
import { CALCULATOR_LIST } from '../pages/Dashboard';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Dashboard from '../pages/Dashboard';

describe('Layout and Navigation Components', () => {
  it('Layout component should be a valid React component function', () => {
    expect(typeof Layout).toBe('function');
  });

  it('Header component should be a valid React component function', () => {
    expect(typeof Header).toBe('function');
  });

  it('Sidebar component should be a valid React component function', () => {
    expect(typeof Sidebar).toBe('function');
  });

  it('Dashboard component should be a valid React component function', () => {
    expect(typeof Dashboard).toBe('function');
  });

  it('CALCULATOR_LIST contains all 22 required financial calculators', () => {
    expect(CALCULATOR_LIST.length).toBe(22);
  });

  it('Every calculator in CALCULATOR_LIST has valid properties', () => {
    const validCategories = ['Investments', 'Retirement', 'Loans', 'Tools', 'Compare'];
    const seenIds = new Set();
    const seenPaths = new Set();

    CALCULATOR_LIST.forEach((calc) => {
      expect(calc.id).toBeTruthy();
      expect(calc.name).toBeTruthy();
      expect(calc.description).toBeTruthy();
      expect(calc.icon).toBeTruthy();
      expect(calc.path).toBeTruthy();
      expect(calc.path.startsWith('/')).toBe(true);
      expect(validCategories).toContain(calc.category);

      expect(seenIds.has(calc.id)).toBe(false);
      expect(seenPaths.has(calc.path)).toBe(false);
      seenIds.add(calc.id);
      seenPaths.add(calc.path);
    });
  });

  it('Includes essential Indian instruments: SIP, Step-Up SIP, PPF, SSA, EPF, NPS, FD, RD, Home Loan', () => {
    const ids = CALCULATOR_LIST.map((c) => c.id);
    expect(ids).toContain('sip');
    expect(ids).toContain('advanced-sip');
    expect(ids).toContain('ppf');
    expect(ids).toContain('ssa');
    expect(ids).toContain('epf');
    expect(ids).toContain('nps');
    expect(ids).toContain('fd');
    expect(ids).toContain('rd');
    expect(ids).toContain('home-loan');
    expect(ids).toContain('emi');
  });
});
