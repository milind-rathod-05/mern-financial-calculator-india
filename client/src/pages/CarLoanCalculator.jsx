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
import { ArrowRight, Info, Save, FileSpreadsheet, Printer, CheckCircle2, Car, Fuel } from 'lucide-react';

const COLORS = ['#3b82f6', '#f59e0b'];

export default function CarLoanCalculator() {
  const navigate = useNavigate();
  const { saveCalculation } = useSavedCalculations();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Defaults: ₹8,00,000, 9%, 7 years
  const [loanAmount, setLoanAmount] = useState(800000);
  const [rate, setRate] = useState(9.0);
  const [years, setYears] = useState(7);

  const result = useMemo(() => calculateEMI({ loanAmount, annualRate: rate, years }), [loanAmount, rate, years]);

  const previewSchedule = useMemo(() => {
    const amort = generateAmortization({ loanAmount, annualRate: rate, years });
    return amort.yearlySummary;
  }, [loanAmount, rate, years]);

  const chartData = [
    { name: 'Vehicle Principal', value: result.principal },
    { name: 'Total Interest', value: result.totalInterest },
  ];

  const handleExportCSV = () => {
    const rows = [
      { Metric: 'Loan Type', Value: 'Car Loan' },
      { Metric: 'Loan Amount (₹)', Value: loanAmount },
      { Metric: 'Annual Interest Rate (%)', Value: `${rate}%` },
      { Metric: 'Tenure (Years)', Value: years },
      { Metric: 'Monthly EMI (₹)', Value: result.emi },
      { Metric: 'Total Interest (₹)', Value: result.totalInterest },
      { Metric: 'Total Payment (₹)', Value: result.totalPayment },
    ];
    exportToCSV(rows, 'car_loan_summary');
  };

  const handleExportPDF = () => {
    exportToPDF('car-loan-report-container', 'Car Loan EMI Report');
  };

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `Car Loan - ${formatCurrency(loanAmount)}`,
        type: 'car-loan',
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
      console.error('Failed to save car loan:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12" id="car-loan-report-container">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Car Loan EMI Calculator
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Calculate monthly installments, total interest cost, and optimal down payment for your new or pre-owned car.
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
            <CardTitle className="text-base font-semibold">Car Loan Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div>
              <div className="flex justify-between items-center text-xs">
                <Label>Car Loan Amount</Label>
                <span className="font-mono font-bold text-primary">{formatCurrency(loanAmount)}</span>
              </div>
              <Input
                type="number"
                min={50000}
                max={15000000}
                step={25000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                className="mt-1 font-mono text-sm"
              />
              <input
                type="range"
                min={100000}
                max={5000000}
                step={25000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>₹1 Lakh</span>
                <span>₹25 Lakh</span>
                <span>₹50 Lakh</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs">
                <Label>Interest Rate (% p.a.)</Label>
                <span className="font-mono font-bold text-primary">{rate}%</span>
              </div>
              <Input
                type="number"
                step="0.1"
                min={6}
                max={20}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value) || 0)}
                className="mt-1 font-mono text-sm"
              />
              <input
                type="range"
                min={7}
                max={16}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value) || 0)}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>7% (Electric/Offer)</span>
                <span>9% (New Car)</span>
                <span>16% (Used)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs">
                <Label>Loan Tenure (Years)</Label>
                <span className="font-mono font-bold text-primary">{years} Years ({years * 12} Months)</span>
              </div>
              <Input
                type="number"
                min={1}
                max={8}
                value={years}
                onChange={(e) => setYears(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
                className="mt-1 font-mono text-sm"
              />
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value) || 1)}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>1 Year</span>
                <span>5 Years (Popular)</span>
                <span>8 Years (Max)</span>
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
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Monthly Auto Loan EMI</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-primary font-mono mt-1">
                {formatCurrency(result.emi)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">For {years * 12} consecutive months</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-[10px] text-muted-foreground">Vehicle Principal</p>
                <p className="font-semibold font-mono text-sm mt-0.5">{formatCurrency(result.principal)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-[10px] text-muted-foreground">Total Interest Charge</p>
                <p className="font-semibold font-mono text-sm text-orange-600 dark:text-orange-400 mt-0.5">
                  {formatCurrency(result.totalInterest)}
                </p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-muted/80">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Total Ownership Outflow</p>
                    <p className="font-bold font-mono text-base mt-0.5">{formatCurrency(result.totalPayment)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Interest Ratio</p>
                    <p className="font-mono text-xs font-semibold text-muted-foreground mt-0.5">
                      {((result.totalInterest / (result.principal || 1)) * 100).toFixed(1)}% of price
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

      {/* Yearly Amortization Breakdown Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Yearly Car Loan Amortization</CardTitle>
            <p className="text-xs text-muted-foreground">Detailed schedule of principal repaid and interest charges.</p>
          </div>
          <Button onClick={() => navigate('/emi')} variant="ghost" size="sm" className="text-xs gap-1">
            Open Advanced Prepayment Calculator <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted text-[11px] font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="p-3">Year</th>
                <th className="p-3 text-right">Principal Repaid</th>
                <th className="p-3 text-right">Interest Charged</th>
                <th className="p-3 text-right">Annual EMI Paid</th>
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

      {/* Smart Tip & Disclaimer */}
      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="pt-6">
          <div className="flex gap-3 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">Car Loan Guidelines</p>
              <p>
                Most Indian lenders (SBI, HDFC, ICICI, etc.) finance 85% to 100% of the on-road or ex-showroom price.
                Remember that cars depreciate quickly (up to 20% in the first year). Making a higher down payment (e.g. 20-30%)
                and keeping the tenure to 4-5 years ensures you never owe more than the market value of the car.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
