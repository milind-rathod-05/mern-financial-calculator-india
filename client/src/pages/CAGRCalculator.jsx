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
import { Info, Download, Save, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { calculateCAGR } from '../utils/financialCalculations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CAGRCalculator() {
  const { saveCalculation } = useSavedCalculations();
  const [saveStatus, setSaveStatus] = useState('');

  const [initialValue, setInitialValue] = useState(100000);
  const [finalValue, setFinalValue] = useState(250000);
  const [years, setYears] = useState(5);

  const result = useMemo(() => {
    return calculateCAGR({
      initialValue: Number(initialValue) || 0,
      finalValue: Number(finalValue) || 0,
      years: Number(years) || 0,
    });
  }, [initialValue, finalValue, years]);

  const isPositive = result.totalGain >= 0;

  // Bar chart: Initial vs Final value
  const barChartData = useMemo(() => {
    return [
      { name: 'Initial Investment', Amount: Number(initialValue) || 0 },
      { name: 'Final Value', Amount: Number(finalValue) || 0 },
    ];
  }, [initialValue, finalValue]);

  // Year-by-year compounded progression at the CAGR rate
  const progressionData = useMemo(() => {
    const list = [];
    const p = Number(initialValue) || 0;
    const t = Number(years) || 0;
    const r = (result.cagr || 0) / 100;

    for (let y = 0; y <= t; y++) {
      const val = p * Math.pow(1 + r, y);
      list.push({
        year: `Year ${y}`,
        yearNum: y,
        PortfolioValue: Math.round(val),
        CumulativeGain: Math.round(val - p),
      });
    }
    return list;
  }, [initialValue, years, result.cagr]);

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `CAGR Analysis (${years} yrs: ${formatPercent(result.cagr)})`,
        type: 'cagr',
        inputs: { initialValue, finalValue, years },
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
    const csvData = progressionData.map((row) => ({
      Year: row.yearNum,
      'Compounded Portfolio Value (₹)': row.PortfolioValue,
      'Cumulative Gain (₹)': row.CumulativeGain,
    }));
    exportToCSV(csvData, 'cagr_growth_trajectory');
  };

  const handleExportPDF = () => {
    exportToPDF('cagr-report', 'CAGR Performance Report');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CAGR Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Calculate the Compound Annual Growth Rate (CAGR) and absolute return across any investment period.
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
              <CardTitle className="text-xl">Investment Values</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Initial Value */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="initialValue">Initial Investment Value</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(initialValue)}</span>
                </div>
                <Input
                  id="initialValue"
                  type="number"
                  min={1000}
                  max={100000000}
                  step={5000}
                  value={initialValue}
                  onChange={(e) => setInitialValue(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={5000}
                  max={2000000}
                  step={5000}
                  value={initialValue}
                  onChange={(e) => setInitialValue(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹5,000</span>
                  <span>₹20 Lakh</span>
                </div>
              </div>

              {/* Final Value */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="finalValue">Final / Current Value</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(finalValue)}</span>
                </div>
                <Input
                  id="finalValue"
                  type="number"
                  min={1000}
                  max={200000000}
                  step={5000}
                  value={finalValue}
                  onChange={(e) => setFinalValue(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={5000}
                  max={5000000}
                  step={5000}
                  value={finalValue}
                  onChange={(e) => setFinalValue(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹5,000</span>
                  <span>₹50 Lakh</span>
                </div>
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
                  step="0.5"
                  min={0.5}
                  max={50}
                  value={years}
                  onChange={(e) => setYears(Math.max(0.1, Number(e.target.value)))}
                />
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={0.5}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 Year</span>
                  <span>30 Years</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Results & Visuals */}
        <div className="lg:col-span-7 space-y-6" id="cagr-report">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                    CAGR (Annualized)
                  </p>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
                <p className="text-3xl font-extrabold text-primary mt-1">
                  {formatPercent(result.cagr)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Compounded annual rate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Absolute Return
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatPercent(result.absoluteReturn)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total % gain over tenure
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Total Wealth Gained
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    isPositive
                      ? 'text-foreground'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(result.totalGain)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Final minus Initial</p>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart: Initial vs Final Value */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Initial vs Final Valuation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Bar dataKey="Amount" radius={[6, 6, 0, 0]}>
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Line Chart: Smoothed Annualized Compounding Path */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Annualized Compounding Path</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressionData} margin={{ top: 10, right: 20, left: 15, bottom: 0 }}>
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
                      dataKey="PortfolioValue"
                      name="Compounded Value"
                      stroke="#10b981"
                      strokeWidth={2.5}
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
                <p className="font-semibold">Understanding CAGR:</p>
                <p>
                  CAGR provides an annualized geometric progression metric that smoothens out annual volatility
                  over the given duration. In actual equity, mutual funds, or real estate markets, year-over-year
                  returns fluctuate significantly and rarely equal the CAGR in any single intermediate year.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
