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
import { calculateNPS } from '../utils/schemeCalculations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function NPSCalculator() {
  const { saveCalculation } = useSavedCalculations();
  const [saveStatus, setSaveStatus] = useState('');

  const [monthlyContribution, setMonthlyContribution] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(10);
  const [duration, setDuration] = useState(30);
  const [annuityAllocation, setAnnuityAllocation] = useState(40);
  const [assumedAnnuityRate, setAssumedAnnuityRate] = useState(6);

  const result = useMemo(() => {
    return calculateNPS({
      monthlyContribution: Number(monthlyContribution) || 0,
      annualReturn: Number(expectedReturn) || 0,
      years: Number(duration) || 0,
      annuityPercent: Math.max(40, Number(annuityAllocation) || 40),
      annuityRate: Number(assumedAnnuityRate) || 6,
    });
  }, [monthlyContribution, expectedReturn, duration, annuityAllocation, assumedAnnuityRate]);

  // Pie Chart 1: Invested vs Wealth Gained
  const investedVsGainData = useMemo(() => {
    return [
      { name: 'Total Invested', value: result.totalInvested },
      { name: 'Wealth Gained', value: result.wealthGained },
    ];
  }, [result]);

  // Pie Chart 2: Lump Sum Withdrawal vs Annuity Purchase
  const withdrawalVsAnnuityData = useMemo(() => {
    return [
      { name: 'Lump Sum Withdrawal (Tax-free)', value: result.lumpSumWithdrawal },
      { name: 'Annuity Corpus (Pension)', value: result.annuityPurchase },
    ];
  }, [result]);

  // Year-by-year accumulation trajectory for visualization
  const trajectoryData = useMemo(() => {
    const list = [];
    const P = Number(monthlyContribution) || 0;
    const r = (Number(expectedReturn) || 0) / 100 / 12;
    const totalYears = Number(duration) || 0;
    const step = totalYears <= 15 ? 1 : Math.ceil(totalYears / 10);

    for (let y = 1; y <= totalYears; y += (y + step > totalYears && y !== totalYears ? totalYears - y : step)) {
      const months = y * 12;
      const invested = P * months;
      let val = 0;
      if (r === 0) {
        val = invested;
      } else {
        val = P * ((Math.pow(1 + r, months) - 1) / r);
      }
      list.push({
        year: `Yr ${y}`,
        Invested: Math.round(invested),
        Corpus: Math.round(val),
      });
      if (y === totalYears) break;
    }
    return list;
  }, [monthlyContribution, expectedReturn, duration]);

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `NPS Pension Plan (₹${(Number(monthlyContribution) || 0).toLocaleString('en-IN')}/mo)`,
        type: 'nps',
        inputs: {
          monthlyContribution,
          expectedReturn,
          duration,
          annuityAllocation,
          assumedAnnuityRate,
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
    const csvData = [
      { Parameter: 'Monthly Contribution', Value: formatCurrency(monthlyContribution) },
      { Parameter: 'Expected Annual Return', Value: formatPercent(expectedReturn) },
      { Parameter: 'Investment Duration', Value: `${duration} Years` },
      { Parameter: 'Annuity Allocation', Value: formatPercent(annuityAllocation) },
      { Parameter: 'Assumed Annuity Rate', Value: formatPercent(assumedAnnuityRate) },
      { Parameter: 'Total Invested', Value: formatCurrency(result.totalInvested) },
      { Parameter: 'Total Retirement Corpus', Value: formatCurrency(result.totalCorpus) },
      { Parameter: 'Total Wealth Gained', Value: formatCurrency(result.wealthGained) },
      { Parameter: 'Lump Sum Withdrawal (Tax Free)', Value: formatCurrency(result.lumpSumWithdrawal) },
      { Parameter: 'Annuity Purchase Amount', Value: formatCurrency(result.annuityPurchase) },
      { Parameter: 'Estimated Monthly Pension', Value: formatCurrency(result.estimatedMonthlyPension) },
      { Parameter: 'Estimated Annual Pension', Value: formatCurrency(result.estimatedAnnualPension) },
    ];
    exportToCSV(csvData, 'nps_pension_calculation');
  };

  const handleExportPDF = () => {
    exportToPDF('nps-report', 'National Pension System (NPS) Calculation');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">National Pension System (NPS) Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Calculate your NPS retirement corpus, lump-sum tax-free withdrawal, and monthly annuity pension.
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
              {/* Monthly Contribution */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(monthlyContribution)}
                  </span>
                </div>
                <Input
                  id="monthlyContribution"
                  type="number"
                  min={500}
                  max={250000}
                  step={500}
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={500}
                  max={100000}
                  step={500}
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹500</span>
                  <span>₹1,00,000</span>
                </div>
              </div>

              {/* Expected Return Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="expectedReturn">Expected Return (% p.a.)</Label>
                  <span className="text-sm font-semibold text-primary">{expectedReturn}%</span>
                </div>
                <Input
                  id="expectedReturn"
                  type="number"
                  step="0.5"
                  min={5}
                  max={20}
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={5}
                  max={18}
                  step={0.5}
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5% (Conservative)</span>
                  <span>10% (Balanced)</span>
                  <span>15% (Aggressive)</span>
                </div>
              </div>

              {/* Duration Years */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="duration">Investment Period (Years)</Label>
                  <span className="text-sm font-semibold text-primary">{duration} Years</span>
                </div>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={50}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(5, Number(e.target.value)))}
                />
                <input
                  type="range"
                  min={5}
                  max={45}
                  step={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 Years</span>
                  <span>45 Years</span>
                </div>
              </div>

              {/* Annuity Allocation */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="annuityAllocation">Annuity Purchase (%)</Label>
                  <span className="text-sm font-semibold text-primary">{annuityAllocation}%</span>
                </div>
                <Input
                  id="annuityAllocation"
                  type="number"
                  min={40}
                  max={100}
                  value={annuityAllocation}
                  onChange={(e) => setAnnuityAllocation(Math.max(40, Math.min(100, Number(e.target.value))))}
                />
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={1}
                  value={annuityAllocation}
                  onChange={(e) => setAnnuityAllocation(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>40% (Statutory Minimum)</span>
                  <span>100% (Full Pension)</span>
                </div>
              </div>

              {/* Assumed Annuity Return Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="assumedAnnuityRate">Expected Annuity Return Rate (%)</Label>
                  <span className="text-sm font-semibold text-primary">{assumedAnnuityRate}%</span>
                </div>
                <Input
                  id="assumedAnnuityRate"
                  type="number"
                  step="0.25"
                  min={3}
                  max={12}
                  value={assumedAnnuityRate}
                  onChange={(e) => setAssumedAnnuityRate(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={4}
                  max={10}
                  step={0.25}
                  value={assumedAnnuityRate}
                  onChange={(e) => setAssumedAnnuityRate(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>4%</span>
                  <span>6% (Historical avg)</span>
                  <span>10%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Results & Visuals */}
        <div className="lg:col-span-7 space-y-6" id="nps-report">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20 sm:col-span-2">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Total Accumulated NPS Corpus
                </p>
                <p className="text-3xl font-extrabold text-primary mt-1">
                  {formatCurrency(result.totalCorpus)}
                </p>
                <div className="flex justify-between text-xs text-muted-foreground mt-2 border-t pt-2">
                  <span>Total Invested: {formatCurrency(result.totalInvested)}</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Gain: {formatCurrency(result.wealthGained)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Lump Sum Withdrawal ({100 - annuityAllocation}%)
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(result.lumpSumWithdrawal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  100% Tax-Exempt under current rules
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Estimated Monthly Pension
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCurrency(result.estimatedMonthlyPension)} / mo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Annual: {formatCurrency(result.estimatedAnnualPension)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts: Two Visualizations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chart 1: Invested vs Gains */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Invested vs Wealth Gained</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={investedVsGainData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                      </Pie>
                      <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Lump Sum vs Annuity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Corpus Distribution at Age 60</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={withdrawalVsAnnuityData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        <Cell fill="#f59e0b" />
                        <Cell fill="#8b5cf6" />
                      </Pie>
                      <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Chart: Trajectory */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Corpus Accumulation Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trajectoryData} margin={{ top: 10, right: 15, left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" />
                    <YAxis
                      tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                      domain={['auto', 'auto']}
                    />
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Corpus"
                      name="Total Corpus"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Invested"
                      name="Principal Invested"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4 flex gap-3 text-amber-900 dark:text-amber-200">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">Statutory NPS Regulatory Rules (PFRDA):</p>
                <p>
                  At normal superannuation (age 60), a minimum of 40% of the accumulated corpus must be invested
                  with an Annuity Service Provider (ASP) to provide a monthly pension. Up to 60% can be withdrawn
                  completely tax-free. Contributions qualify for tax deductions under Section 80CCD(1) and Section 80CCD(1B)
                  up to ₹50,000 beyond 80C limits.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
