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
import { calculateEPF } from '../utils/schemeCalculations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RetirementCalculator() {
  const { saveCalculation } = useSavedCalculations();
  const [saveStatus, setSaveStatus] = useState('');

  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthlyBasicSalary, setMonthlyBasicSalary] = useState(30000);
  const [employeeContributionRate, setEmployeeContributionRate] = useState(12);
  const [employerEPFShare, setEmployerEPFShare] = useState(3.67);
  const [annualSalaryGrowth, setAnnualSalaryGrowth] = useState(5);
  const [interestRate, setInterestRate] = useState(8.15);
  const [yearsOfService, setYearsOfService] = useState(25);
  const [includeEPS, setIncludeEPS] = useState(false);

  const result = useMemo(() => {
    return calculateEPF({
      currentBalance: Number(currentBalance) || 0,
      monthlyBasicSalary: Number(monthlyBasicSalary) || 0,
      employeeContributionRate: Number(employeeContributionRate) || 12,
      employerContributionRate: 12,
      employerEPFShare: Number(employerEPFShare) || 3.67,
      annualSalaryGrowth: Number(annualSalaryGrowth) || 0,
      interestRate: Number(interestRate) || 8.15,
      yearsOfService: Number(yearsOfService) || 0,
      includeEPS,
    });
  }, [
    currentBalance,
    monthlyBasicSalary,
    employeeContributionRate,
    employerEPFShare,
    annualSalaryGrowth,
    interestRate,
    yearsOfService,
    includeEPS,
  ]);

  const pieData = useMemo(() => {
    return [
      { name: 'Employee Share', value: result.totalEmployeeContribution },
      { name: 'Employer Share', value: result.totalEmployerContribution },
      { name: 'Total Interest', value: result.totalInterest },
      ...(currentBalance > 0 ? [{ name: 'Initial Balance', value: Number(currentBalance) }] : []),
    ];
  }, [result, currentBalance]);

  const chartData = useMemo(() => {
    if (!result.yearWiseData || result.yearWiseData.length === 0) return [];
    return result.yearWiseData.map((row) => ({
      year: `Yr ${row.year}`,
      Corpus: row.closingBalance,
      EmployeeContrib: row.employeeContribution,
      EmployerContrib: row.employerContribution,
      Interest: row.interest,
    }));
  }, [result.yearWiseData]);

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `EPF Retirement Plan (${yearsOfService} yrs)`,
        type: 'epf',
        inputs: {
          currentBalance,
          monthlyBasicSalary,
          employeeContributionRate,
          employerEPFShare,
          annualSalaryGrowth,
          interestRate,
          yearsOfService,
          includeEPS,
        },
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
    if (result.yearWiseData && result.yearWiseData.length > 0) {
      const csvData = result.yearWiseData.map((row) => ({
        Year: row.year,
        'Monthly Basic (₹)': row.monthlySalary,
        'Opening Balance (₹)': row.openingBalance,
        'Employee Contrib (₹)': row.employeeContribution,
        'Employer Contrib (₹)': row.employerContribution,
        'Interest Earned (₹)': row.interest,
        'Closing Balance (₹)': row.closingBalance,
      }));
      exportToCSV(csvData, 'epf_retirement_schedule');
    }
  };

  const handleExportPDF = () => {
    exportToPDF('epf-report', 'EPF Retirement Plan Calculation');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">EPF Retirement Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Plan your retirement nest egg with EPFO interest compounding and salary progression.
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
              <CardTitle className="text-xl">Employment & Contribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Current EPF Balance */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="currentBalance">Current EPF Balance</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(currentBalance)}</span>
                </div>
                <Input
                  id="currentBalance"
                  type="number"
                  min={0}
                  max={50000000}
                  step={10000}
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={0}
                  max={2000000}
                  step={10000}
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Monthly Basic Salary */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="monthlyBasicSalary">Monthly Basic + DA Salary</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(monthlyBasicSalary)}</span>
                </div>
                <Input
                  id="monthlyBasicSalary"
                  type="number"
                  min={1000}
                  max={1000000}
                  step={1000}
                  value={monthlyBasicSalary}
                  onChange={(e) => setMonthlyBasicSalary(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={10000}
                  max={250000}
                  step={2000}
                  value={monthlyBasicSalary}
                  onChange={(e) => setMonthlyBasicSalary(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Years of Service */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="yearsOfService">Years Until Retirement</Label>
                  <span className="text-sm font-semibold text-primary">{yearsOfService} Years</span>
                </div>
                <Input
                  id="yearsOfService"
                  type="number"
                  min={1}
                  max={45}
                  value={yearsOfService}
                  onChange={(e) => setYearsOfService(Math.max(1, Number(e.target.value)))}
                />
                <input
                  type="range"
                  min={1}
                  max={40}
                  step={1}
                  value={yearsOfService}
                  onChange={(e) => setYearsOfService(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Annual Salary Increment */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="annualSalaryGrowth">Annual Salary Increment (%)</Label>
                  <span className="text-sm font-semibold text-primary">{annualSalaryGrowth}%</span>
                </div>
                <Input
                  id="annualSalaryGrowth"
                  type="number"
                  step="0.5"
                  min={0}
                  max={25}
                  value={annualSalaryGrowth}
                  onChange={(e) => setAnnualSalaryGrowth(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={0.5}
                  value={annualSalaryGrowth}
                  onChange={(e) => setAnnualSalaryGrowth(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="interestRate">EPFO Interest Rate (%)</Label>
                  <span className="text-sm font-semibold text-primary">{interestRate}%</span>
                </div>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.05"
                  min={5}
                  max={12}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={7}
                  max={10}
                  step={0.05}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Employee Contribution % and Employer EPF Share % */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeContrib">Your Share (%)</Label>
                  <Input
                    id="employeeContrib"
                    type="number"
                    step="0.5"
                    min={1}
                    max={25}
                    value={employeeContributionRate}
                    onChange={(e) => setEmployeeContributionRate(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employerEPFShare">Employer EPF (%)</Label>
                  <Input
                    id="employerEPFShare"
                    type="number"
                    step="0.01"
                    min={0}
                    max={12}
                    value={employerEPFShare}
                    onChange={(e) => setEmployerEPFShare(Number(e.target.value))}
                    disabled={includeEPS}
                  />
                </div>
              </div>

              {/* Include EPS Toggle */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/40">
                <div className="space-y-0.5">
                  <Label htmlFor="epsToggle" className="text-sm font-medium cursor-pointer">
                    Include Full Employer Share (12%)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Includes 8.33% EPS pension corpus in retirement accumulation
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="epsToggle"
                  checked={includeEPS}
                  onChange={(e) => setIncludeEPS(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Results, Charts, Schedule Table */}
        <div className="lg:col-span-7 space-y-6" id="epf-report">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20 sm:col-span-2">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Total Accumulated Retirement Corpus
                </p>
                <p className="text-3xl font-extrabold text-primary mt-1">
                  {formatCurrency(result.totalCorpus)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated nest egg after {yearsOfService} years of service
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Your Contributions
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {formatCurrency(result.totalEmployeeContribution)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Employee 12% deduction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Employer Contributions
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {formatCurrency(result.totalEmployerContribution)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {includeEPS ? 'Full 12% employer share' : `${employerEPFShare}% EPF share`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border-emerald-500/20 sm:col-span-2">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Total Compounded Interest Earned
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(result.totalInterest)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Interest accounts for{' '}
                  {result.totalCorpus > 0
                    ? ((result.totalInterest / result.totalCorpus) * 100).toFixed(1)
                    : 0}
                  % of your total retirement wealth
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Line Chart: Corpus Growth */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Corpus Growth Trajectory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" />
                    <YAxis
                      tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                      domain={['auto', 'auto']}
                    />
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Corpus"
                      name="Total Corpus"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="EmployeeContrib"
                      name="Yearly Employee Contrib"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Interest"
                      name="Yearly Interest Earned"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Table */}
          {result.yearWiseData && result.yearWiseData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Year-by-Year EPF Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-72 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground sticky top-0">
                      <tr>
                        <th className="p-2.5">Year</th>
                        <th className="p-2.5 text-right">Monthly Basic</th>
                        <th className="p-2.5 text-right">Emp. Contrib</th>
                        <th className="p-2.5 text-right">Empr. Contrib</th>
                        <th className="p-2.5 text-right">Interest</th>
                        <th className="p-2.5 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.yearWiseData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/50">
                          <td className="p-2.5 font-medium">Year {row.year}</td>
                          <td className="p-2.5 text-right">{formatCurrency(row.monthlySalary)}</td>
                          <td className="p-2.5 text-right">{formatCurrency(row.employeeContribution)}</td>
                          <td className="p-2.5 text-right">{formatCurrency(row.employerContribution)}</td>
                          <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(row.interest)}
                          </td>
                          <td className="p-2.5 text-right font-semibold">{formatCurrency(row.closingBalance)}</td>
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
                <p className="font-semibold">Important Notes on Employees' Provident Fund (EPF):</p>
                <p>
                  EPFO interest rates are determined each financial year by the Central Board of Trustees and
                  approved by the Ministry of Finance. As per statutory rules, out of 12% employer share, 8.33%
                  (up to ₹1,250/mo) goes to EPS (pension fund) and 3.67% to EPF, unless opted for full EPF contribution.
                  EPF withdrawals after 5 years of continuous service are exempt from income tax.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
