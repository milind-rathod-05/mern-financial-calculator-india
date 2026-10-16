import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { formatCurrency, formatPercent } from '../utils/currencyFormatter';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { useSavedCalculations } from '../contexts/SavedCalculationsContext';
import { Info, Download, Save, CheckCircle2 } from 'lucide-react';
import { calculateFD } from '../utils/schemeCalculations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function FDCalculator() {
  const { saveCalculation } = useSavedCalculations();
  const [saveStatus, setSaveStatus] = useState('');

  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(5);
  const [months, setMonths] = useState(0);
  const [compoundingFrequency, setCompoundingFrequency] = useState(4);
  const [payoutOption, setPayoutOption] = useState('cumulative');
  const [taxRate, setTaxRate] = useState(0);

  const result = useMemo(() => {
    return calculateFD({
      principal: Number(principal) || 0,
      annualRate: Number(rate) || 0,
      years: Number(years) || 0,
      months: Number(months) || 0,
      compoundingFrequency: Number(compoundingFrequency) || 4,
      payoutOption,
      taxRate: Number(taxRate) || 0,
    });
  }, [principal, rate, years, months, compoundingFrequency, payoutOption, taxRate]);

  const pieData = useMemo(() => {
    if (taxRate > 0) {
      return [
        { name: 'Principal Amount', value: result.principal },
        { name: 'Post-Tax Interest', value: result.postTaxInterest },
        { name: 'Tax Deducted', value: result.taxAmount },
      ];
    }
    return [
      { name: 'Principal Amount', value: result.principal },
      { name: 'Total Interest', value: result.totalInterest },
    ];
  }, [result, taxRate]);

  const yearlyBreakdown = useMemo(() => {
    const data = [];
    const totalTenure = Number(years) + Number(months) / 12;
    if (totalTenure <= 0) return data;
    const r = (Number(rate) || 0) / 100;
    const n = Number(compoundingFrequency) || 4;
    const fullYears = Math.ceil(totalTenure);

    for (let y = 1; y <= fullYears; y++) {
      const curTenure = Math.min(y, totalTenure);
      let val;
      if (payoutOption === 'cumulative') {
        val = (Number(principal) || 0) * Math.pow(1 + r / n, n * curTenure);
      } else {
        val = Number(principal) || 0;
      }
      const accruedInt = payoutOption === 'cumulative' 
        ? val - (Number(principal) || 0) 
        : (Number(principal) || 0) * r * curTenure;
      data.push({
        year: `Year ${y}`,
        principal: Number(principal) || 0,
        interest: Math.round(accruedInt),
        balance: Math.round(val),
      });
    }
    return data;
  }, [principal, rate, years, months, compoundingFrequency, payoutOption]);

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `Fixed Deposit (₹${(Number(principal) || 0).toLocaleString('en-IN')})`,
        type: 'fd',
        inputs: { principal, rate, years, months, compoundingFrequency, payoutOption, taxRate },
        results: result,
      });
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch {
      setSaveStatus('Failed to save');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleExportCSV = () => {
    const exportData = [
      { Parameter: 'Principal Amount', Value: formatCurrency(result.principal) },
      { Parameter: 'Interest Rate', Value: formatPercent(rate) },
      { Parameter: 'Tenure', Value: `${years} Years ${months} Months` },
      { Parameter: 'Compounding Frequency', Value: `${compoundingFrequency} times/year` },
      { Parameter: 'Payout Option', Value: payoutOption },
      { Parameter: 'Tax Rate', Value: formatPercent(taxRate) },
      { Parameter: 'Maturity Value', Value: formatCurrency(result.maturityValue) },
      { Parameter: 'Total Interest', Value: formatCurrency(result.totalInterest) },
      { Parameter: 'Tax Amount', Value: formatCurrency(result.taxAmount) },
      { Parameter: 'Post-Tax Interest', Value: formatCurrency(result.postTaxInterest) },
      { Parameter: 'Post-Tax Maturity', Value: formatCurrency(result.postTaxMaturity) },
      ...(payoutOption === 'cumulative'
        ? [{ Parameter: 'Effective Annual Yield', Value: formatPercent(result.effectiveAnnualYield) }]
        : [{ Parameter: 'Periodic Payout', Value: formatCurrency(result.periodicPayout) }]),
    ];
    exportToCSV(exportData, 'fd_calculation');
  };

  const handleExportPDF = () => {
    exportToPDF('fd-report', 'Fixed Deposit Calculation');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fixed Deposit (FD) Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Calculate your FD maturity amount, total interest earned, and post-tax returns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5">
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex items-center gap-1.5">
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button size="sm" onClick={handleSave} className="flex items-center gap-1.5">
            {saveStatus ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            {saveStatus || 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Investment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Principal Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="principal">Principal Deposit</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(principal)}</span>
                </div>
                <Input
                  id="principal"
                  type="number"
                  min={1000}
                  max={10000000}
                  step={5000}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={5000}
                  max={5000000}
                  step={5000}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹5,000</span>
                  <span>₹50 Lakh</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="rate">Annual Interest Rate (%)</Label>
                  <span className="text-sm font-semibold text-primary">{rate}%</span>
                </div>
                <Input
                  id="rate"
                  type="number"
                  step="0.05"
                  min={1}
                  max={15}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={2}
                  max={12}
                  step={0.1}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2%</span>
                  <span>12%</span>
                </div>
              </div>

              {/* Tenure Years and Months */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="years">Years</Label>
                  <Input
                    id="years"
                    type="number"
                    min={0}
                    max={25}
                    value={years}
                    onChange={(e) => setYears(Math.max(0, Number(e.target.value)))}
                  />
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="months">Months</Label>
                  <Input
                    id="months"
                    type="number"
                    min={0}
                    max={11}
                    value={months}
                    onChange={(e) => setMonths(Math.max(0, Math.min(11, Number(e.target.value))))}
                  />
                  <input
                    type="range"
                    min={0}
                    max={11}
                    step={1}
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Compounding Frequency */}
              <div className="space-y-2">
                <Label htmlFor="compoundingFrequency">Compounding Frequency</Label>
                <select
                  id="compoundingFrequency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={compoundingFrequency}
                  onChange={(e) => setCompoundingFrequency(Number(e.target.value))}
                >
                  <option value={4}>Quarterly (Standard Indian Banks)</option>
                  <option value={12}>Monthly</option>
                  <option value={2}>Half-Yearly</option>
                  <option value={1}>Annually</option>
                </select>
              </div>

              {/* Payout Option */}
              <div className="space-y-2">
                <Label htmlFor="payoutOption">Payout Option</Label>
                <select
                  id="payoutOption"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={payoutOption}
                  onChange={(e) => setPayoutOption(e.target.value)}
                >
                  <option value="cumulative">Cumulative (At Maturity)</option>
                  <option value="monthly">Monthly Payout</option>
                  <option value="quarterly">Quarterly Payout</option>
                  <option value="half-yearly">Half-Yearly Payout</option>
                  <option value="yearly">Yearly Payout</option>
                </select>
              </div>

              {/* Tax / TDS Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="taxRate">Applicable Tax / TDS Rate (%)</Label>
                  <span className="text-sm font-semibold text-primary">{taxRate}%</span>
                </div>
                <Input
                  id="taxRate"
                  type="number"
                  min={0}
                  max={35}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Math.max(0, Math.min(35, Number(e.target.value))))}
                />
                <input
                  type="range"
                  min={0}
                  max={35}
                  step={1}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0% (No TDS)</span>
                  <span>10% (TDS)</span>
                  <span>30% (High Slab)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Results & Visuals */}
        <div className="lg:col-span-7 space-y-6" id="fd-report">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  {payoutOption === 'cumulative' ? 'Total Maturity Value' : 'Principal Returned'}
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatCurrency(result.maturityValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Invested: {formatCurrency(result.principal)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Total Interest Earned
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(result.totalInterest)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {payoutOption === 'cumulative'
                    ? `Effective Yield: ${formatPercent(result.effectiveAnnualYield)}`
                    : `Payout: ${formatCurrency(result.periodicPayout)} / ${payoutOption}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Post-Tax Interest
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {formatCurrency(result.postTaxInterest)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tax Deducted: {formatCurrency(result.taxAmount)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Post-Tax Maturity
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {formatCurrency(result.postTaxMaturity)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Net in-hand value after taxes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Yearly Growth Table */}
          {yearlyBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yearly Balance Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="p-2.5 rounded-l">Period</th>
                        <th className="p-2.5 text-right">Principal</th>
                        <th className="p-2.5 text-right">Interest Accrued</th>
                        <th className="p-2.5 text-right rounded-r">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {yearlyBreakdown.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/50">
                          <td className="p-2.5 font-medium">{row.year}</td>
                          <td className="p-2.5 text-right">{formatCurrency(row.principal)}</td>
                          <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(row.interest)}
                          </td>
                          <td className="p-2.5 text-right font-semibold">{formatCurrency(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4 flex gap-3 text-amber-900 dark:text-amber-200">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">Important Notes on Bank Fixed Deposits:</p>
                <p>
                  Interest rates, compounding conventions, and special senior citizen rates (usually +0.50%)
                  vary by bank. TDS is deducted at 10% under Section 194A if interest income across bank branches
                  exceeds ₹40,000 (₹50,000 for senior citizens) in a financial year without submitting Form 15G/15H.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
