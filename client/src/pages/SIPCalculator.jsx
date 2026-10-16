import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Bar
} from 'recharts';
import { formatCurrency, formatPercent } from '../utils/currencyFormatter';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { useSavedCalculations } from '../contexts/SavedCalculationsContext';
import { calculateSIP } from '../utils/sipCalculations';
import { Info, Download, Save, RefreshCw, TrendingUp, CheckCircle, ArrowRight, DollarSign, Calendar, Percent } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SIPCalculator() {
  const navigate = useNavigate();
  const { saveCalculation } = useSavedCalculations();

  // Inputs
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(10);
  const [months, setMonths] = useState(0);
  const [frequency, setFrequency] = useState('monthly');
  const [calcName, setCalcName] = useState('My SIP Plan');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time calculation
  const results = useMemo(() => {
    const validP = Math.max(0, Number(monthlyInvestment) || 0);
    const validRate = Math.max(0, Math.min(100, Number(annualReturn) || 0));
    const validYears = Math.max(0, Math.min(50, Number(years) || 0));
    const validMonths = Math.max(0, Math.min(11, Number(months) || 0));

    return calculateSIP({
      monthlyInvestment: validP,
      annualReturn: validRate,
      years: validYears,
      months: validMonths,
      frequency,
    });
  }, [monthlyInvestment, annualReturn, years, months, frequency]);

  // Chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Total Invested', value: results.totalInvested || 0 },
      { name: 'Estimated Returns', value: Math.max(0, results.estimatedReturns || 0) },
    ];
  }, [results]);

  const lineChartData = useMemo(() => {
    return (results.yearWiseData || []).map((row) => ({
      year: `Year ${row.year}`,
      Invested: row.invested,
      MaturityValue: row.value,
      Gains: row.gains,
    }));
  }, [results]);

  // Reset handler
  const handleReset = () => {
    setMonthlyInvestment(5000);
    setAnnualReturn(12);
    setYears(10);
    setMonths(0);
    setFrequency('monthly');
  };

  // Save calculation
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveCalculation({
        name: calcName.trim() || `SIP Plan - ${formatCurrency(monthlyInvestment)}/mo`,
        type: 'sip',
        inputs: {
          monthlyInvestment,
          annualReturn,
          years,
          months,
          frequency,
        },
        results: {
          totalInvested: results.totalInvested,
          estimatedReturns: results.estimatedReturns,
          maturityValue: results.maturityValue,
          absoluteReturn: results.absoluteReturn,
        },
        notes: `SIP Investment of ${formatCurrency(monthlyInvestment)} per month for ${years} years ${months > 0 ? months + ' months' : ''} at ${annualReturn}% p.a.`,
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
      'Invested Amount (₹)': item.invested,
      'Future Value (₹)': item.value,
      'Estimated Gains (₹)': item.gains,
    }));
    exportToCSV(csvData, 'SIP_Breakdown');
  };

  const handleExportPDF = () => {
    exportToPDF('sip-calculator-report', 'Systematic Investment Plan (SIP) Report');
  };

  // Investment presets
  const presets = [1000, 2500, 5000, 10000, 25000];

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                SIP Calculator
              </h1>
              <p className="text-sm text-muted-foreground">
                Calculate wealth accumulation through Systematic Investment Plans (SIP) in mutual funds
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/sip/advanced')}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Step-Up SIP
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
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
            <CardDescription>Adjust your monthly contribution, duration, and target return</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Frequency selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Investment Frequency
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'quarterly', label: 'Quarterly' },
                  { id: 'yearly', label: 'Yearly' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFrequency(item.id)}
                    className={`py-1.5 px-3 rounded-md text-sm font-medium border transition-colors ${
                      frequency === item.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent border-input text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Investment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="monthlyInvestment" className="font-medium text-sm">
                  {frequency === 'monthly' ? 'Monthly Investment' : frequency === 'quarterly' ? 'Quarterly Investment' : 'Yearly Investment'}
                </Label>
                <div className="w-32">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span>
                    <Input
                      id="monthlyInvestment"
                      type="number"
                      min={500}
                      max={1000000}
                      step={500}
                      value={monthlyInvestment}
                      onChange={(e) => setMonthlyInvestment(Math.max(0, Number(e.target.value)))}
                      className="pl-6 h-9 text-right font-semibold"
                    />
                  </div>
                </div>
              </div>
              <input
                type="range"
                min={500}
                max={100000}
                step={500}
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹500</span>
                <span>₹50,000</span>
                <span>₹1,00,000</span>
              </div>
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {presets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setMonthlyInvestment(amt)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      monthlyInvestment === amt
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
                  Expected Return Rate (p.a.)
                </Label>
                <div className="w-24">
                  <div className="relative">
                    <Input
                      id="annualReturn"
                      type="number"
                      min={1}
                      max={30}
                      step={0.1}
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
                <span>1% (Debt)</span>
                <span>12% (Balanced)</span>
                <span>30% (Aggressive)</span>
              </div>
            </div>

            {/* Investment Duration Years & Months */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="durationYears" className="font-medium text-sm">
                  Investment Duration
                </Label>
                <div className="flex items-center gap-1.5">
                  <div className="relative w-20">
                    <Input
                      id="durationYears"
                      type="number"
                      min={1}
                      max={40}
                      value={years}
                      onChange={(e) => setYears(Math.max(1, Math.min(40, Number(e.target.value))))}
                      className="pr-6 h-9 text-right font-semibold"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-muted-foreground">Yr</span>
                  </div>
                  <div className="relative w-20">
                    <Input
                      id="durationMonths"
                      type="number"
                      min={0}
                      max={11}
                      value={months}
                      onChange={(e) => setMonths(Math.max(0, Math.min(11, Number(e.target.value))))}
                      className="pr-6 h-9 text-right font-semibold"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-muted-foreground">Mo</span>
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

            {/* Plan Name for saving */}
            <div className="pt-2 border-t space-y-1.5">
              <Label htmlFor="planName" className="text-xs text-muted-foreground">
                Save Calculation Label (Optional)
              </Label>
              <Input
                id="planName"
                placeholder="e.g. Retirement SIP, Child's Education"
                value={calcName}
                onChange={(e) => setCalcName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Banner for Advanced SIP */}
            <div className="bg-primary/5 rounded-lg p-3.5 border border-primary/20 flex items-start gap-3">
              <div className="p-1.5 bg-primary/10 rounded-md text-primary mt-0.5">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex-1 text-xs">
                <span className="font-semibold text-foreground block mb-0.5">Planning an annual hike?</span>
                <span className="text-muted-foreground">
                  A Step-Up SIP lets you increase your investment annually in sync with your salary increments.
                </span>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs text-primary font-semibold flex items-center gap-1"
                    onClick={() => navigate('/sip/advanced')}
                  >
                    Try Step-Up SIP Calculator <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Key Results & Visualizations */}
        <div className="lg:col-span-7 space-y-6" id="sip-calculator-report">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Invested
                </p>
                <p className="text-lg md:text-xl font-bold mt-1 text-foreground">
                  {formatCurrency(results.totalInvested)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Over {years}y {months > 0 ? `${months}m` : ''}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Est. Returns
                </p>
                <p className="text-lg md:text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(results.estimatedReturns)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Gains earned
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/50 bg-primary/5 col-span-2 sm:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Expected Corpus (Maturity)
                  </p>
                  <span className="text-[10px] bg-primary text-primary-foreground font-semibold px-2 py-0.5 rounded-full">
                    Absolute: {formatPercent(results.absoluteReturn)}
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold mt-1 text-primary">
                  {formatCurrency(results.maturityValue)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  At {annualReturn}% expected annual return
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Card */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Wealth Projection Visualizer</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="growth" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="growth">Growth Trajectory</TabsTrigger>
                  <TabsTrigger value="breakdown">Wealth Distribution</TabsTrigger>
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
                            name === 'MaturityValue'
                              ? 'Total Value'
                              : name === 'Invested'
                              ? 'Invested Amount'
                              : 'Gains',
                          ]}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '12px' }}
                          formatter={(value) =>
                            value === 'MaturityValue' ? 'Total Value' : 'Invested Capital'
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="Invested"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5 }}
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

      {/* Year-Wise Breakdown Table */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg">Year-Wise Investment Schedule</CardTitle>
            <CardDescription>
              Detailed breakdown of annual invested capital, compound interest gains, and closing portfolio balance
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
                  <th className="py-3 px-4 text-right">Cumulative Invested</th>
                  <th className="py-3 px-4 text-right">Estimated Gains</th>
                  <th className="py-3 px-4 text-right">Portfolio Value</th>
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

      {/* Financial Disclaimer & Important Notes */}
      <Card className="bg-muted/30 border-dashed border-border">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Financial Disclaimer & Notes:</p>
            <p>
              Mutual fund investments are subject to market risks; read all scheme-related documents carefully.
              The calculations presented above are projections based on assumed compound annual growth rates (CAGR) and do not represent guaranteed returns.
            </p>
            <p>
              Capital gains tax applies upon redemption: Equity mutual funds are taxed at 12.5% for Long-Term Capital Gains (LTCG) exceeding ₹1.25 Lakh per financial year, and 20% for Short-Term Capital Gains (STCG).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
