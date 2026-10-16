import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatPercent } from '../utils/currencyFormatter';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { useSavedCalculations } from '../contexts/SavedCalculationsContext';
import { calculateLumpsum } from '../utils/financialCalculations';
import { calculateSIP } from '../utils/sipCalculations';
import { calculateFD, calculatePPF, calculateRD } from '../utils/schemeCalculations';
import {
  Info,
  Download,
  Save,
  CheckCircle2,
  Sliders,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Sparkles,
} from 'lucide-react';

const COLORS = {
  lumpsum: '#3b82f6', // blue
  sip: '#10b981',     // emerald
  fd: '#f59e0b',      // amber
  ppf: '#8b5cf6',     // violet
  rd: '#ec4899',      // pink
};

const METADATA = {
  lumpsum: {
    name: 'Mutual Fund Lumpsum',
    risk: 'High',
    riskVariant: 'destructive',
    lockIn: 'None (except ELSS: 3 yrs)',
    tax: 'LTCG > ₹1.25L @ 12.5%, STCG @ 20%',
    color: '#3b82f6',
  },
  sip: {
    name: 'Mutual Fund SIP',
    risk: 'High',
    riskVariant: 'destructive',
    lockIn: 'None (FIFO per installment)',
    tax: 'LTCG > ₹1.25L @ 12.5%, STCG @ 20%',
    color: '#10b981',
  },
  fd: {
    name: 'Fixed Deposit (FD)',
    risk: 'Low',
    riskVariant: 'success',
    lockIn: 'Tenure-based (premature penalty)',
    tax: 'Taxed at investor income slab (TDS if > ₹40k)',
    color: '#f59e0b',
  },
  ppf: {
    name: 'Public Provident Fund (PPF)',
    risk: 'Low (Govt)',
    riskVariant: 'success',
    lockIn: '15 Years (partial withdrawal after 6 yrs)',
    tax: 'Exempt-Exempt-Exempt (EEE) under 80C',
    color: '#8b5cf6',
  },
  rd: {
    name: 'Recurring Deposit (RD)',
    risk: 'Low',
    riskVariant: 'success',
    lockIn: 'Tenure-based',
    tax: 'Interest added to income and taxed at slab',
    color: '#ec4899',
  },
};

export default function InvestmentComparison() {
  const { saveCalculation } = useSavedCalculations();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [calcName, setCalcName] = useState('Investment Comparison');

  // Common duration
  const [years, setYears] = useState(10);

  // Enabled investments
  const [enabled, setEnabled] = useState({
    lumpsum: true,
    sip: true,
    fd: true,
    ppf: true,
    rd: true,
  });

  // Individual parameters
  const [lumpsumConfig, setLumpsumConfig] = useState({ amount: 100000, rate: 12 });
  const [sipConfig, setSipConfig] = useState({ monthly: 5000, rate: 12 });
  const [fdConfig, setFdConfig] = useState({ amount: 100000, rate: 7.0, compounding: 4 });
  const [ppfConfig, setPpfConfig] = useState({ annual: 60000, rate: 7.1 });
  const [rdConfig, setRdConfig] = useState({ monthly: 5000, rate: 6.8 });

  // Calculations for each selected type
  const comparisonResults = useMemo(() => {
    const list = [];

    // 1. Lumpsum
    if (enabled.lumpsum) {
      const res = calculateLumpsum({
        principal: lumpsumConfig.amount,
        annualReturn: lumpsumConfig.rate,
        years,
      });
      list.push({
        id: 'lumpsum',
        ...METADATA.lumpsum,
        invested: res.invested,
        returns: res.returns,
        maturityValue: res.maturityValue,
        effectiveReturnRate: lumpsumConfig.rate,
        cagr: lumpsumConfig.rate,
        yearWise: res.yearWiseData.map((d) => ({ year: d.year, value: d.value })),
      });
    }

    // 2. SIP
    if (enabled.sip) {
      const res = calculateSIP({
        monthlyInvestment: sipConfig.monthly,
        annualReturn: sipConfig.rate,
        years,
      });
      list.push({
        id: 'sip',
        ...METADATA.sip,
        invested: res.totalInvested,
        returns: res.estimatedReturns,
        maturityValue: res.maturityValue,
        effectiveReturnRate: sipConfig.rate,
        cagr: sipConfig.rate,
        yearWise: res.yearWiseData.map((d) => ({ year: d.year, value: d.value })),
      });
    }

    // 3. Fixed Deposit
    if (enabled.fd) {
      const res = calculateFD({
        principal: fdConfig.amount,
        annualRate: fdConfig.rate,
        years,
        compoundingFrequency: fdConfig.compounding,
      });

      // generate year-wise
      const yearWise = [];
      for (let y = 1; y <= years; y++) {
        const yRes = calculateFD({
          principal: fdConfig.amount,
          annualRate: fdConfig.rate,
          years: y,
          compoundingFrequency: fdConfig.compounding,
        });
        yearWise.push({ year: y, value: yRes.maturityValue });
      }

      list.push({
        id: 'fd',
        ...METADATA.fd,
        invested: res.principal,
        returns: res.totalInterest,
        maturityValue: res.maturityValue,
        effectiveReturnRate: res.effectiveAnnualYield,
        cagr: res.effectiveAnnualYield,
        yearWise,
      });
    }

    // 4. PPF
    if (enabled.ppf) {
      const res = calculatePPF({
        annualContribution: ppfConfig.annual,
        interestRate: ppfConfig.rate,
        years,
      });
      list.push({
        id: 'ppf',
        ...METADATA.ppf,
        invested: res.totalContributions,
        returns: res.totalInterest,
        maturityValue: res.maturityValue,
        effectiveReturnRate: ppfConfig.rate,
        cagr: ppfConfig.rate,
        yearWise: res.yearWiseData.map((d) => ({ year: d.year, value: d.closingBalance })),
      });
    }

    // 5. RD
    if (enabled.rd) {
      const res = calculateRD({
        monthlyDeposit: rdConfig.monthly,
        annualRate: rdConfig.rate,
        years,
        compoundingFrequency: 4,
      });

      const yearWise = [];
      for (let y = 1; y <= years; y++) {
        const yRes = calculateRD({
          monthlyDeposit: rdConfig.monthly,
          annualRate: rdConfig.rate,
          years: y,
          compoundingFrequency: 4,
        });
        yearWise.push({ year: y, value: yRes.maturityValue });
      }

      list.push({
        id: 'rd',
        ...METADATA.rd,
        invested: res.totalDeposits,
        returns: res.totalInterest,
        maturityValue: res.maturityValue,
        effectiveReturnRate: rdConfig.rate,
        cagr: rdConfig.rate,
        yearWise,
      });
    }

    return list;
  }, [years, enabled, lumpsumConfig, sipConfig, fdConfig, ppfConfig, rdConfig]);

  // Combined chart data for maturity comparison
  const barChartData = useMemo(() => {
    return comparisonResults.map((item) => ({
      name: item.name.split(' (')[0],
      Invested: item.invested,
      Returns: item.returns,
      Maturity: item.maturityValue,
      fill: item.color,
    }));
  }, [comparisonResults]);

  // Line chart data over time
  const lineChartData = useMemo(() => {
    const data = [];
    for (let y = 1; y <= years; y++) {
      const point = { year: `Yr ${y}` };
      comparisonResults.forEach((item) => {
        const yrData = item.yearWise.find((d) => d.year === y);
        point[item.name.split(' (')[0]] = yrData ? yrData.value : 0;
      });
      data.push(point);
    }
    return data;
  }, [years, comparisonResults]);

  const toggleInvestment = (key) => {
    const activeCount = Object.values(enabled).filter(Boolean).length;
    if (enabled[key] && activeCount <= 1) {
      alert('At least one investment option must remain selected for comparison.');
      return;
    }
    setEnabled({ ...enabled, [key]: !enabled[key] });
  };

  const handleExportCSV = () => {
    const rows = comparisonResults.map((item) => ({
      'Investment Option': item.name,
      'Total Invested (₹)': item.invested,
      'Estimated Returns (₹)': item.returns,
      'Maturity Value (₹)': item.maturityValue,
      'Annual Rate / Yield': `${item.effectiveReturnRate}%`,
      'Risk Level': item.risk,
      'Lock-in Period': item.lockIn,
      'Taxation': item.tax,
    }));
    exportToCSV(rows, 'investment_comparison');
  };

  const handleExportPDF = () => {
    exportToPDF('comparison-report-container', 'Investment Comparison Report');
  };

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: calcName || 'Investment Comparison',
        type: 'comparison',
        inputs: {
          years,
          enabled,
          lumpsumConfig,
          sipConfig,
          fdConfig,
          ppfConfig,
          rdConfig,
        },
        results: {
          items: comparisonResults.map((c) => ({
            id: c.id,
            name: c.name,
            invested: c.invested,
            maturityValue: c.maturityValue,
          })),
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save calculation:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12" id="comparison-report-container">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Investment Comparison Matrix
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare returns, lock-in periods, risks, and taxation across Indian investment instruments side-by-side.
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

      {/* Common Controls & Selection */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Select Instruments to Compare</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="global-tenure" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Common Tenure (Years):
              </Label>
              <Input
                id="global-tenure"
                type="number"
                min={1}
                max={30}
                value={years}
                onChange={(e) => setYears(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                className="w-20 h-8 text-center text-xs font-semibold"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.keys(METADATA).map((key) => {
              const meta = METADATA[key];
              const isActive = enabled[key];
              return (
                <div
                  key={key}
                  onClick={() => toggleInvestment(key)}
                  className={`cursor-pointer rounded-lg border p-3 flex flex-col justify-between transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-muted/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => toggleInvestment(key)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold leading-tight text-foreground">{meta.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Risk: {meta.risk}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Customizable Parameters for Active Instruments */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Configure Instrument Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 text-xs">
            {enabled.lumpsum && (
              <div className="p-3 rounded-lg border bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 space-y-2">
                <p className="font-semibold text-blue-700 dark:text-blue-300">MF Lumpsum</p>
                <div>
                  <Label className="text-[11px]">Investment (₹)</Label>
                  <Input
                    type="number"
                    value={lumpsumConfig.amount}
                    onChange={(e) => setLumpsumConfig({ ...lumpsumConfig, amount: Number(e.target.value) })}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Expected Return (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={lumpsumConfig.rate}
                    onChange={(e) => setLumpsumConfig({ ...lumpsumConfig, rate: Number(e.target.value) })}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
              </div>
            )}

            {enabled.sip && (
              <div className="p-3 rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 space-y-2">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">MF SIP</p>
                <div>
                  <Label className="text-[11px]">Monthly SIP (₹)</Label>
                  <Input
                    type="number"
                    value={sipConfig.monthly}
                    onChange={(e) => setSipConfig({ ...sipConfig, monthly: Number(e.target.value) })}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Expected Return (%)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={sipConfig.rate}
                    onChange={(e) => setSipConfig({ ...sipConfig, rate: Number(e.target.value) })}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
              </div>
            )}

            {enabled.fd && (
              <div className="p-3 rounded-lg border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 space-y-2">
                <p className="font-semibold text-amber-700 dark:text-amber-300">Fixed Deposit</p>
                <div>
                  <Label className="text-[11px]">Deposit Amount (₹)</Label>
                  <Input
                    type="number"
                    value={fdConfig.amount}
                    onChange={(e) => setFdConfig({ ...fdConfig, amount: Number(e.target.value) })}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={fdConfig.rate}
                    onChange={(e) => setFdConfig({ ...fdConfig, rate: Number(e.target.value) })}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
              </div>
            )}

            {enabled.ppf && (
              <div className="p-3 rounded-lg border bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900 space-y-2">
                <p className="font-semibold text-purple-700 dark:text-purple-300">PPF (Yearly)</p>
                <div>
                  <Label className="text-[11px]">Annual Contribution (₹)</Label>
                  <Input
                    type="number"
                    max={150000}
                    value={ppfConfig.annual}
                    onChange={(e) => setPpfConfig({ ...ppfConfig, annual: Number(e.target.value) })}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Current PPF Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={ppfConfig.rate}
                    onChange={(e) => setPpfConfig({ ...ppfConfig, rate: Number(e.target.value) })}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
              </div>
            )}

            {enabled.rd && (
              <div className="p-3 rounded-lg border bg-pink-50/40 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900 space-y-2">
                <p className="font-semibold text-pink-700 dark:text-pink-300">Recurring Deposit</p>
                <div>
                  <Label className="text-[11px]">Monthly Deposit (₹)</Label>
                  <Input
                    type="number"
                    value={rdConfig.monthly}
                    onChange={(e) => setRdConfig({ ...rdConfig, monthly: Number(e.target.value) })}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={rdConfig.rate}
                    onChange={(e) => setRdConfig({ ...rdConfig, rate: Number(e.target.value) })}
                    className="h-7 text-xs bg-background mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Result Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {comparisonResults.map((item) => (
          <Card key={item.id} className="relative overflow-hidden border shadow-sm flex flex-col justify-between">
            <div className="h-1.5 w-full" style={{ backgroundColor: item.color }} />
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <Badge variant={item.riskVariant} className="text-[10px]">
                  {item.risk} Risk
                </Badge>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {item.effectiveReturnRate}% p.a.
                </span>
              </div>
              <CardTitle className="text-base mt-2">{item.name}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-primary/5 text-center">
                  <p className="text-[11px] text-muted-foreground font-medium">Maturity Value</p>
                  <p className="text-xl font-bold font-mono text-primary mt-0.5">
                    {formatCurrency(item.maturityValue)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">Total Invested</p>
                    <p className="font-semibold font-mono mt-0.5">{formatCurrency(item.invested)}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">Wealth Gained</p>
                    <p className="font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(item.returns)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t space-y-1.5 text-[11px] text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Lock-in: </span>
                  {item.lockIn}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Tax: </span>
                  <span className="line-clamp-2">{item.tax}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maturity Comparison Bar Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Maturity vs Invested Amount</CardTitle>
            <p className="text-xs text-muted-foreground">
              Comparison of capital deployed against terminal wealth accumulated.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(val) => `₹${val >= 10000000 ? (val / 10000000).toFixed(1) + 'Cr' : val >= 100000 ? (val / 100000).toFixed(1) + 'L' : val}`}
                    tick={{ fontSize: 11 }}
                  />
                  <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Invested" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Maturity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Wealth Accumulation Trajectory */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Growth Trajectory Over Time</CardTitle>
            <p className="text-xs text-muted-foreground">
              Progression of portfolio valuation across each year of the {years}-year horizon.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: 15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(val) => `₹${val >= 10000000 ? (val / 10000000).toFixed(1) + 'Cr' : val >= 100000 ? (val / 100000).toFixed(1) + 'L' : val}`}
                    tick={{ fontSize: 11 }}
                  />
                  <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {comparisonResults.map((item) => {
                    const shortName = item.name.split(' (')[0];
                    return (
                      <Line
                        key={item.id}
                        type="monotone"
                        dataKey={shortName}
                        stroke={item.color}
                        strokeWidth={2.5}
                        dot={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Matrix Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Detailed Comparison Matrix</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Option</th>
                <th className="p-3">Risk</th>
                <th className="p-3 text-right">Total Invested</th>
                <th className="p-3 text-right">Est. Returns</th>
                <th className="p-3 text-right">Maturity Value</th>
                <th className="p-3 text-center">Annual Return</th>
                <th className="p-3">Lock-in Period</th>
                <th className="p-3">Tax Treatment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comparisonResults.map((item) => (
                <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-semibold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </td>
                  <td className="p-3">
                    <Badge variant={item.riskVariant} className="text-[10px]">
                      {item.risk}
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-mono font-medium">{formatCurrency(item.invested)}</td>
                  <td className="p-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.returns)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-primary">
                    {formatCurrency(item.maturityValue)}
                  </td>
                  <td className="p-3 text-center font-mono">{formatPercent(item.effectiveReturnRate, 2)}</td>
                  <td className="p-3 text-muted-foreground">{item.lockIn}</td>
                  <td className="p-3 text-muted-foreground max-w-xs">{item.tax}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Disclaimers & Notes */}
      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="pt-6">
          <div className="flex gap-3 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
            <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">Important Disclaimers on Financial Comparison</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Market-Linked Returns:</strong> Mutual Fund Lumpsum and SIP returns are subject to market volatility.
                  Projections shown here use historical or user-specified assumptions and do not constitute guaranteed returns.
                </li>
                <li>
                  <strong>Guaranteed Schemes:</strong> PPF, FD, and RD offer fixed or sovereign-backed returns. PPF interest rates are
                  reviewed quarterly by the Ministry of Finance, Government of India.
                </li>
                <li>
                  <strong>Tax Laws:</strong> Tax rules mentioned are as per Indian Income Tax Act regulations (FY 2024-25 / Budget 2024).
                  Consult your chartered accountant or registered financial advisor before finalizing asset allocation.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
