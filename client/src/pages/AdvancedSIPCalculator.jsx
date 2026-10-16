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
  Bar,
} from 'recharts';
import { formatCurrency, formatPercent } from '../utils/currencyFormatter';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { useSavedCalculations } from '../contexts/SavedCalculationsContext';
import { calculateStepUpSIP } from '../utils/stepUpSipCalculations';
import {
  Info,
  Download,
  Save,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  GitCompare,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdvancedSIPCalculator() {
  const navigate = useNavigate();
  const { saveCalculation } = useSavedCalculations();

  // Inputs
  const [initialMonthlyAmount, setInitialMonthlyAmount] = useState(5000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(15);
  const [stepUpType, setStepUpType] = useState('percentage'); // 'percentage' | 'fixed'
  const [stepUpRate, setStepUpRate] = useState(10);
  const [stepUpAmount, setStepUpAmount] = useState(1000);
  const [compareWithRegular, setCompareWithRegular] = useState(true);
  const [calcName, setCalcName] = useState('Step-Up SIP Plan');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculation
  const results = useMemo(() => {
    const P = Math.max(0, Number(initialMonthlyAmount) || 0);
    const r = Math.max(0, Math.min(50, Number(annualReturn) || 0));
    const y = Math.max(1, Math.min(50, Number(years) || 1));
    const rate = Math.max(0, Math.min(100, Number(stepUpRate) || 0));
    const fixedAmt = Math.max(0, Number(stepUpAmount) || 0);

    return calculateStepUpSIP({
      initialMonthlyAmount: P,
      annualReturn: r,
      years: y,
      stepUpRate: rate,
      stepUpType,
      stepUpAmount: fixedAmt,
      compareWithRegular,
    });
  }, [initialMonthlyAmount, annualReturn, years, stepUpType, stepUpRate, stepUpAmount, compareWithRegular]);

  // Combined Chart Data for Line Chart (Regular vs Step-Up)
  const lineChartData = useMemo(() => {
    const r = (Number(annualReturn) || 0) / 100 / 12;
    const P = Number(initialMonthlyAmount) || 0;

    return (results.yearWiseData || []).map((row) => {
      const monthsElapsed = row.year * 12;
      let regValue = 0;
      if (r === 0) {
        regValue = P * monthsElapsed;
      } else {
        regValue = P * ((Math.pow(1 + r, monthsElapsed) - 1) / r);
      }
      const regInvested = P * monthsElapsed;

      return {
        year: `Yr ${row.year}`,
        stepUpValue: row.estimatedValue,
        stepUpInvested: row.cumulativeInvested,
        regularValue: Math.round(regValue),
        regularInvested: Math.round(regInvested),
      };
    });
  }, [results, annualReturn, initialMonthlyAmount]);

  // Bar Chart Data for Annual Contributions
  const barChartData = useMemo(() => {
    const P = Number(initialMonthlyAmount) || 0;
    const regularAnnual = P * 12;

    return (results.yearWiseData || []).map((row) => ({
      year: `Yr ${row.year}`,
      'Step-Up Annual': row.annualContribution,
      'Regular Annual': regularAnnual,
    }));
  }, [results, initialMonthlyAmount]);

  // Pie chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Total Invested', value: results.totalInvested || 0 },
      { name: 'Estimated Returns', value: Math.max(0, results.estimatedReturns || 0) },
    ];
  }, [results]);

  // Reset
  const handleReset = () => {
    setInitialMonthlyAmount(5000);
    setAnnualReturn(12);
    setYears(15);
    setStepUpType('percentage');
    setStepUpRate(10);
    setStepUpAmount(1000);
    setCompareWithRegular(true);
  };

  // Save calculation
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveCalculation({
        name: calcName.trim() || `Step-Up SIP - ${formatCurrency(initialMonthlyAmount)}/mo`,
        type: 'step-up-sip',
        inputs: {
          initialMonthlyAmount,
          annualReturn,
          years,
          stepUpRate,
          stepUpType,
          stepUpAmount,
          compareWithRegular,
        },
        results: {
          totalInvested: results.totalInvested,
          estimatedReturns: results.estimatedReturns,
          maturityValue: results.maturityValue,
          finalMonthlyAmount: results.finalMonthlyAmount,
          absoluteReturn: results.absoluteReturn,
          comparison: results.comparison,
        },
        notes: `Step-Up SIP starting at ${formatCurrency(initialMonthlyAmount)}/mo with ${
          stepUpType === 'percentage' ? `${stepUpRate}%` : formatCurrency(stepUpAmount)
        } annual increase over ${years} years at ${annualReturn}% p.a.`,
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
      'Monthly SIP (₹)': item.monthlyAmount,
      'Annual Deposit (₹)': item.annualContribution,
      'Cumulative Invested (₹)': item.cumulativeInvested,
      'Portfolio Value (₹)': item.estimatedValue,
      'Total Gains (₹)': item.estimatedGains,
    }));
    exportToCSV(csvData, 'Step_Up_SIP_Breakdown');
  };

  const handleExportPDF = () => {
    exportToPDF('stepup-sip-report', 'Step-Up SIP Analysis Report');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/sip')}
            className="hover:bg-muted"
            title="Back to regular SIP"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            SIP Calc
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Step-Up SIP Calculator
              <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Growth Accelerator
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Supercharge your wealth creation by automatically stepping up your SIP contributions every year
            </p>
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
            <CardTitle className="text-lg">Step-Up SIP Settings</CardTitle>
            <CardDescription>Configure initial deposit, annual hike, and investment horizon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Initial Monthly SIP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="initialMonthlyAmount" className="font-medium text-sm">
                  Initial Monthly SIP
                </Label>
                <div className="w-32">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span>
                    <Input
                      id="initialMonthlyAmount"
                      type="number"
                      min={500}
                      max={1000000}
                      step={500}
                      value={initialMonthlyAmount}
                      onChange={(e) => setInitialMonthlyAmount(Math.max(0, Number(e.target.value)))}
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
                value={initialMonthlyAmount}
                onChange={(e) => setInitialMonthlyAmount(Number(e.target.value))}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹500</span>
                <span>₹50,000</span>
                <span>₹1,00,000</span>
              </div>
            </div>

            {/* Step-Up Type & Value */}
            <div className="space-y-3 p-3.5 bg-muted/40 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Annual Step-Up Mode
                </Label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setStepUpType('percentage')}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                      stepUpType === 'percentage'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground border'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStepUpType('fixed')}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                      stepUpType === 'fixed'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground border'
                    }`}
                  >
                    Fixed Amount (₹)
                  </button>
                </div>
              </div>

              {stepUpType === 'percentage' ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stepUpRate" className="text-sm font-medium">
                      Annual Step-Up Rate
                    </Label>
                    <div className="w-24">
                      <div className="relative">
                        <Input
                          id="stepUpRate"
                          type="number"
                          min={0}
                          max={50}
                          step={1}
                          value={stepUpRate}
                          onChange={(e) => setStepUpRate(Math.max(0, Math.min(50, Number(e.target.value))))}
                          className="pr-6 h-8 text-right text-sm font-semibold"
                        />
                        <span className="absolute right-2.5 top-2 text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={stepUpRate}
                    onChange={(e) => setStepUpRate(Number(e.target.value))}
                    className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0% (Regular)</span>
                    <span>10% (Typical Hike)</span>
                    <span>50%</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stepUpAmount" className="text-sm font-medium">
                      Annual Step-Up Amount
                    </Label>
                    <div className="w-32">
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">₹</span>
                        <Input
                          id="stepUpAmount"
                          type="number"
                          min={100}
                          step={500}
                          value={stepUpAmount}
                          onChange={(e) => setStepUpAmount(Math.max(0, Number(e.target.value)))}
                          className="pl-6 h-8 text-right text-sm font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your monthly SIP will increase by {formatCurrency(stepUpAmount)} each year.
                  </p>
                </div>
              )}
            </div>

            {/* Expected Annual Return */}
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
                <span>1%</span>
                <span>12%</span>
                <span>30%</span>
              </div>
            </div>

            {/* Duration Years */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="years" className="font-medium text-sm">
                  Investment Duration
                </Label>
                <div className="w-24">
                  <div className="relative">
                    <Input
                      id="years"
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
                <span>15 Yrs</span>
                <span>40 Yrs</span>
              </div>
            </div>

            {/* Compare with Regular SIP Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium cursor-pointer">Compare with Regular SIP</Label>
                <p className="text-xs text-muted-foreground">Show extra wealth generated by step-up</p>
              </div>
              <input
                type="checkbox"
                checked={compareWithRegular}
                onChange={(e) => setCompareWithRegular(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {/* Plan Name for saving */}
            <div className="pt-2 border-t space-y-1.5">
              <Label htmlFor="calcName" className="text-xs text-muted-foreground">
                Calculation Name (Optional)
              </Label>
              <Input
                id="calcName"
                placeholder="e.g. 15-Year Step Up Wealth Plan"
                value={calcName}
                onChange={(e) => setCalcName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Key Results & Comparison */}
        <div className="lg:col-span-7 space-y-6" id="stepup-sip-report">
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
                  Over {years} years
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estimated Returns
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
                    Step-Up Maturity Corpus
                  </p>
                  <span className="text-[10px] bg-primary text-primary-foreground font-semibold px-2 py-0.5 rounded-full">
                    End SIP: {formatCurrency(results.finalMonthlyAmount)}/mo
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold mt-1 text-primary">
                  {formatCurrency(results.maturityValue)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  At {annualReturn}% CAGR with annual increment
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Regular vs Step-Up Comparison Box */}
          {compareWithRegular && results.comparison && (
            <Card className="border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitCompare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-sm font-bold text-foreground">
                      Power of Step-Up vs Regular SIP
                    </CardTitle>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-600 text-white">
                    +{formatPercent((results.comparison.additionalWealth / (results.comparison.regular.maturityValue || 1)) * 100)} Extra Corpus
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-md bg-background/80 border border-border">
                  <span className="text-muted-foreground block text-[11px]">Regular SIP Corpus</span>
                  <span className="font-bold text-sm text-foreground">
                    {formatCurrency(results.comparison.regular.maturityValue)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Invested: {formatCurrency(results.comparison.regular.totalInvested)}
                  </span>
                </div>

                <div className="p-2.5 rounded-md bg-background/80 border border-border">
                  <span className="text-muted-foreground block text-[11px]">Step-Up Corpus</span>
                  <span className="font-bold text-sm text-primary">
                    {formatCurrency(results.comparison.stepUp.maturityValue)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Invested: {formatCurrency(results.comparison.stepUp.totalInvested)}
                  </span>
                </div>

                <div className="p-2.5 rounded-md bg-background/80 border border-border">
                  <span className="text-muted-foreground block text-[11px]">Extra Investment</span>
                  <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
                    +{formatCurrency(results.comparison.additionalInvestment)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Incremental savings
                  </span>
                </div>

                <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold block text-[11px]">
                    Extra Wealth Created
                  </span>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(results.comparison.additionalWealth)}
                  </span>
                  <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 block">
                    Pure wealth bonus
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts Card */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Step-Up SIP Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="comparison" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="comparison">Portfolio Growth</TabsTrigger>
                  <TabsTrigger value="annual">Annual Deposits</TabsTrigger>
                  <TabsTrigger value="pie">Wealth Split</TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="mt-0">
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
                            name === 'stepUpValue'
                              ? 'Step-Up Value'
                              : name === 'regularValue'
                              ? 'Regular SIP Value'
                              : name === 'stepUpInvested'
                              ? 'Step-Up Invested'
                              : 'Regular Invested',
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
                          dataKey="stepUpValue"
                          name="Step-Up Value"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={false}
                        />
                        {compareWithRegular && (
                          <Line
                            type="monotone"
                            dataKey="regularValue"
                            name="Regular Value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="stepUpInvested"
                          name="Step-Up Invested"
                          stroke="#8b5cf6"
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="annual" className="mt-0">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barChartData}
                        margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}K`}
                        />
                        <RechartsTooltip
                          formatter={(value) => [formatCurrency(value), 'Annual Deposit']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="Step-Up Annual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        {compareWithRegular && (
                          <Bar dataKey="Regular Annual" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="pie" className="mt-0">
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
            <CardTitle className="text-lg">Step-Up Progression Schedule</CardTitle>
            <CardDescription>
              Year-by-year monthly instalment changes, annual contributions, and compounding portfolio accumulation
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
                  <th className="py-3 px-4 text-right">Monthly SIP</th>
                  <th className="py-3 px-4 text-right">Annual Deposit</th>
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
                      <td className="py-2.5 px-4 text-right font-medium text-foreground">
                        {formatCurrency(row.monthlyAmount)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-muted-foreground">
                        {formatCurrency(row.annualContribution)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-muted-foreground">
                        {formatCurrency(row.cumulativeInvested)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        +{formatCurrency(row.estimatedGains)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-foreground">
                        {formatCurrency(row.estimatedValue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">
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
            <p className="font-semibold text-foreground">Understanding Step-Up SIP:</p>
            <p>
              A Step-Up SIP (top-up SIP) automatically raises your monthly investment by a predetermined percentage or fixed sum at the end of each year.
              Because annual salary increments often outpace inflation, increasing your SIP contribution can double or triple your wealth compared to a fixed SIP over a 15–20 year horizon without straining your cash flows early on.
            </p>
            <p>
              Calculations assume monthly compounding with year-end step-ups. Mutual fund investments are subject to market risks.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
