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
import { calculatePPF } from '../utils/schemeCalculations';
import {
  Info,
  Download,
  Save,
  RefreshCw,
  Landmark,
  CheckCircle,
  ShieldCheck,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PPFCalculator() {
  const { saveCalculation } = useSavedCalculations();

  // Inputs
  const [currentBalance, setCurrentBalance] = useState(0);
  const [annualContribution, setAnnualContribution] = useState(150000);
  const [interestRate, setInterestRate] = useState(7.1);
  const [years, setYears] = useState(15);
  const [contributionSchedule, setContributionSchedule] = useState('yearly-start');
  const [calcName, setCalcName] = useState('My PPF Account');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time calculation
  const results = useMemo(() => {
    const bal = Math.max(0, Number(currentBalance) || 0);
    const contrib = Math.max(500, Math.min(150000, Number(annualContribution) || 0));
    const rate = Math.max(1, Math.min(15, Number(interestRate) || 7.1));
    const y = Number(years) || 15;

    return calculatePPF({
      currentBalance: bal,
      annualContribution: contrib,
      interestRate: rate,
      years: y,
      contributionSchedule,
    });
  }, [currentBalance, annualContribution, interestRate, years, contributionSchedule]);

  // Chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Total Contributions', value: results.totalContributions || 0 },
      { name: 'Total Interest Earned', value: Math.max(0, results.totalInterest || 0) },
    ];
  }, [results]);

  const lineChartData = useMemo(() => {
    return (results.yearWiseData || []).map((row) => ({
      year: `Yr ${row.year}`,
      'Closing Balance': row.closingBalance,
      'Total Deposits': row.openingBalance + row.contribution,
      'Annual Interest': row.interest,
    }));
  }, [results]);

  const barChartData = useMemo(() => {
    return (results.yearWiseData || []).map((row) => ({
      year: `Yr ${row.year}`,
      Contribution: row.contribution,
      Interest: row.interest,
    }));
  }, [results]);

  // Reset
  const handleReset = () => {
    setCurrentBalance(0);
    setAnnualContribution(150000);
    setInterestRate(7.1);
    setYears(15);
    setContributionSchedule('yearly-start');
  };

  // Save calculation
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveCalculation({
        name: calcName.trim() || `PPF - ${formatCurrency(annualContribution)}/yr (${years}y)`,
        type: 'ppf',
        inputs: {
          currentBalance,
          annualContribution,
          interestRate,
          years,
          contributionSchedule,
        },
        results: {
          totalContributions: results.totalContributions,
          totalInterest: results.totalInterest,
          maturityValue: results.maturityValue,
        },
        notes: `PPF investment of ${formatCurrency(annualContribution)} per year for ${years} years at ${interestRate}% p.a.`,
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
      'Opening Balance (₹)': item.openingBalance,
      'Annual Contribution (₹)': item.contribution,
      'Interest Earned (₹)': item.interest,
      'Closing Balance (₹)': item.closingBalance,
    }));
    exportToCSV(csvData, 'PPF_Schedule_Report');
  };

  const handleExportPDF = () => {
    exportToPDF('ppf-report', 'Public Provident Fund (PPF) Statement Report');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              PPF Calculator
              <span className="text-xs bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> EEE Tax-Exempt
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Calculate government-guaranteed tax-free returns and interest accruals on Public Provident Fund
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
            <CardTitle className="text-lg">PPF Contribution Settings</CardTitle>
            <CardDescription>Configure deposits, balance, and tenure (15, 20, or 25 years)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing PPF Balance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="currentBalance" className="font-medium text-sm">
                  Existing PPF Balance (Optional)
                </Label>
                <div className="w-32">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span>
                    <Input
                      id="currentBalance"
                      type="number"
                      min={0}
                      max={5000000}
                      step={5000}
                      value={currentBalance}
                      onChange={(e) => setCurrentBalance(Math.max(0, Number(e.target.value)))}
                      className="pl-6 h-9 text-right font-semibold"
                    />
                  </div>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={2000000}
                step={10000}
                value={currentBalance}
                onChange={(e) => setCurrentBalance(Number(e.target.value))}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹0 (New Account)</span>
                <span>₹10,00,000</span>
                <span>₹20,00,000</span>
              </div>
            </div>

            {/* Annual Contribution */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="annualContribution" className="font-medium text-sm">
                    Annual Contribution
                  </Label>
                  <span className="block text-[11px] text-muted-foreground">Max ₹1.5 Lakh / FY (80C limit)</span>
                </div>
                <div className="w-32">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span>
                    <Input
                      id="annualContribution"
                      type="number"
                      min={500}
                      max={150000}
                      step={500}
                      value={annualContribution}
                      onChange={(e) => setAnnualContribution(Math.max(500, Math.min(150000, Number(e.target.value))))}
                      className="pl-6 h-9 text-right font-semibold"
                    />
                  </div>
                </div>
              </div>
              <input
                type="range"
                min={500}
                max={150000}
                step={500}
                value={annualContribution}
                onChange={(e) => setAnnualContribution(Number(e.target.value))}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹500 (Min)</span>
                <span>₹75,000</span>
                <span>₹1,50,000 (Max)</span>
              </div>
            </div>

            {/* Contribution Timing */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Deposit Schedule & Timing
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'yearly-start', label: 'Start of Year (April)', desc: 'Max Interest' },
                  { id: 'monthly', label: 'Monthly Deposits', desc: '12 Installments' },
                  { id: 'yearly-end', label: 'End of Year (March)', desc: 'Min Interest' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setContributionSchedule(item.id)}
                    className={`p-2 rounded-md border text-left transition-colors ${
                      contributionSchedule === item.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent border-input text-foreground'
                    }`}
                  >
                    <span className="block text-xs font-medium leading-tight">{item.label}</span>
                    <span className={`block text-[10px] mt-0.5 ${contributionSchedule === item.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tip: Depositing before the 5th of April earns you full interest for the entire financial year.
              </p>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="interestRate" className="font-medium text-sm">
                    PPF Interest Rate
                  </Label>
                  <span className="block text-[11px] text-muted-foreground">Current Govt Rate: 7.1% p.a.</span>
                </div>
                <div className="w-24">
                  <div className="relative">
                    <Input
                      id="interestRate"
                      type="number"
                      min={5}
                      max={12}
                      step={0.1}
                      value={interestRate}
                      onChange={(e) => setInterestRate(Math.max(1, Math.min(15, Number(e.target.value))))}
                      className="pr-6 h-9 text-right font-semibold"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              <input
                type="range"
                min={5}
                max={12}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5.0%</span>
                <span>7.1% (Current)</span>
                <span>12.0%</span>
              </div>
            </div>

            {/* Duration (Block of 5 years: 15, 20, 25) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tenure (15-Year Mandatory Lock-In + Extensions)
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 20, 25].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYears(y)}
                    className={`py-2 px-3 rounded-md text-sm font-semibold border transition-colors ${
                      years === y
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background hover:bg-accent border-input text-foreground'
                    }`}
                  >
                    {y} Years {y === 15 ? '(Base)' : `(+${y - 15}y)`}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                PPF accounts can be extended indefinitely in 5-year blocks upon maturity with continued deposits.
              </p>
            </div>

            {/* Calculation Label */}
            <div className="pt-2 border-t space-y-1.5">
              <Label htmlFor="calcName" className="text-xs text-muted-foreground">
                Calculation Label (Optional)
              </Label>
              <Input
                id="calcName"
                placeholder="e.g. 15-Year Tax Saver PPF"
                value={calcName}
                onChange={(e) => setCalcName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Key Results & Visualizations */}
        <div className="lg:col-span-7 space-y-6" id="ppf-report">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Deposits
                </p>
                <p className="text-lg md:text-xl font-bold mt-1 text-foreground">
                  {formatCurrency(results.totalContributions)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Over {years} years
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Interest
                </p>
                <p className="text-lg md:text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(results.totalInterest)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  100% Tax-Free
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/50 bg-primary/5 col-span-2 sm:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Total Maturity Corpus
                  </p>
                  <span className="text-[10px] bg-emerald-600 text-white font-semibold px-2 py-0.5 rounded-full">
                    Sovereign Guarantee
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold mt-1 text-primary">
                  {formatCurrency(results.maturityValue)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Full maturity payout exempt under Sec 10(10D)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Card */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">PPF Corpus Growth & Accumulation</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="balance" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="balance">Corpus Growth</TabsTrigger>
                  <TabsTrigger value="annual">Yearly Interest</TabsTrigger>
                  <TabsTrigger value="pie">Principal vs Interest</TabsTrigger>
                </TabsList>

                <TabsContent value="balance" className="mt-0">
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
                            name === 'Closing Balance'
                              ? 'PPF Balance'
                              : name === 'Total Deposits'
                              ? 'Total Invested'
                              : 'Interest Earned',
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
                          dataKey="Closing Balance"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Total Deposits"
                          stroke="#3b82f6"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
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
                          formatter={(value) => [formatCurrency(value), '']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="Contribution" fill="#3b82f6" name="Annual Deposit" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Interest" fill="#10b981" name="Interest Credited" radius={[4, 4, 0, 0]} />
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
            <CardTitle className="text-lg">Year-Wise PPF Passbook Statement</CardTitle>
            <CardDescription>
              Detailed statement showing opening balance, annual contribution, interest accrued, and closing balance
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
                  <th className="py-3 px-4 text-right">Opening Balance</th>
                  <th className="py-3 px-4 text-right">Annual Deposit</th>
                  <th className="py-3 px-4 text-right">Interest Credited</th>
                  <th className="py-3 px-4 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.yearWiseData && results.yearWiseData.length > 0 ? (
                  results.yearWiseData.map((row) => (
                    <tr key={row.year} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-4 font-medium">Year {row.year}</td>
                      <td className="py-2.5 px-4 text-right text-muted-foreground">
                        {formatCurrency(row.openingBalance)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-foreground">
                        {formatCurrency(row.contribution)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        +{formatCurrency(row.interest)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-foreground">
                        {formatCurrency(row.closingBalance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-muted-foreground">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* PPF Rules & Information Card */}
      <Card className="bg-muted/30 border-dashed border-border">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="font-semibold text-foreground">Key PPF Scheme Rules & Tax Benefits:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Deposit Limit:</strong> Minimum deposit is ₹500 and maximum is ₹1,50,000 in a financial year. Any deposit beyond ₹1.5L will not earn any interest.
              </li>
              <li>
                <strong>Exempt-Exempt-Exempt (EEE):</strong> Contributions qualify for deduction under Section 80C, annual interest earned is 100% tax-free, and maturity amount is completely exempt from income tax.
              </li>
              <li>
                <strong>Interest Calculation:</strong> Interest is calculated on the minimum balance between the 5th day and the last day of each month, compounded annually and credited on March 31st.
              </li>
              <li>
                <strong>Tenure & Extensions:</strong> Initial lock-in is 15 complete financial years. It can be extended indefinitely in blocks of 5 years with or without additional contributions.
              </li>
              <li>
                <strong>Liquidity & Loans:</strong> Loan facility is available from the 3rd to 6th financial year. Partial tax-free withdrawals are permitted from the 7th financial year onwards.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
