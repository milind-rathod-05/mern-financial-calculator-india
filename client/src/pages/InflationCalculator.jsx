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
import { calculateInflation } from '../utils/financialCalculations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function InflationCalculator() {
  const { saveCalculation } = useSavedCalculations();
  const [saveStatus, setSaveStatus] = useState('');

  const [amount, setAmount] = useState(100000);
  const [inflationRate, setInflationRate] = useState(6);
  const [years, setYears] = useState(10);
  const [mode, setMode] = useState('future-cost'); // 'future-cost' or 'present-value'

  const result = useMemo(() => {
    return calculateInflation({
      currentAmount: Number(amount) || 0,
      inflationRate: Number(inflationRate) || 0,
      years: Number(years) || 0,
      mode,
    });
  }, [amount, inflationRate, years, mode]);

  // Bar chart data showing year-by-year cost or purchasing power progression
  const barChartData = useMemo(() => {
    const list = [];
    const t = Number(years) || 0;
    const base = Number(amount) || 0;
    const rate = (Number(inflationRate) || 0) / 100;

    for (let y = 1; y <= t; y++) {
      if (mode === 'future-cost') {
        const costAtYear = base * Math.pow(1 + rate, y);
        list.push({
          year: `Yr ${y}`,
          yearNum: y,
          Amount: Math.round(costAtYear),
          InflationAdded: Math.round(costAtYear - base),
        });
      } else {
        const pvAtYear = base / Math.pow(1 + rate, y);
        list.push({
          year: `Yr ${y}`,
          yearNum: y,
          Amount: Math.round(pvAtYear),
          PurchasingPowerLoss: Math.round(base - pvAtYear),
        });
      }
    }
    return list;
  }, [amount, inflationRate, years, mode]);

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `Inflation ${mode === 'future-cost' ? 'Future Cost' : 'Present Value'} (₹${(Number(amount) || 0).toLocaleString('en-IN')})`,
        type: 'inflation',
        inputs: { amount, inflationRate, years, mode },
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
    const csvData = barChartData.map((row) => ({
      Year: row.yearNum,
      [mode === 'future-cost' ? 'Future Equivalent Cost (₹)' : 'Present Value (₹)']: row.Amount,
      [mode === 'future-cost' ? 'Inflation Impact (₹)' : 'Purchasing Power Loss (₹)']:
        mode === 'future-cost' ? row.InflationAdded : row.PurchasingPowerLoss,
    }));
    exportToCSV(csvData, 'inflation_trajectory');
  };

  const handleExportPDF = () => {
    exportToPDF('inflation-report', 'Inflation Analysis Report');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inflation Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Analyze the erosive impact of inflation on money over time and estimate future purchasing power.
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
              <CardTitle className="text-xl">Calculation Mode & Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Mode Toggle Buttons */}
              <div className="space-y-2">
                <Label>Calculation Objective</Label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setMode('future-cost')}
                    className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                      mode === 'future-cost'
                        ? 'bg-background text-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Future Cost (What will it cost?)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('present-value')}
                    className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                      mode === 'present-value'
                        ? 'bg-background text-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Present Value (What is it worth?)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="amount">
                    {mode === 'future-cost' ? 'Current Amount / Expense' : 'Future Amount in Mind'}
                  </Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(amount)}</span>
                </div>
                <Input
                  id="amount"
                  type="number"
                  min={1000}
                  max={50000000}
                  step={5000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={5000}
                  max={2000000}
                  step={5000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹5,000</span>
                  <span>₹20 Lakh</span>
                </div>
              </div>

              {/* Inflation Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="inflationRate">Expected Inflation Rate (% p.a.)</Label>
                  <span className="text-sm font-semibold text-primary">{inflationRate}%</span>
                </div>
                <Input
                  id="inflationRate"
                  type="number"
                  step="0.1"
                  min={1}
                  max={25}
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={1}
                  max={15}
                  step={0.5}
                  value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>3% (Low)</span>
                  <span>6% (India Historical)</span>
                  <span>10% (Education/Medical)</span>
                </div>
              </div>

              {/* Years */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="years">Time Horizon (Years)</Label>
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
                  max={40}
                  step={1}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 Year</span>
                  <span>40 Years</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Results & Visuals */}
        <div className="lg:col-span-7 space-y-6" id="inflation-report">
          {/* Key Summary Cards */}
          {mode === 'future-cost' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-5">
                  <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                    Future Required Amount
                  </p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {formatCurrency(result.futureAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    To buy what {formatCurrency(amount)} buys today
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-rose-500/5 border-rose-500/20">
                <CardContent className="p-5">
                  <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                    Inflation Impact (Extra Needed)
                  </p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                    +{formatCurrency(result.inflationImpact)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Extra cost due to {inflationRate}% inflation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                    Current Amount
                  </p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {formatCurrency(result.currentAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Starting baseline</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                    Purchasing Power Loss
                  </p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {formatPercent(result.purchasingPowerLoss)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Decline in real monetary purchasing power
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-5">
                  <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                    Present Day Value
                  </p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {formatCurrency(result.presentValue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Worth of {formatCurrency(amount)} after {years} years
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-5">
                  <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                    Retained Purchasing Power
                  </p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {formatPercent(result.purchasingPower)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(100 - result.purchasingPower).toFixed(1)}% lost to inflation
                  </p>
                </CardContent>
              </Card>

              <Card className="sm:col-span-2">
                <CardContent className="p-5">
                  <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                    Target Future Nominal Sum
                  </p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {formatCurrency(result.futureAmount)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bar Chart: Year-by-Year Cost Increase */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {mode === 'future-cost'
                  ? 'Year-by-Year Cost Increase'
                  : 'Year-by-Year Real Value Decay'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 15, left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" />
                    <YAxis
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                      domain={['auto', 'auto']}
                    />
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                    <Bar
                      dataKey="Amount"
                      name={mode === 'future-cost' ? 'Future Cost' : 'Real Value'}
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4 flex gap-3 text-amber-900 dark:text-amber-200">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">Understanding Inflation's Impact:</p>
                <p>
                  Inflation erodes the purchasing power of your savings over time. In India, headline CPI inflation
                  has historically hovered around 5% - 7%, while education, healthcare, and lifestyle expenses often inflate
                  at 10% - 12% annually. Always factor in real returns (Return minus Inflation) when planning long-term investments.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
