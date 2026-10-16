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
  AreaChart,
  Area,
} from 'recharts';
import { formatCurrency, formatPercent } from '../utils/currencyFormatter';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { useSavedCalculations } from '../contexts/SavedCalculationsContext';
import { calculateEMI, generateAmortization, LOAN_PRESETS } from '../utils/loanCalculations';
import {
  Info,
  Download,
  Save,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

const getTodayDate = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export default function LoanEMICalculator({ initialLoanType = 'home' }) {
  const { saveCalculation } = useSavedCalculations();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [calcName, setCalcName] = useState('My Loan EMI');

  // Loan Type
  const [loanType, setLoanType] = useState(initialLoanType);

  // Core Inputs
  const [loanAmount, setLoanAmount] = useState(LOAN_PRESETS[initialLoanType]?.defaultAmount || 5000000);
  const [annualRate, setAnnualRate] = useState(LOAN_PRESETS[initialLoanType]?.defaultRate || 8.5);
  const [years, setYears] = useState(LOAN_PRESETS[initialLoanType]?.defaultYears || 20);
  const [months, setMonths] = useState(0);

  // Advanced Inputs
  const [processingFeePercent, setProcessingFeePercent] = useState(0.5);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(0);
  const [startDate, setStartDate] = useState(getTodayDate());
  const [prepaymentMode, setPrepaymentMode] = useState('reduce-tenure'); // 'reduce-tenure' or 'reduce-emi'

  // Lump sum prepayments: [{ id: 1, month: 12, amount: 100000 }]
  const [prepayments, setPrepayments] = useState([]);

  // Amortization Schedule View Controls
  const [showSchedule, setShowSchedule] = useState(false);
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'yearly'
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 24;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');

  // Handle Preset Change
  const handleLoanTypeChange = (newType) => {
    setLoanType(newType);
    if (newType !== 'custom' && LOAN_PRESETS[newType]) {
      setLoanAmount(LOAN_PRESETS[newType].defaultAmount);
      setAnnualRate(LOAN_PRESETS[newType].defaultRate);
      setYears(LOAN_PRESETS[newType].defaultYears);
      setMonths(0);
      setCalcName(`${LOAN_PRESETS[newType].name} Calculation`);
    }
  };

  // Add Prepayment
  const handleAddPrepayment = () => {
    const nextMonth = prepayments.length > 0 ? prepayments[prepayments.length - 1].month + 12 : 12;
    setPrepayments([
      ...prepayments,
      {
        id: Date.now().toString(),
        month: nextMonth,
        amount: Math.round(loanAmount * 0.05),
      },
    ]);
  };

  const handleRemovePrepayment = (id) => {
    setPrepayments(prepayments.filter((p) => p.id !== id));
  };

  const handlePrepaymentChange = (id, field, value) => {
    setPrepayments(
      prepayments.map((p) => (p.id === id ? { ...p, [field]: Number(value) || 0 } : p))
    );
  };

  // Generate Calculations
  const amortizationData = useMemo(() => {
    return generateAmortization({
      loanAmount,
      annualRate,
      years,
      months,
      extraMonthlyPayment,
      prepayments: prepayments.map((p) => ({ month: p.month, amount: p.amount })),
      prepaymentMode,
      startDate: new Date(startDate || Date.now()),
    });
  }, [loanAmount, annualRate, years, months, extraMonthlyPayment, prepayments, prepaymentMode, startDate]);

  const { schedule, yearlySummary, summary } = amortizationData;

  // Processing Fee
  const processingFeeAmount = useMemo(() => {
    return (Number(loanAmount) * (Number(processingFeePercent) || 0)) / 100;
  }, [loanAmount, processingFeePercent]);

  // Pie chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Principal Amount', value: summary.totalPrincipal || loanAmount },
      { name: 'Total Interest', value: summary.totalInterest || 0 },
      ...(summary.totalExtraPayments > 0
        ? [{ name: 'Prepayments & Extra', value: summary.totalExtraPayments }]
        : []),
    ];
  }, [summary, loanAmount]);

  // Line chart & Area chart data (downsampled for smooth rendering if many months)
  const chartTimelineData = useMemo(() => {
    if (!schedule || schedule.length === 0) return [];
    // If long schedule (> 60 months), sample quarterly or use yearly
    if (schedule.length > 60) {
      return yearlySummary.map((y) => ({
        label: `Year ${y.year}`,
        balance: y.closingBalance,
        principal: y.principal,
        interest: y.interest,
      }));
    }
    return schedule.map((row) => ({
      label: `M${row.emiNumber}`,
      balance: row.closingBalance,
      principal: row.principal,
      interest: row.interest,
    }));
  }, [schedule, yearlySummary]);

  // Filtered schedule for table
  const filteredSchedule = useMemo(() => {
    if (viewMode === 'yearly') {
      return yearlySummary.filter((row) => {
        if (searchQuery && !String(row.year).includes(searchQuery)) return false;
        return true;
      });
    }

    return schedule.filter((row) => {
      const year = new Date(row.paymentDate).getFullYear();
      if (selectedYearFilter !== 'all' && String(year) !== selectedYearFilter) return false;
      if (searchQuery) {
        const matchesQuery =
          String(row.emiNumber).includes(searchQuery) ||
          row.paymentDate.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [schedule, yearlySummary, viewMode, selectedYearFilter, searchQuery]);

  // Paginated schedule
  const totalPages = Math.ceil(filteredSchedule.length / rowsPerPage) || 1;
  const paginatedSchedule = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredSchedule.slice(start, start + rowsPerPage);
  }, [filteredSchedule, currentPage]);

  // Available years for dropdown
  const availableYears = useMemo(() => {
    const set = new Set();
    schedule.forEach((row) => {
      const yr = new Date(row.paymentDate).getFullYear();
      if (yr) set.add(String(yr));
    });
    return Array.from(set).sort();
  }, [schedule]);

  // Export handlers
  const handleExportCSV = () => {
    const dataToExport = schedule.map((row) => ({
      'EMI Number': row.emiNumber,
      'Payment Date': row.paymentDate,
      'Opening Balance (₹)': row.openingBalance,
      'EMI Amount (₹)': row.emiAmount,
      'Principal Component (₹)': row.principal,
      'Interest Component (₹)': row.interest,
      'Extra Prepayment (₹)': row.extraPayment,
      'Total Principal Paid (₹)': row.totalPrincipalPaid,
      'Closing Balance (₹)': row.closingBalance,
    }));
    exportToCSV(dataToExport, `loan_amortization_${loanType}`);
  };

  const handleExportPDF = () => {
    exportToPDF('loan-calculator-report', `${loanType.toUpperCase()} Loan EMI Schedule`);
  };

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: calcName || 'Loan EMI Calculation',
        type: loanType === 'home' ? 'home-loan' : loanType === 'personal' ? 'personal-loan' : loanType === 'car' ? 'car-loan' : loanType === 'education' ? 'education-loan' : 'loan-emi',
        inputs: {
          loanType,
          loanAmount,
          annualRate,
          years,
          months,
          extraMonthlyPayment,
          prepayments,
          prepaymentMode,
          startDate,
        },
        results: {
          monthlyEMI: summary.currentEMI,
          totalPrincipal: summary.totalPrincipal,
          totalInterest: summary.totalInterest,
          totalPayment: summary.totalPayment,
          payoffDate: summary.payoffDate,
          interestSaved: summary.interestSaved,
          monthsReduced: summary.monthsReduced,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save calculation:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12" id="loan-calculator-report">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Loan EMI Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate your monthly loan payments, interest liability, prepayments, and complete amortization schedule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
            <Printer className="h-4 w-4" /> PDF
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className={`gap-2 ${saveSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
          >
            {saveSuccess ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saveSuccess ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Loan Type Presets Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-muted rounded-xl overflow-x-auto">
        {Object.entries(LOAN_PRESETS).map(([key, val]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleLoanTypeChange(key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              loanType === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {val.name}
          </button>
        ))}
      </div>

      {/* Main Grid: Inputs vs Result Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Loan Input Parameters */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Loan Parameters</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 pt-4">
              {/* Loan Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium text-muted-foreground">Loan Amount</Label>
                  <span className="text-xs font-bold text-primary font-mono">
                    {formatCurrency(loanAmount)}
                  </span>
                </div>
                <Input
                  type="number"
                  min={10000}
                  max={100000000}
                  step={50000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                  className="font-mono text-sm"
                />
                <input
                  type="range"
                  min={100000}
                  max={20000000}
                  step={50000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>₹1 Lakh</span>
                  <span>₹50 Lakh</span>
                  <span>₹1 Crore</span>
                  <span>₹2 Crore</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium text-muted-foreground">Annual Interest Rate (%)</Label>
                  <span className="text-xs font-bold text-primary font-mono">{annualRate}%</span>
                </div>
                <Input
                  type="number"
                  step="0.05"
                  min={1}
                  max={30}
                  value={annualRate}
                  onChange={(e) => setAnnualRate(Number(e.target.value) || 0)}
                  className="font-mono text-sm"
                />
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={0.1}
                  value={annualRate}
                  onChange={(e) => setAnnualRate(Number(e.target.value) || 0)}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>5%</span>
                  <span>8.5%</span>
                  <span>12%</span>
                  <span>16%</span>
                  <span>20%</span>
                </div>
              </div>

              {/* Tenure */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium text-muted-foreground">Loan Tenure (Years & Months)</Label>
                  <span className="text-xs font-bold text-primary font-mono">
                    {years} Yr {months > 0 ? `${months} Mo` : ''} ({years * 12 + months} Mos)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Years</Label>
                    <Input
                      type="number"
                      min={1}
                      max={35}
                      value={years}
                      onChange={(e) => setYears(Math.max(1, Number(e.target.value) || 1))}
                      className="font-mono text-sm mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Additional Months</Label>
                    <Input
                      type="number"
                      min={0}
                      max={11}
                      value={months}
                      onChange={(e) => setMonths(Math.max(0, Math.min(11, Number(e.target.value) || 0)))}
                      className="font-mono text-sm mt-0.5"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value) || 1)}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Additional Options */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t text-xs">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Processing Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    value={processingFeePercent}
                    onChange={(e) => setProcessingFeePercent(Number(e.target.value) || 0)}
                    className="h-8 text-xs font-mono mt-1"
                  />
                  {processingFeeAmount > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Fee: {formatCurrency(processingFeeAmount)}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Repayment Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-xs font-mono mt-1"
                  />
                </div>
              </div>

              {/* Extra Payment & Prepayment Strategy */}
              <div className="pt-3 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Prepayment & Faster Payoff</Label>
                  <select
                    value={prepaymentMode}
                    onChange={(e) => setPrepaymentMode(e.target.value)}
                    className="text-[11px] bg-background border rounded px-2 py-1 text-foreground"
                  >
                    <option value="reduce-tenure">Reduce Tenure (Same EMI)</option>
                    <option value="reduce-emi">Reduce Monthly EMI</option>
                  </select>
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">Extra Monthly Payment (₹)</Label>
                  <Input
                    type="number"
                    step="1000"
                    min={0}
                    value={extraMonthlyPayment}
                    onChange={(e) => setExtraMonthlyPayment(Number(e.target.value) || 0)}
                    placeholder="e.g. 5000"
                    className="h-8 text-xs font-mono mt-1"
                  />
                </div>

                {/* Lump sum prepayments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Lump-sum Prepayments ({prepayments.length})
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddPrepayment}
                      className="h-6 text-[11px] px-2 gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Prepayment
                    </Button>
                  </div>

                  {prepayments.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 p-1.5 border rounded bg-muted/40">
                      <div className="w-24">
                        <Input
                          type="number"
                          min={1}
                          max={years * 12 + months}
                          value={p.month}
                          onChange={(e) => handlePrepaymentChange(p.id, 'month', e.target.value)}
                          className="h-7 text-xs font-mono"
                          placeholder="Month #"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="10000"
                          value={p.amount}
                          onChange={(e) => handlePrepaymentChange(p.id, 'amount', e.target.value)}
                          className="h-7 text-xs font-mono"
                          placeholder="Amount"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePrepayment(p.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Result Cards & Charts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main EMI Highlight Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm sm:col-span-2">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Monthly EMI
                    </p>
                    <p className="text-4xl font-extrabold tracking-tight text-primary font-mono mt-1">
                      {formatCurrency(summary.currentEMI || summary.originalEMI)}
                    </p>
                    {extraMonthlyPayment > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        + {formatCurrency(extraMonthlyPayment)} extra/mo = {formatCurrency((summary.currentEMI || summary.originalEMI) + extraMonthlyPayment)} total
                      </p>
                    )}
                  </div>

                  <div className="text-right sm:border-l sm:pl-6 space-y-1">
                    <p className="text-xs text-muted-foreground">Estimated Payoff Date</p>
                    <p className="text-lg font-bold font-mono text-foreground">
                      {summary.payoffDate || 'N/A'}
                    </p>
                    {summary.monthsReduced > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        <TrendingDown className="h-3 w-3" /> {summary.monthsReduced} months sooner!
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t mt-4 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">Total Principal</p>
                    <p className="font-semibold font-mono text-foreground mt-0.5">
                      {formatCurrency(summary.totalPrincipal)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">Total Interest</p>
                    <p className="font-semibold font-mono text-orange-600 dark:text-orange-400 mt-0.5">
                      {formatCurrency(summary.totalInterest)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">Total Repayment</p>
                    <p className="font-semibold font-mono text-foreground mt-0.5">
                      {formatCurrency(summary.totalPayment)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">Interest Saved</p>
                    <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(summary.interestSaved || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie Chart: Principal vs Interest */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Repayment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Area Chart: Balance Reduction */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Outstanding Loan Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartTimelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis
                        tickFormatter={(v) => `₹${v >= 10000000 ? (v / 10000000).toFixed(1) + 'Cr' : v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v}`}
                        tick={{ fontSize: 10 }}
                      />
                      <RechartsTooltip formatter={(v) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="balance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Button to Open Amortization Table */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
            <div>
              <p className="font-semibold text-sm">Amortization Schedule</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Examine month-by-month or year-by-year principal, interest, and remaining balance breakdown.
              </p>
            </div>
            <Button
              onClick={() => setShowSchedule(!showSchedule)}
              variant={showSchedule ? 'outline' : 'default'}
              size="sm"
              className="gap-2"
            >
              {showSchedule ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showSchedule ? 'Hide Schedule' : 'View Schedule'}
            </Button>
          </div>
        </div>
      </div>

      {/* Full Amortization Schedule Section */}
      {showSchedule && (
        <Card className="shadow-md border overflow-hidden mt-6">
          <CardHeader className="border-b bg-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Loan Amortization Schedule</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Detailed payment breakdown over the complete loan lifecycle.
                </p>
              </div>

              {/* View Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Monthly / Yearly Toggle */}
                <div className="inline-flex rounded-lg border bg-muted p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('monthly');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      viewMode === 'monthly' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Monthly View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('yearly');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      viewMode === 'yearly' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Yearly Summary
                  </button>
                </div>

                {/* Year filter (if monthly view) */}
                {viewMode === 'monthly' && (
                  <select
                    value={selectedYearFilter}
                    onChange={(e) => {
                      setSelectedYearFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-8 text-xs bg-background border rounded px-2"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        Year {yr}
                      </option>
                    ))}
                  </select>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search # or date..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-8 pl-8 text-xs w-36"
                  />
                </div>
              </div>
            </div>

            {/* Summary Row above Table */}
            <div className="grid grid-cols-3 gap-4 pt-3 mt-2 border-t text-xs">
              <div>
                <span className="text-muted-foreground">Total Principal Paid: </span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(summary.totalPrincipal)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Interest Paid: </span>
                <span className="font-mono font-bold text-orange-600">
                  {formatCurrency(summary.totalInterest)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Extra Prepayments: </span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatCurrency(summary.totalExtraPayments)}
                </span>
              </div>
            </div>
          </CardHeader>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted sticky top-0 z-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {viewMode === 'monthly' ? (
                  <tr>
                    <th className="p-3">EMI #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Opening Balance</th>
                    <th className="p-3 text-right">EMI Amount</th>
                    <th className="p-3 text-right">Principal</th>
                    <th className="p-3 text-right">Interest</th>
                    <th className="p-3 text-right">Extra Payment</th>
                    <th className="p-3 text-right">Total Principal Paid</th>
                    <th className="p-3 text-right">Closing Balance</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="p-3">Calendar Year</th>
                    <th className="p-3 text-right">Principal Paid</th>
                    <th className="p-3 text-right">Interest Paid</th>
                    <th className="p-3 text-right">Extra Prepayments</th>
                    <th className="p-3 text-right">Total Payment</th>
                    <th className="p-3 text-right">Closing Balance</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-border">
                {viewMode === 'monthly'
                  ? paginatedSchedule.map((row) => (
                      <tr key={row.emiNumber} className="hover:bg-muted/40 transition-colors">
                        <td className="p-3 font-semibold font-mono text-muted-foreground">{row.emiNumber}</td>
                        <td className="p-3 font-mono">{row.paymentDate}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(row.openingBalance)}</td>
                        <td className="p-3 text-right font-mono font-semibold">{formatCurrency(row.emiAmount)}</td>
                        <td className="p-3 text-right font-mono text-blue-600 dark:text-blue-400">
                          {formatCurrency(row.principal)}
                        </td>
                        <td className="p-3 text-right font-mono text-orange-600 dark:text-orange-400">
                          {formatCurrency(row.interest)}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {row.extraPayment > 0 ? formatCurrency(row.extraPayment) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono">{formatCurrency(row.totalPrincipalPaid)}</td>
                        <td className="p-3 text-right font-mono font-bold text-foreground">
                          {formatCurrency(row.closingBalance)}
                        </td>
                      </tr>
                    ))
                  : filteredSchedule.map((row) => (
                      <tr key={row.year} className="hover:bg-muted/40 transition-colors">
                        <td className="p-3 font-bold font-mono text-foreground">Year {row.year}</td>
                        <td className="p-3 text-right font-mono text-blue-600 dark:text-blue-400">
                          {formatCurrency(row.principal)}
                        </td>
                        <td className="p-3 text-right font-mono text-orange-600 dark:text-orange-400">
                          {formatCurrency(row.interest)}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {row.extraPayment > 0 ? formatCurrency(row.extraPayment) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold">
                          {formatCurrency(row.totalPayment)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-foreground">
                          {formatCurrency(row.closingBalance)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Monthly View */}
          {viewMode === 'monthly' && totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t bg-card text-xs">
              <span className="text-muted-foreground">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to{' '}
                {Math.min(currentPage * rowsPerPage, filteredSchedule.length)} of {filteredSchedule.length} rows
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 font-mono font-medium">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Disclaimers */}
      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="pt-6">
          <div className="flex gap-3 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
            <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">Loan EMI Calculation Terms & Notes</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  EMI calculations assume monthly compounding as standard practice in Indian banking and housing finance institutions.
                </li>
                <li>
                  Applicable GST, stamp duty, mortgage registration, and bank processing charges are subject to statutory revisions.
                </li>
                <li>
                  Floating interest rates can adjust upwards or downwards depending on changes in the RBI Repo Linked Lending Rate (RLLR).
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
