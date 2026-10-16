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
import { calculateGoalInvestment } from '../utils/financialCalculations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function GoalCalculator() {
  const { saveCalculation } = useSavedCalculations();
  const [saveStatus, setSaveStatus] = useState('');

  const [goalName, setGoalName] = useState('Retirement Fund');
  const [targetAmount, setTargetAmount] = useState(5000000);
  const [currentSavings, setCurrentSavings] = useState(0);
  const [years, setYears] = useState(10);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [inflationRate, setInflationRate] = useState(6);

  const result = useMemo(() => {
    return calculateGoalInvestment({
      goalName,
      targetAmount: Number(targetAmount) || 0,
      currentSavings: Number(currentSavings) || 0,
      years: Number(years) || 0,
      expectedReturn: Number(expectedReturn) || 0,
      inflationRate: Number(inflationRate) || 0,
    });
  }, [goalName, targetAmount, currentSavings, years, expectedReturn, inflationRate]);

  // Pie chart: Current Savings Growth vs Additional Investment Needed
  const pieData = useMemo(() => {
    const list = [];
    if (result.savingsGrowth > 0) {
      list.push({
        name: 'Current Savings Future Value',
        value: Math.min(result.savingsGrowth, result.inflationAdjustedTarget),
      });
    }
    if (result.amountNeeded > 0) {
      list.push({
        name: 'Additional Wealth Needed',
        value: result.amountNeeded,
      });
    }
    if (list.length === 0) {
      list.push({ name: 'Goal Covered', value: result.targetAmount });
    }
    return list;
  }, [result]);

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: goalName || 'Goal Investment',
        type: 'goal-based',
        inputs: {
          goalName,
          targetAmount,
          currentSavings,
          years,
          expectedReturn,
          inflationRate,
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
      { Parameter: 'Goal Name', Value: goalName },
      { Parameter: 'Target Amount (Present Cost)', Value: formatCurrency(result.targetAmount) },
      { Parameter: 'Inflation Rate', Value: formatPercent(inflationRate) },
      { Parameter: 'Time Horizon', Value: `${years} Years` },
      { Parameter: 'Expected Return', Value: formatPercent(expectedReturn) },
      { Parameter: 'Current Savings', Value: formatCurrency(result.currentSavings) },
      { Parameter: 'Future Inflation-Adjusted Target', Value: formatCurrency(result.inflationAdjustedTarget) },
      { Parameter: 'Current Savings Growth', Value: formatCurrency(result.savingsGrowth) },
      { Parameter: 'Additional Amount Needed', Value: formatCurrency(result.amountNeeded) },
      { Parameter: 'Monthly SIP Needed Today', Value: formatCurrency(result.monthlySIPNeeded) },
      { Parameter: 'One-Time Lumpsum Needed Today', Value: formatCurrency(result.lumpsumNeeded) },
    ];
    exportToCSV(csvData, 'goal_investment_plan');
  };

  const handleExportPDF = () => {
    exportToPDF('goal-report', `${goalName || 'Goal'} Investment Plan`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goal-Based Investment Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Determine the exact monthly SIP or one-time lumpsum needed to achieve your target financial milestones.
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
              <CardTitle className="text-xl">Goal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Goal Name */}
              <div className="space-y-2">
                <Label htmlFor="goalName">Goal Name</Label>
                <Input
                  id="goalName"
                  type="text"
                  placeholder="e.g. Child Education, Home Purchase"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                />
              </div>

              {/* Target Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="targetAmount">Target Amount (Today's Cost)</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(targetAmount)}</span>
                </div>
                <Input
                  id="targetAmount"
                  type="number"
                  min={50000}
                  max={100000000}
                  step={50000}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={100000}
                  max={20000000}
                  step={100000}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹1 Lakh</span>
                  <span>₹2 Crore</span>
                </div>
              </div>

              {/* Current Savings */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="currentSavings">Current Savings for this Goal</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(currentSavings)}</span>
                </div>
                <Input
                  id="currentSavings"
                  type="number"
                  min={0}
                  max={50000000}
                  step={10000}
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={0}
                  max={5000000}
                  step={25000}
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Years to Goal */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="years">Years to Reach Goal</Label>
                  <span className="text-sm font-semibold text-primary">{years} Years</span>
                </div>
                <Input
                  id="years"
                  type="number"
                  min={1}
                  max={40}
                  value={years}
                  onChange={(e) => setYears(Math.max(1, Number(e.target.value)))}
                />
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Expected Return */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="expectedReturn">Expected Investment Return (%)</Label>
                  <span className="text-sm font-semibold text-primary">{expectedReturn}%</span>
                </div>
                <Input
                  id="expectedReturn"
                  type="number"
                  step="0.5"
                  min={1}
                  max={30}
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={4}
                  max={20}
                  step={0.5}
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Inflation Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="inflationRate">Expected Inflation Rate (%)</Label>
                  <span className="text-sm font-semibold text-primary">{inflationRate}%</span>
                </div>
                <Input
                  id="inflationRate"
                  type="number"
                  step="0.5"
                  min={0}
                  max={15}
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={0.5}
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Results & Visuals */}
        <div className="lg:col-span-7 space-y-6" id="goal-report">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Monthly SIP Required
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatCurrency(result.monthlySIPNeeded)} / month
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Invest regularly over {years} years
                </p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  One-Time Lumpsum Today
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(result.lumpsumNeeded)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Alternative single upfront investment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Inflation-Adjusted Target
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {formatCurrency(result.inflationAdjustedTarget)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Today's {formatCurrency(targetAmount)} with {inflationRate}% inflation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Remaining Gap to Cover
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {formatCurrency(result.amountNeeded)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current savings will grow to {formatCurrency(result.savingsGrowth)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pie Chart: Current Savings vs Additional Needed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Goal Funding Breakdown</CardTitle>
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
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Goal Planning Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border text-sm">
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">Target Goal Name</span>
                  <span className="font-semibold">{goalName || 'General Goal'}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">Today's Estimated Cost</span>
                  <span className="font-medium">{formatCurrency(result.targetAmount)}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">Cost after {years} Years ({inflationRate}% Inflation)</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {formatCurrency(result.inflationAdjustedTarget)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">Current Savings Grown ({expectedReturn}% p.a.)</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(result.savingsGrowth)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">Deficit to be Accumulated</span>
                  <span className="font-bold">{formatCurrency(result.amountNeeded)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4 flex gap-3 text-amber-900 dark:text-amber-200">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">Goal Planning Guidance:</p>
                <p>
                  These projections assume steady compounding and constant inflation rates throughout the tenure.
                  Financial planners recommend periodically reviewing goal progress and rebalancing asset allocation
                  closer to the target date into safer debt instruments.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
