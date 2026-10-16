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
import { calculateCompoundInterest } from '../utils/financialCalculations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CompoundInterestCalculator() {
  const { saveCalculation } = useSavedCalculations();
  const [saveStatus, setSaveStatus] = useState('');

  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const [compoundingFrequency, setCompoundingFrequency] = useState(12);
  const [periodicContribution, setPeriodicContribution] = useState(0);
  const [contributionFrequency, setContributionFrequency] = useState(12);

  const result = useMemo(() => {
    return calculateCompoundInterest({
      principal: Number(principal) || 0,
      rate: Number(rate) || 0,
      years: Number(years) || 0,
      compoundingFrequency: Number(compoundingFrequency) || 12,
      periodicContribution: Number(periodicContribution) || 0,
      contributionFrequency: Number(contributionFrequency) || 12,
    });
  }, [principal, rate, years, compoundingFrequency, periodicContribution, contributionFrequency]);

  const pieData = useMemo(() => {
    return [
      { name: 'Total Contributions', value: result.totalContributions },
      { name: 'Total Interest', value: result.totalInterest },
    ];
  }, [result]);

  const trajectoryData = useMemo(() => {
    const list = [];
    const t = Number(years) || 0;
    for (let y = 1; y <= t; y++) {
      const interim = calculateCompoundInterest({
        principal: Number(principal) || 0,
        rate: Number(rate) || 0,
        years: y,
        compoundingFrequency: Number(compoundingFrequency) || 12,
        periodicContribution: Number(periodicContribution) || 0,
        contributionFrequency: Number(contributionFrequency) || 12,
      });
      list.push({
        year: `Year ${y}`,
        yearNum: y,
        contributions: interim.totalContributions,
        interest: interim.totalInterest,
        maturityAmount: interim.maturityAmount,
      });
    }
    return list;
  }, [principal, rate, years, compoundingFrequency, periodicContribution, contributionFrequency]);

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `Compound Interest (₹${(Number(principal) || 0).toLocaleString('en-IN')})`,
        type: 'compound-interest',
        inputs: {
          principal,
          rate,
          years,
          compoundingFrequency,
          periodicContribution,
          contributionFrequency,
        },
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
    const csvData = trajectoryData.map((row) => ({
      Year: row.yearNum,
      'Total Invested (₹)': row.contributions,
      'Total Interest (₹)': row.interest,
      'Maturity Balance (₹)': row.maturityAmount,
    }));
    exportToCSV(csvData, 'compound_interest_schedule');
  };

  const handleExportPDF = () => {
    exportToPDF('ci-report', 'Compound Interest Calculation');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compound Interest Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Harness the power of compounding frequency and periodic additions to accelerate wealth growth.
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
              <CardTitle className="text-xl">Investment Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Initial Principal */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="principal">Initial Principal</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(principal)}</span>
                </div>
                <Input
                  id="principal"
                  type="number"
                  min={0}
                  max={10000000}
                  step={5000}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={0}
                  max={2000000}
                  step={5000}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
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
                  min={0.1}
                  max={30}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={0.1}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Duration Years */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="years">Investment Horizon (Years)</Label>
                  <span className="text-sm font-semibold text-primary">{years} Years</span>
                </div>
                <Input
                  id="years"
                  type="number"
                  min={1}
                  max={50}
                  value={years}
                  onChange={(e) => setYears(Math.max(1, Number(e.target.value)))}
                />
                <input
                  type="range"
                  min={1}
                  max={35}
                  step={1}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
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
                  <option value={12}>Monthly (12 times/year)</option>
                  <option value={4}>Quarterly (4 times/year)</option>
                  <option value={2}>Half-Yearly (2 times/year)</option>
                  <option value={1}>Annually (1 time/year)</option>
                  <option value={365}>Daily (365 times/year)</option>
                </select>
              </div>

              {/* Periodic Contribution */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="periodicContribution">Periodic Contribution (Optional)</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(periodicContribution)}</span>
                </div>
                <Input
                  id="periodicContribution"
                  type="number"
                  min={0}
                  max={1000000}
                  step={500}
                  value={periodicContribution}
                  onChange={(e) => setPeriodicContribution(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={500}
                  value={periodicContribution}
                  onChange={(e) => setPeriodicContribution(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Contribution Frequency */}
              {periodicContribution > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="contributionFrequency">Contribution Frequency</Label>
                  <select
                    id="contributionFrequency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={contributionFrequency}
                    onChange={(e) => setContributionFrequency(Number(e.target.value))}
                  >
                    <option value={12}>Monthly</option>
                    <option value={4}>Quarterly</option>
                    <option value={2}>Half-Yearly</option>
                    <option value={1}>Annually</option>
                  </select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Results & Visuals */}
        <div className="lg:col-span-7 space-y-6" id="ci-report">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Maturity Amount
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatCurrency(result.maturityAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Effective Annual Rate (EAR): {formatPercent(result.effectiveAnnualRate)}
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
                  Gain: {result.totalContributions > 0 ? ((result.totalInterest / result.totalContributions) * 100).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Total Contributions
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {formatCurrency(result.totalContributions)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Initial {formatCurrency(principal)} + Additions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Compounding Impact
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {result.totalContributions > 0
                    ? `${(result.maturityAmount / result.totalContributions).toFixed(2)}x`
                    : '1x'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Multiplier on invested capital
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pie Chart: Contributions vs Interest */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contributions vs Compounded Interest</CardTitle>
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
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Growth Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trajectoryData} margin={{ top: 10, right: 15, left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" />
                    <YAxis
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                      domain={['auto', 'auto']}
                    />
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="maturityAmount"
                      name="Maturity Value"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="contributions"
                      name="Total Contributions"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          {trajectoryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yearly Compounding Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground sticky top-0">
                      <tr>
                        <th className="p-2.5">Year</th>
                        <th className="p-2.5 text-right">Invested Capital</th>
                        <th className="p-2.5 text-right">Accrued Interest</th>
                        <th className="p-2.5 text-right">Total Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {trajectoryData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/50">
                          <td className="p-2.5 font-medium">{row.year}</td>
                          <td className="p-2.5 text-right">{formatCurrency(row.contributions)}</td>
                          <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(row.interest)}
                          </td>
                          <td className="p-2.5 text-right font-semibold">{formatCurrency(row.maturityAmount)}</td>
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
                <p className="font-semibold">Compound Interest Mechanism:</p>
                <p>
                  Calculated using A = P × (1 + r/n)^(n*t) alongside annuity formulas for regular contributions.
                  More frequent compounding periods (such as daily or monthly) increase the Effective Annual Rate (EAR)
                  compared to the nominal annual percentage rate.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
