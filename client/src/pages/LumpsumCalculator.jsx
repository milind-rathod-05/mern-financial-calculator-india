import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
import { calculateLumpsum } from '../utils/financialCalculations';
import {
  Info,
  Download,
  Save,
  RefreshCw,
  Coins,
  CheckCircle,
  TrendingUp,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function LumpsumCalculator() {
  const { saveCalculation } = useSavedCalculations();

  // Inputs
  const [principal, setPrincipal] = useState(100000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(10);
  const [calcName, setCalcName] = useState('Lumpsum Investment');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time calculation
  const results = useMemo(() => {
    const P = Math.max(0, Number(principal) || 0);
    const r = Math.max(0, Math.min(50, Number(annualReturn) || 0));
    const t = Math.max(1, Math.min(50, Number(years) || 1));

    return calculateLumpsum({
      principal: P,
      annualReturn: r,
      years: t,
    });
  }, [principal, annualReturn, years]);

  // Chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Initial Capital', value: results.invested || 0 },
      { name: 'Total Gains', value: Math.max(0, results.returns || 0) },
    ];
  }, [results]);

  const lineChartData = useMemo(() => {
    return (results.yearWiseData || []).map((row) => ({
      year: `Yr ${row.year}`,
      Invested: row.invested,
      MaturityValue: row.value,
      Gains: row.gains,
    }));
  }, [results]);

  // Rule of 72 calculation
  const yearsToDouble = useMemo(() => {
    const r = Number(annualReturn) || 0;
    if (r <= 0) return 0;
    return (72 / r).toFixed(1);
  }, [annualReturn]);

  // Reset handler
  const handleReset = () => {
    setPrincipal(100000);
    setAnnualReturn(12);
    setYears(10);
  };

  // Save calculation
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveCalculation({
        name: calcName.trim() || `Lumpsum - ${formatCurrency(principal)}`,
        type: 'lumpsum',
        inputs: {
          principal,
          annualReturn,
          years,
        },
        results: {
          invested: results.invested,
          returns: results.returns,
          maturityValue: results.maturityValue,
          absoluteReturn: results.absoluteReturn,
        },
        notes: `Lumpsum deposit of ${formatCurrency(principal)} for ${years} years at ${annualReturn}% CAGR`,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save calculation:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    if (!results.yearWiseData || results.yearWiseData.length === 0) return;
    const csvData = results.yearWiseData.map((item) => ({
      Year: item.year,
      'Initial Capital (₹)': item.invested,
      'Portfolio Value (₹)': item.value,
      'Total Gains (₹)': item.gains,
    }));
    exportToCSV(csvData, 'Lumpsum_Investment_Schedule');
  };

  const handleExportPDF = () => {
    exportToPDF('lumpsum-report', 'Lumpsum Mutual Fund Investment Report');
  };

  const presets = [25000, 50000, 100000, 500000, 1000000];

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Lumpsum Calculator
              </h1>
              <p className="text-sm text-muted-foreground">
                Calculate compounded returns on one-time mutual fund and equity investments
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} title="Reset inputs">
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className={saveSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1 text-white" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save Plan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs */}
        <Card className="lg:col-span-5 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Investment Parameters</CardTitle>
            <CardDescription>Enter your one-time principal amount, expected growth, and horizon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Principal Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="principal" className="font-medium text-sm">
                  Total Investment Amount
                </Label>
                <div className="w-36">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span>
                    <Input
                      id="principal"
                      type="number"
                      min={1000}
                      max={100000000}
                      step={5000}
                      value={principal}
                      onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                      className="pl-6 h-9 text-right font-semibold"
                    />
                  </div>
                </div>
              </div>
              <input
                type="range"
                min={1000}
                max={5000000}
                step={5000}
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹1,000</span>
                <span>₹25,00,000</span>
                <span>₹50,00,000</span>
              </div>
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {presets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPrincipal(amt)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      principal === amt
                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                        : 'border-border text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Expected Return Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="annualReturn" className="font-medium text-sm">
                  Expected Return (p.a.)
                </Label>
                <div className="w-24">
                  <div className="relative">
                    <Input
                      id="annualReturn"
                      type="number"
                      min={1}
                      max={30}
                      step={0.5}
                      value={annualReturn}
                      onChange={(e) => setAnnualReturn(Math.max(0, Math.min(30, Number(e.target.value))))}
                      className="pr-6 h-9 text-right font-semibold"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={0.5}
                value={annualReturn}
                onChange={(e) => setAnnualReturn(Number(e.target.value))}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1% (FD / Debt)</span>
                <span>12% (Nifty Index)</span>
                <span>30%</span>
              </div>
            </div>

            {/* Investment Duration Years */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="durationYears" className="font-medium text-sm">
                  Time Period (Years)
                </Label>
                <div className="w-24">
                  <div className="relative">
                    <Input
                      id="durationYears"
                      type="number"
                      min={1}
                      max={40}
                      value={years}
                      onChange={(e) => setYears(Math.max(1, Math.min(40, Number(e.target.value))))}
                      className="pr-6 h-9 text-right font-semibold"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">Yrs</span>
                  </div>
                </div>
              </div>
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
                <span>1 Yr</span>
                <span>20 Yrs</span>
                <span>40 Yrs</span>
              </div>
            </div>

            {/* Rule of 72 Card */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-md">
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-foreground block">
                  Rule of 72: Doubling Time
                </span>
                <span className="text-muted-foreground">
                  At {annualReturn}% annual return, your money will double in approximately{' '}
                  <span className="font-bold text-amber-700 dark:text-amber-400">{yearsToDouble} years</span>.
                </span>
              </div>
            </div>

            {/* Calculation Label */}
            <div className="pt-2 border-t space-y-1.5">
              <Label htmlFor="calcName" className="text-xs text-muted-foreground">
                Save Calculation Label (Optional)
              </Label>
              <Input
                id="calcName"
                placeholder="e.g. FD vs Mutual Fund Lumpsum"
                value={calcName}
                onChange={(e) => setCalcName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Key Results & Visualizations */}
        <div className="lg:col-span-7 space-y-6" id="lumpsum-report">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Invested Capital
                </p>
                <p className="text-lg md:text-xl font-bold mt-1 text-foreground">
                  {formatCurrency(results.invested)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Initial deposit
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Gains
                </p>
                <p className="text-lg md:text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(results.returns)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Compound interest
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/50 bg-primary/5 col-span-2 sm:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Total Maturity Value
                  </p>
                  <span className="text-[10px] bg-primary text-primary-foreground font-semibold px-2 py-0.5 rounded-full">
                    Absolute: {formatPercent(results.absoluteReturn)}
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold mt-1 text-primary">
                  {formatCurrency(results.maturityValue)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  After {years} years at {annualReturn}% CAGR
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Card */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Wealth Compounding Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="growth" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="growth">Growth Curve</TabsTrigger>
                  <TabsTrigger value="breakdown">Capital vs Returns</TabsTrigger>
                </TabsList>

                <TabsContent value="growth" className="mt-0">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={lineChartData}
                        margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                        />
                        <RechartsTooltip
                          formatter={(value, name) => [
                            formatCurrency(value),
                            name === 'MaturityValue' ? 'Total Value' : 'Invested Capital',
                          ]}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line
                          type="monotone"
                          dataKey="Invested"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="MaturityValue"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="breakdown" className="mt-0">
                  <div className="h-[280px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <RechartsTooltip
                          formatter={(value) => [formatCurrency(value), 'Amount']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Year-Wise Schedule Table */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg">Year-Wise Compounding Schedule</CardTitle>
            <CardDescription>
              Detailed progression of annual gains and overall portfolio value across your holding period
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/60 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4 text-right">Invested Principal</th>
                  <th className="py-3 px-4 text-right">Cumulative Gains</th>
                  <th className="py-3 px-4 text-right">Portfolio Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.yearWiseData && results.yearWiseData.length > 0 ? (
                  results.yearWiseData.map((row) => (
                    <tr key={row.year} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-4 font-medium">Year {row.year}</td>
                      <td className="py-2.5 px-4 text-right text-muted-foreground">
                        {formatCurrency(row.invested)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        +{formatCurrency(row.gains)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-foreground">
                        {formatCurrency(row.value)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-muted-foreground">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Financial Disclaimer */}
      <Card className="bg-muted/30 border-dashed border-border">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Lumpsum Investment Notes & Taxation:</p>
            <p>
              Lumpsum investments allow the entire capital to compound from Day 1. In high-market valuation periods, dollar-cost averaging (SIP) or Systematic Transfer Plans (STP) may help reduce timing risk.
            </p>
            <p>
              Mutual funds are subject to market volatility. Under current Indian Income Tax rules, Equity Mutual Fund Long-Term Capital Gains (holding period &gt; 12 months) are taxed at 12.5% on gains exceeding ₹1.25 Lakh per financial year.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
