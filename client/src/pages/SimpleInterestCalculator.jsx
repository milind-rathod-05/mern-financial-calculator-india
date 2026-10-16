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
import { Info, Download, Save, CheckCircle2 } from 'lucide-react';
import { calculateSimpleInterest } from '../utils/financialCalculations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SimpleInterestCalculator() {
  const { saveCalculation } = useSavedCalculations();
  const [saveStatus, setSaveStatus] = useState('');

  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(5);

  const result = useMemo(() => {
    return calculateSimpleInterest({
      principal: Number(principal) || 0,
      rate: Number(rate) || 0,
      years: Number(years) || 0,
    });
  }, [principal, rate, years]);

  const pieData = useMemo(() => {
    return [
      { name: 'Principal Amount', value: result.principal },
      { name: 'Total Interest', value: result.interest },
    ];
  }, [result]);

  const yearWiseData = useMemo(() => {
    const list = [];
    const P = Number(principal) || 0;
    const R = Number(rate) || 0;
    const T = Number(years) || 0;
    const annualInterest = (P * R) / 100;

    for (let y = 1; y <= T; y++) {
      const cumInterest = annualInterest * y;
      list.push({
        year: `Year ${y}`,
        yearNum: y,
        principal: P,
        annualInterest: Math.round(annualInterest),
        cumulativeInterest: Math.round(cumInterest),
        totalAmount: Math.round(P + cumInterest),
      });
    }
    return list;
  }, [principal, rate, years]);

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `Simple Interest (₹${(Number(principal) || 0).toLocaleString('en-IN')})`,
        type: 'simple-interest',
        inputs: { principal, rate, years },
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
    const csvData = yearWiseData.map((row) => ({
      Year: row.yearNum,
      'Principal (₹)': row.principal,
      'Yearly Interest (₹)': row.annualInterest,
      'Cumulative Interest (₹)': row.cumulativeInterest,
      'Total Balance (₹)': row.totalAmount,
    }));
    exportToCSV(csvData, 'simple_interest_schedule');
  };

  const handleExportPDF = () => {
    exportToPDF('si-report', 'Simple Interest Calculation');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simple Interest Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Calculate linear interest returns and maturity values based on the formula SI = (P × R × T) / 100.
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
              <CardTitle className="text-xl">Calculation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Principal */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="principal">Principal Amount</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(principal)}</span>
                </div>
                <Input
                  id="principal"
                  type="number"
                  min={1000}
                  max={10000000}
                  step={5000}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={5000}
                  max={2000000}
                  step={5000}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹5,000</span>
                  <span>₹20 Lakh</span>
                </div>
              </div>

              {/* Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="rate">Annual Interest Rate (%)</Label>
                  <span className="text-sm font-semibold text-primary">{rate}%</span>
                </div>
                <Input
                  id="rate"
                  type="number"
                  step="0.1"
                  min={0.1}
                  max={30}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={0.1}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1%</span>
                  <span>25%</span>
                </div>
              </div>

              {/* Years */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="years">Duration (Years)</Label>
                  <span className="text-sm font-semibold text-primary">{years} Years</span>
                </div>
                <Input
                  id="years"
                  type="number"
                  min={1}
                  max={40}
                  value={years}
                  onChange={(e) => setYears(Math.max(1, Number(e.target.value)))}
                />
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
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
        <div className="lg:col-span-7 space-y-6" id="si-report">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Principal Amount
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatCurrency(result.principal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Initial capital</p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Total Interest
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(result.interest)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Over {years} {years === 1 ? 'year' : 'years'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Maturity Amount
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatCurrency(result.maturityAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">P + SI</p>
              </CardContent>
            </Card>
          </div>

          {/* Pie Chart: Principal vs Interest */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Principal vs Total Interest</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Year-by-Year Breakdown Table */}
          {yearWiseData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Year-by-Year Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground sticky top-0">
                      <tr>
                        <th className="p-2.5">Year</th>
                        <th className="p-2.5 text-right">Principal</th>
                        <th className="p-2.5 text-right">Annual Interest</th>
                        <th className="p-2.5 text-right">Cumulative Interest</th>
                        <th className="p-2.5 text-right">Total Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {yearWiseData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/50">
                          <td className="p-2.5 font-medium">{row.year}</td>
                          <td className="p-2.5 text-right">{formatCurrency(row.principal)}</td>
                          <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(row.annualInterest)}
                          </td>
                          <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatCurrency(row.cumulativeInterest)}
                          </td>
                          <td className="p-2.5 text-right font-semibold">{formatCurrency(row.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4 flex gap-3 text-amber-900 dark:text-amber-200">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">Simple Interest Overview:</p>
                <p>
                  Simple Interest is determined only by multiplying the initial principal by the annual rate and
                  duration. Unlike compound interest, interest earned is not added to the principal to earn additional
                  interest in subsequent periods.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
