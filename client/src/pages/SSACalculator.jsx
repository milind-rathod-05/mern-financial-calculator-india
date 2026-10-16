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
import { calculateSSA } from '../utils/schemeCalculations';
import {
  Info,
  Download,
  Save,
  RefreshCw,
  Heart,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Baby,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SSACalculator() {
  const { saveCalculation } = useSavedCalculations();

  // Helper for default dates
  const defaultDates = useMemo(() => {
    const today = new Date();
    const openStr = today.toISOString().split('T')[0];
    const dobDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
    const dobStr = dobDate.toISOString().split('T')[0];
    return { openStr, dobStr };
  }, []);

  // Inputs
  const [dateOfBirth, setDateOfBirth] = useState(defaultDates.dobStr);
  const [accountOpeningDate, setAccountOpeningDate] = useState(defaultDates.openStr);
  const [annualDeposit, setAnnualDeposit] = useState(150000);
  const [interestRate, setInterestRate] = useState(8.2);
  const [calcName, setCalcName] = useState("Daughter's SSA Scheme");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time calculation
  const results = useMemo(() => {
    const deposit = Math.max(250, Math.min(150000, Number(annualDeposit) || 0));
    const rate = Math.max(1, Math.min(20, Number(interestRate) || 8.2));

    return calculateSSA({
      dateOfBirth,
      accountOpeningDate,
      annualDeposit: deposit,
      interestRate: rate,
    });
  }, [dateOfBirth, accountOpeningDate, annualDeposit, interestRate]);

  // Chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Total Deposits (15 Yrs)', value: results.totalDeposits || 0 },
      { name: 'Interest Accrued (21 Yrs)', value: Math.max(0, results.totalInterest || 0) },
    ];
  }, [results]);

  const lineChartData = useMemo(() => {
    return (results.yearWiseData || []).map((row) => ({
      year: `Yr ${row.year}`,
      'Account Balance': row.closingBalance,
      'Cumulative Deposits': (results.yearWiseData || [])
        .slice(0, row.year)
        .reduce((sum, r) => sum + r.deposit, 0),
      age: `Age ${row.childAge}`,
    }));
  }, [results]);

  const barChartData = useMemo(() => {
    return (results.yearWiseData || []).map((row) => ({
      year: `Yr ${row.year}`,
      Deposit: row.deposit,
      Interest: row.interest,
    }));
  }, [results]);

  // Reset handler
  const handleReset = () => {
    setDateOfBirth(defaultDates.dobStr);
    setAccountOpeningDate(defaultDates.openStr);
    setAnnualDeposit(150000);
    setInterestRate(8.2);
  };

  // Save calculation
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveCalculation({
        name: calcName.trim() || `SSA - ${formatCurrency(annualDeposit)}/yr`,
        type: 'ssa',
        inputs: {
          dateOfBirth,
          accountOpeningDate,
          annualDeposit,
          interestRate,
        },
        results: {
          totalDeposits: results.totalDeposits,
          totalInterest: results.totalInterest,
          maturityValue: results.maturityValue,
          maturityDate: results.maturityDate,
          eligible: results.eligible,
          ageAtOpening: results.ageAtOpening,
        },
        notes: `Sukanya Samriddhi Account for girl child born on ${dateOfBirth}. Deposit: ${formatCurrency(annualDeposit)}/yr for 15 years. Maturity corpus: ${formatCurrency(results.maturityValue)}`,
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
      'Financial Year': item.financialYear,
      "Child's Age": item.childAge,
      'Opening Balance (₹)': item.openingBalance,
      'Deposit (₹)': item.deposit,
      'Interest Credited (₹)': item.interest,
      'Closing Balance (₹)': item.closingBalance,
    }));
    exportToCSV(csvData, 'Sukanya_Samriddhi_Passbook');
  };

  const handleExportPDF = () => {
    exportToPDF('ssa-report', 'Sukanya Samriddhi Account (SSA) Report');
  };

  const presets = [25000, 50000, 100000, 150000];

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Sukanya Samriddhi Account (SSA) Calculator
            </h1>
            <p className="text-sm text-muted-foreground">
              Empower your daughter's future with the highest-yielding government savings scheme (8.2% p.a., 100% Tax-Free)
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

      {/* Eligibility Warning Banner */}
      {results.eligible !== undefined && (
        <div
          className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 text-sm ${
            results.eligible
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-500/30 text-amber-800 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {results.eligible ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <div>
              <span className="font-semibold">
                {results.eligible ? 'Eligibility Verified:' : 'Eligibility Alert:'}
              </span>{' '}
              {results.eligible ? (
                <>
                  Girl child age at opening is <strong>{results.ageAtOpening} years</strong> (Eligible: $\le$ 10 years).
                </>
              ) : (
                <>
                  Girl child age at opening is <strong>{results.ageAtOpening} years</strong>. Under SSA guidelines, the girl child must be 10 years or younger at account opening.
                </>
              )}
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-background border border-current">
            Maturity: {results.maturityDate}
          </span>
        </div>
      )}

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs */}
        <Card className="lg:col-span-5 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Account Details</CardTitle>
            <CardDescription>Enter child's birth date, opening date, and annual contribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date of Birth & Opening Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth" className="text-xs font-medium flex items-center gap-1">
                  <Baby className="h-3.5 w-3.5 text-muted-foreground" />
                  Child's Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="accountOpeningDate" className="text-xs font-medium flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Account Opening Date
                </Label>
                <Input
                  id="accountOpeningDate"
                  type="date"
                  value={accountOpeningDate}
                  onChange={(e) => setAccountOpeningDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Annual Deposit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="annualDeposit" className="font-medium text-sm">
                    Annual Deposit Amount
                  </Label>
                  <span className="block text-[11px] text-muted-foreground">Deposited for first 15 years</span>
                </div>
                <div className="w-32">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₹</span>
                    <Input
                      id="annualDeposit"
                      type="number"
                      min={250}
                      max={150000}
                      step={500}
                      value={annualDeposit}
                      onChange={(e) => setAnnualDeposit(Math.max(250, Math.min(150000, Number(e.target.value))))}
                      className="pl-6 h-9 text-right font-semibold"
                    />
                  </div>
                </div>
              </div>
              <input
                type="range"
                min={250}
                max={150000}
                step={500}
                value={annualDeposit}
                onChange={(e) => setAnnualDeposit(Number(e.target.value))}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹250 (Min)</span>
                <span>₹75,000</span>
                <span>₹1,50,000 (Max)</span>
              </div>
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {presets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAnnualDeposit(amt)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      annualDeposit === amt
                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                        : 'border-border text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="interestRate" className="font-medium text-sm">
                    SSA Interest Rate
                  </Label>
                  <span className="block text-[11px] text-muted-foreground">Govt Q3/Q4 Rate: 8.2% p.a.</span>
                </div>
                <div className="w-24">
                  <div className="relative">
                    <Input
                      id="interestRate"
                      type="number"
                      min={6}
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
                min={6}
                max={12}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>6.0%</span>
                <span>8.2% (Current Rate)</span>
                <span>12.0%</span>
              </div>
            </div>

            {/* SSA Timeline Structure Box */}
            <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2 text-xs">
              <div className="font-semibold text-foreground">Timeline Milestones:</div>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div className="p-2 rounded bg-background border border-border">
                  <span className="block font-semibold text-foreground">15 Years</span>
                  <span>Active deposit phase (Annual contributions)</span>
                </div>
                <div className="p-2 rounded bg-background border border-border">
                  <span className="block font-semibold text-foreground">21 Years</span>
                  <span>Maturity period (6 years interest-only growth)</span>
                </div>
              </div>
            </div>

            {/* Plan Name */}
            <div className="pt-2 border-t space-y-1.5">
              <Label htmlFor="calcName" className="text-xs text-muted-foreground">
                Save Calculation Label (Optional)
              </Label>
              <Input
                id="calcName"
                placeholder="e.g. Daughter's Higher Education Fund"
                value={calcName}
                onChange={(e) => setCalcName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Key Results & Visualizations */}
        <div className="lg:col-span-7 space-y-6" id="ssa-report">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Deposits
                </p>
                <p className="text-lg md:text-xl font-bold mt-1 text-foreground">
                  {formatCurrency(results.totalDeposits)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  15 annual installments
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
                  100% Tax-Free (EEE)
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/50 bg-primary/5 col-span-2 sm:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Total Maturity Value
                  </p>
                  <span className="text-[10px] bg-pink-600 text-white font-semibold px-2 py-0.5 rounded-full">
                    At Age 21
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold mt-1 text-primary">
                  {formatCurrency(results.maturityValue)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Maturity on {results.maturityDate} (21-year term)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Card */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">21-Year Corpus Evolution</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="growth" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="growth">21-Year Growth</TabsTrigger>
                  <TabsTrigger value="annual">Yearly Breakdown</TabsTrigger>
                  <TabsTrigger value="pie">Corpus Split</TabsTrigger>
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
                            name === 'Account Balance' ? 'Total Account Value' : 'Total Capital Deposited',
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
                          dataKey="Account Balance"
                          stroke="#ec4899"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Cumulative Deposits"
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
                        <Bar dataKey="Deposit" fill="#3b82f6" name="Annual Deposit" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Interest" fill="#ec4899" name="Annual Interest" radius={[4, 4, 0, 0]} />
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
                          <Cell fill="#ec4899" />
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

      {/* Year-Wise Passbook Table */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg">21-Year Passbook Statement</CardTitle>
            <CardDescription>
              Complete financial progression tracking deposits (Years 1–15), compounding (Years 16–21), and child's age
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
                  <th className="py-3 px-3">Year</th>
                  <th className="py-3 px-3">FY</th>
                  <th className="py-3 px-3">Child's Age</th>
                  <th className="py-3 px-3 text-right">Opening Balance</th>
                  <th className="py-3 px-3 text-right">Deposit</th>
                  <th className="py-3 px-3 text-right">Interest Credited</th>
                  <th className="py-3 px-3 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.yearWiseData && results.yearWiseData.length > 0 ? (
                  results.yearWiseData.map((row) => (
                    <tr
                      key={row.year}
                      className={`hover:bg-muted/40 transition-colors ${
                        !row.isDepositYear ? 'bg-muted/15' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium">Year {row.year}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{row.financialYear}</td>
                      <td className="py-2.5 px-3 text-xs font-medium">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {row.childAge} yrs
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {formatCurrency(row.openingBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {row.deposit > 0 ? (
                          <span className="font-medium text-foreground">{formatCurrency(row.deposit)}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No Deposit (Years 16-21)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        +{formatCurrency(row.interest)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">
                        {formatCurrency(row.closingBalance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-muted-foreground">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Scheme Rules & Notes Card */}
      <Card className="bg-muted/30 border-dashed border-border">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="h-5 w-5 text-pink-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="font-semibold text-foreground">Sukanya Samriddhi Yojana (SSY) Rules & Guidelines:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Eligibility:</strong> Account can be opened for any resident Indian girl child from birth up to 10 years of age. A family can open a maximum of two accounts (three in case of twins/triplets).
              </li>
              <li>
                <strong>Deposit Period:</strong> Deposits must be made for 15 years from account opening. Minimum ₹250, maximum ₹1,50,000 per financial year.
              </li>
              <li>
                <strong>Maturity Period:</strong> Account matures 21 years from account opening or upon the girl's marriage after attaining 18 years of age. During years 16–21, interest continues to compound without any mandatory deposit.
              </li>
              <li>
                <strong>Tax Status (EEE):</strong> Triple tax benefit: Deductible under Section 80C up to ₹1.5L, annual interest earned is tax-exempt, and full maturity corpus is 100% tax-free under Section 10(10D).
              </li>
              <li>
                <strong>Partial Withdrawal:</strong> Up to 50% of the balance at the end of the previous FY can be withdrawn after the girl child turns 18 for higher education expenses.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
