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
import { ArrowRight, Info, Save, FileSpreadsheet, Printer, CheckCircle2, User, AlertCircle } from 'lucide-react';

const COLORS = ['#3b82f6', '#f59e0b'];

export default function PersonalLoanCalculator() {
  const navigate = useNavigate();
  const { saveCalculation } = useSavedCalculations();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Defaults: ₹5,00,000, 12%, 5 years
  const [loanAmount, setLoanAmount] = useState(500000);
  const [rate, setRate] = useState(12.0);
  const [years, setYears] = useState(5);

  const result = useMemo(() => calculateEMI({ loanAmount, annualRate: rate, years }), [loanAmount, rate, years]);

  const previewSchedule = useMemo(() => {
    const amort = generateAmortization({ loanAmount, annualRate: rate, years });
    return amort.yearlySummary;
  }, [loanAmount, rate, years]);

  const chartData = [
    { name: 'Principal Amount', value: result.principal },
    { name: 'Total Interest', value: result.totalInterest },
  ];

  const handleExportCSV = () => {
    const rows = [
      { Metric: 'Loan Type', Value: 'Personal Loan' },
      { Metric: 'Loan Amount (₹)', Value: loanAmount },
      { Metric: 'Annual Interest Rate (%)', Value: `${rate}%` },
      { Metric: 'Tenure (Years)', Value: years },
      { Metric: 'Monthly EMI (₹)', Value: result.emi },
      { Metric: 'Total Interest (₹)', Value: result.totalInterest },
      { Metric: 'Total Payment (₹)', Value: result.totalPayment },
    ];
    exportToCSV(rows, 'personal_loan_summary');
  };

  const handleExportPDF = () => {
    exportToPDF('personal-loan-report-container', 'Personal Loan EMI Report');
  };

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `Personal Loan - ${formatCurrency(loanAmount)}`,
        type: 'personal-loan',
        inputs: { loanAmount, rate, years },
        results: {
          emi: result.emi,
          totalPrincipal: result.principal,
          totalInterest: result.totalInterest,
          totalPayment: result.totalPayment,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save personal loan:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12" id="personal-loan-report-container">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Personal Loan EMI Calculator
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Estimate monthly EMIs, total interest expense, and affordability for personal and unsecured loans.
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
            <CardTitle className="text-base font-semibold">Personal Loan Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div>
              <div className="flex justify-between items-center text-xs">
                <Label>Loan Amount</Label>
                <span className="font-mono font-bold text-primary">{formatCurrency(loanAmount)}</span>
              </div>
              <Input
                type="number"
                min={20000}
                max={4000000}
                step={10000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                className="mt-1 font-mono text-sm"
              />
              <input
                type="range"
                min={50000}
                max={3000000}
                step={25000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>₹50,000</span>
                <span>₹15 Lakh</span>
                <span>₹30 Lakh</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs">
                <Label>Interest Rate (% p.a.)</Label>
                <span className="font-mono font-bold text-primary">{rate}%</span>
              </div>
              <Input
                type="number"
                step="0.25"
                min={8}
                max={28}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value) || 0)}
                className="mt-1 font-mono text-sm"
              />
              <input
                type="range"
                min={10}
                max={24}
                step={0.25}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value) || 0)}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>10% (Prime)</span>
                <span>14%</span>
                <span>24% (NBFC)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs">
                <Label>Tenure (Years)</Label>
                <span className="font-mono font-bold text-primary">{years} Years ({years * 12} Months)</span>
              </div>
              <Input
                type="number"
                min={1}
                max={7}
                value={years}
                onChange={(e) => setYears(Math.max(1, Math.min(7, Number(e.target.value) || 1)))}
                className="mt-1 font-mono text-sm"
              />
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value) || 1)}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>1 Year</span>
                <span>5 Years (Standard)</span>
                <span>7 Years</span>
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
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Monthly Personal Loan EMI</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-primary font-mono mt-1">
                {formatCurrency(result.emi)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Payable for {years * 12} months</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-[10px] text-muted-foreground">Principal Borrowed</p>
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
                    <p className="text-[10px] text-muted-foreground">Extra Cost %</p>
                    <p className="font-mono text-xs font-semibold text-muted-foreground mt-0.5">
                      {((result.totalInterest / (result.principal || 1)) * 100).toFixed(1)}% of loan
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
            <CardTitle className="text-base font-semibold">Payment Breakdown</CardTitle>
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

      {/* Yearly Amortization Breakdown Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Yearly Payment Trajectory</CardTitle>
            <p className="text-xs text-muted-foreground">Annual principal reduction and interest payout.</p>
          </div>
          <Button onClick={() => navigate('/emi')} variant="ghost" size="sm" className="text-xs gap-1">
            Open Full EMI & Prepayment Tool <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted text-[11px] font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="p-3">Year</th>
                <th className="p-3 text-right">Principal Repaid</th>
                <th className="p-3 text-right">Interest Charged</th>
                <th className="p-3 text-right">Total Annual Outflow</th>
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
              <p className="font-semibold text-sm mb-1">Personal Loan Advisory</p>
              <p>
                Personal loans are unsecured credit. Interest rates offered by banks (such as SBI, HDFC, ICICI, Axis) and NBFCs
                depend heavily on your CIBIL score (usually 750+ needed for best rates), employer category, and existing debt obligations.
                Be aware of 1% to 3% processing fees and foreclosure lock-in clauses before signing loan agreements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
