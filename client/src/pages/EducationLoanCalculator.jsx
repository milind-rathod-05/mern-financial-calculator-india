import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { formatCurrency } from '../utils/currencyFormatter';
import { calculateEMI, generateAmortization } from '../utils/loanCalculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { useSavedCalculations } from '../contexts/SavedCalculationsContext';
import { ArrowRight, Info, Save, FileSpreadsheet, Printer, CheckCircle2, GraduationCap, ShieldCheck } from 'lucide-react';

const COLORS = ['#3b82f6', '#f59e0b'];

export default function EducationLoanCalculator() {
  const navigate = useNavigate();
  const { saveCalculation } = useSavedCalculations();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Defaults: ₹10,00,000, 8%, 10 years
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [rate, setRate] = useState(8.0);
  const [years, setYears] = useState(10);

  const result = useMemo(() => calculateEMI({ loanAmount, annualRate: rate, years }), [loanAmount, rate, years]);

  const previewSchedule = useMemo(() => {
    const amort = generateAmortization({ loanAmount, annualRate: rate, years });
    return amort.yearlySummary.slice(0, 5);
  }, [loanAmount, rate, years]);

  const chartData = [
    { name: 'Tuition & Living Principal', value: result.principal },
    { name: 'Total Interest Payable', value: result.totalInterest },
  ];

  // Section 80E estimated tax savings (assuming 30% tax bracket)
  const estimatedTaxSavings = useMemo(() => {
    // Section 80E allows entire interest deduction for up to 8 years
    // Approx interest in first 8 years
    const amort = generateAmortization({ loanAmount, annualRate: rate, years });
    const first8YearsInterest = amort.yearlySummary
      .slice(0, 8)
      .reduce((acc, curr) => acc + curr.interest, 0);
    return Math.round(first8YearsInterest * 0.312); // 30% + 4% cess = 31.2%
  }, [loanAmount, rate, years]);

  const handleExportCSV = () => {
    const rows = [
      { Metric: 'Loan Type', Value: 'Education Loan' },
      { Metric: 'Loan Amount (₹)', Value: loanAmount },
      { Metric: 'Annual Interest Rate (%)', Value: `${rate}%` },
      { Metric: 'Tenure (Years)', Value: years },
      { Metric: 'Monthly EMI (₹)', Value: result.emi },
      { Metric: 'Total Interest (₹)', Value: result.totalInterest },
      { Metric: 'Total Payment (₹)', Value: result.totalPayment },
      { Metric: 'Est. Section 80E Tax Savings (30% slab)', Value: estimatedTaxSavings },
    ];
    exportToCSV(rows, 'education_loan_summary');
  };

  const handleExportPDF = () => {
    exportToPDF('education-loan-report-container', 'Education Loan EMI Report');
  };

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `Education Loan - ${formatCurrency(loanAmount)}`,
        type: 'education-loan',
        inputs: { loanAmount, rate, years },
        results: {
          emi: result.emi,
          totalPrincipal: result.principal,
          totalInterest: result.totalInterest,
          totalPayment: result.totalPayment,
          estimatedTaxSavings,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save education loan:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12" id="education-loan-report-container">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Education Loan EMI Calculator
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Calculate student loan repayment EMIs, interest liability, and Section 80E tax deduction benefits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
            <FileSpreadsheet className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5 text-xs">
            <Printer className="h-4 w-4" /> PDF
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className={`gap-1.5 text-xs ${saveSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
          >
            {saveSuccess ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saveSuccess ? 'Saved' : 'Save'}
          </Button>
          <Button onClick={() => navigate('/emi')} variant="default" size="sm" className="gap-1.5 text-xs">
            Full EMI Calculator <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Loan Details Input */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold">Student Loan Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div>
              <div className="flex justify-between items-center text-xs">
                <Label>Loan Amount (Domestic / Abroad)</Label>
                <span className="font-mono font-bold text-primary">{formatCurrency(loanAmount)}</span>
              </div>
              <Input
                type="number"
                min={50000}
                max={20000000}
                step={50000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                className="mt-1 font-mono text-sm"
              />
              <input
                type="range"
                min={200000}
                max={10000000}
                step={50000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>₹2 Lakh</span>
                <span>₹50 Lakh (Abroad)</span>
                <span>₹1 Crore</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs">
                <Label>Interest Rate (% p.a.)</Label>
                <span className="font-mono font-bold text-primary">{rate}%</span>
              </div>
              <Input
                type="number"
                step="0.05"
                min={6}
                max={16}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value) || 0)}
                className="mt-1 font-mono text-sm"
              />
              <input
                type="range"
                min={6.5}
                max={14}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value) || 0)}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>7.5% (Concessional)</span>
                <span>8.5% (SBI Scholar)</span>
                <span>13%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs">
                <Label>Repayment Tenure (Years)</Label>
                <span className="font-mono font-bold text-primary">{years} Years ({years * 12} Months)</span>
              </div>
              <Input
                type="number"
                min={1}
                max={15}
                value={years}
                onChange={(e) => setYears(Math.max(1, Math.min(15, Number(e.target.value) || 1)))}
                className="mt-1 font-mono text-sm"
              />
              <input
                type="range"
                min={1}
                max={15}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value) || 1)}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>3 Yrs</span>
                <span>10 Yrs (Default)</span>
                <span>15 Yrs (Max)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Col 2: EMI Results Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold">Repayment Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Post-Moratorium EMI</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-primary font-mono mt-1">
                {formatCurrency(result.emi)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Per month for {years} years</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-[10px] text-muted-foreground">Tuition / Living Loan</p>
                <p className="font-semibold font-mono text-sm mt-0.5">{formatCurrency(result.principal)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-[10px] text-muted-foreground">Total Interest</p>
                <p className="font-semibold font-mono text-sm text-orange-600 dark:text-orange-400 mt-0.5">
                  {formatCurrency(result.totalInterest)}
                </p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-muted/80">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Total Amount Payable</p>
                    <p className="font-bold font-mono text-base mt-0.5">{formatCurrency(result.totalPayment)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-emerald-600 font-semibold">Section 80E Savings</p>
                    <p className="font-mono text-xs font-bold text-emerald-600 mt-0.5">
                      ~{formatCurrency(estimatedTaxSavings)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Col 3: Payment Breakdown Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold">Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Benefits Section: 80E Card */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Section 80E Tax Deduction Advantage</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">NO Upper Cap on Deduction</p>
            <p className="mt-1 text-muted-foreground leading-relaxed">
              Unlike Section 80C or 24(b), Section 80E has <strong>no upper monetary limit</strong>.
              100% of the interest portion repaid can be deducted directly from your gross total taxable income.
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <p className="font-semibold text-blue-800 dark:text-blue-300">8 Consecutive Assessment Years</p>
            <p className="mt-1 text-muted-foreground leading-relaxed">
              Deduction is available starting from the year in which interest repayment commences and continues for up to 8
              consecutive years or until the entire interest is paid off.
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
            <p className="font-semibold text-purple-800 dark:text-purple-300">Girl Child Interest Subsidy</p>
            <p className="mt-1 text-muted-foreground leading-relaxed">
              Major public sector banks in India (such as SBI, PNB, BoB) provide a <strong>0.50% interest concession</strong> for
              female students pursuing higher education in India or abroad.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 5-Year Preview Amortization */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">First 5 Years Payment Trajectory</CardTitle>
            <p className="text-xs text-muted-foreground">Annual principal repaid and interest charges.</p>
          </div>
          <Button onClick={() => navigate('/emi')} variant="ghost" size="sm" className="text-xs gap-1">
            Complete {years}-Year Schedule <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted text-[11px] font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="p-3">Year</th>
                <th className="p-3 text-right">Principal Repaid</th>
                <th className="p-3 text-right">Interest Charged</th>
                <th className="p-3 text-right">Total Annual Payment</th>
                <th className="p-3 text-right">Closing Loan Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {previewSchedule.map((row) => (
                <tr key={row.year} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-semibold font-mono">Year {row.year}</td>
                  <td className="p-3 text-right font-mono text-blue-600 dark:text-blue-400">{formatCurrency(row.principal)}</td>
                  <td className="p-3 text-right font-mono text-orange-600 dark:text-orange-400">{formatCurrency(row.interest)}</td>
                  <td className="p-3 text-right font-mono font-semibold">{formatCurrency(row.totalPayment)}</td>
                  <td className="p-3 text-right font-mono font-bold text-foreground">{formatCurrency(row.closingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="pt-6">
          <div className="flex gap-3 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">Education Loan Moratorium Note</p>
              <p>
                Education loans normally offer a moratorium holiday during the course period plus 6 to 12 months after course completion
                or getting a job. Simple interest is charged during the moratorium period. Paying simple interest during the study period
                reduces compounding interest significantly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
