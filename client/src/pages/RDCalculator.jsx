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
import { calculateRD } from '../utils/schemeCalculations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RDCalculator() {
  const { saveCalculation } = useSavedCalculations();
  const [saveStatus, setSaveStatus] = useState('');

  const [monthlyDeposit, setMonthlyDeposit] = useState(5000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(5);
  const [months, setMonths] = useState(0);
  const [compoundingFrequency, setCompoundingFrequency] = useState(4);
  const [taxRate, setTaxRate] = useState(0);

  const result = useMemo(() => {
    return calculateRD({
      monthlyDeposit: Number(monthlyDeposit) || 0,
      annualRate: Number(rate) || 0,
      years: Number(years) || 0,
      months: Number(months) || 0,
      compoundingFrequency: Number(compoundingFrequency) || 4,
      taxRate: Number(taxRate) || 0,
    });
  }, [monthlyDeposit, rate, years, months, compoundingFrequency, taxRate]);

  const pieData = useMemo(() => {
    return [
      { name: 'Total Deposits', value: result.totalDeposits },
      { name: 'Total Interest', value: result.totalInterest },
    ];
  }, [result]);

  const chartData = useMemo(() => {
    if (!result.growthData || result.growthData.length === 0) return [];
    return result.growthData.map((item) => ({
      period: `Month ${item.month}`,
      month: item.month,
      Deposits: item.totalDeposits,
      MaturityValue: item.estimatedValue,
      Interest: item.estimatedInterest,
    }));
  }, [result.growthData]);

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `Recurring Deposit (₹${(Number(monthlyDeposit) || 0).toLocaleString('en-IN')}/mo)`,
        type: 'rd',
        inputs: { monthlyDeposit, rate, years, months, compoundingFrequency, taxRate },
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
    if (result.growthData && result.growthData.length > 0) {
      const csvData = result.growthData.map((row) => ({
        Month: row.month,
        'Cumulative Deposit (₹)': row.totalDeposits,
        'Estimated Value (₹)': row.estimatedValue,
        'Accrued Interest (₹)': row.estimatedInterest,
      }));
      exportToCSV(csvData, 'rd_quarterly_growth');
    } else {
      const summaryData = [
        { Parameter: 'Monthly Deposit', Value: formatCurrency(result.monthlyDeposit) },
        { Parameter: 'Interest Rate', Value: formatPercent(rate) },
        { Parameter: 'Tenure', Value: `${years} Years ${months} Months` },
        { Parameter: 'Total Deposits', Value: formatCurrency(result.totalDeposits) },
        { Parameter: 'Maturity Value', Value: formatCurrency(result.maturityValue) },
        { Parameter: 'Total Interest', Value: formatCurrency(result.totalInterest) },
        { Parameter: 'Post-Tax Maturity', Value: formatCurrency(result.postTaxMaturity) },
      ];
      exportToCSV(summaryData, 'rd_summary');
    }
  };

  const handleExportPDF = () => {
    exportToPDF('rd-report', 'Recurring Deposit Calculation');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Deposit (RD) Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Calculate your RD maturity value, total deposits, and quarterly compounding interest.
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
              <CardTitle className="text-xl">RD Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Monthly Deposit */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="monthlyDeposit">Monthly Deposit</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(monthlyDeposit)}</span>
                </div>
                <Input
                  id="monthlyDeposit"
                  type="number"
                  min={500}
                  max={200000}
                  step={500}
                  value={monthlyDeposit}
                  onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={500}
                  max={100000}
                  step={500}
                  value={monthlyDeposit}
                  onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹500</span>
                  <span>₹1,00,000</span>
                </div>
              </div>

              {/* Annual Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="rate">Annual Interest Rate (%)</Label>
                  <span className="text-sm font-semibold text-primary">{rate}%</span>
                </div>
                <Input
                  id="rate"
                  type="number"
                  step="0.1"
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

              {/* Tenure Years & Months */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="years">Years</Label>
                  <Input
                    id="years"
                    type="number"
                    min={0}
                    max={10}
                    value={years}
                    onChange={(e) => setYears(Math.max(0, Number(e.target.value)))}
                  />
                  <input
                    type="range"
                    min={0}
                    max={10}
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
                  <option value={4}>Quarterly (Standard in India)</option>
                  <option value={12}>Monthly</option>
                  <option value={2}>Half-Yearly</option>
                  <option value={1}>Annually</option>
                </select>
              </div>

              {/* Tax Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="taxRate">Tax / TDS Rate (%)</Label>
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
                  <span>0%</span>
                  <span>10% (TDS)</span>
                  <span>30%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Results, Chart, Table */}
        <div className="lg:col-span-7 space-y-6" id="rd-report">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Maturity Value
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatCurrency(result.maturityValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Invested: {formatCurrency(result.totalDeposits)}
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
                  Interest Gain: {result.totalDeposits > 0 ? ((result.totalInterest / result.totalDeposits) * 100).toFixed(1) : 0}%
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
                  Post-Tax Maturity Value
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {formatCurrency(result.postTaxMaturity)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Net in-hand amount at maturity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Line Chart: Growth Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Growth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="period" />
                    <YAxis
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                      domain={['auto', 'auto']}
                    />
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="MaturityValue"
                      name="Maturity Value"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Deposits"
                      name="Deposits Made"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Table: Quarter-wise Growth */}
          {result.growthData && result.growthData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quarter-wise Growth Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-72 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground sticky top-0">
                      <tr>
                        <th className="p-2.5">Month</th>
                        <th className="p-2.5 text-right">Deposits Made</th>
                        <th className="p-2.5 text-right">Interest Accrued</th>
                        <th className="p-2.5 text-right">Estimated Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.growthData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/50">
                          <td className="p-2.5 font-medium">Month {row.month}</td>
                          <td className="p-2.5 text-right">{formatCurrency(row.totalDeposits)}</td>
                          <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(row.estimatedInterest)}
                          </td>
                          <td className="p-2.5 text-right font-semibold">{formatCurrency(row.estimatedValue)}</td>
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
                <p className="font-semibold">Important Notes on Recurring Deposits:</p>
                <p>
                  RD interest rates in India are typically compounded quarterly using the standard Indian Banks'
                  Association (IBA) formula. TDS applies if interest earned on bank deposits exceeds ₹40,000 per
                  fiscal year (₹50,000 for senior citizens).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
