import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { formatCurrency, formatPercent } from '../utils/currencyFormatter';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { useSavedCalculations } from '../contexts/SavedCalculationsContext';
import { calculateXIRR } from '../utils/financialCalculations';
import {
  Info,
  Download,
  Save,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';

const getTodayDate = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const DEFAULT_FLOWS = [
  { id: '1', date: '2020-01-01', amount: -100000 },
  { id: '2', date: getTodayDate(), amount: 120000 },
];

export default function XIRRCalculator() {
  const [cashFlows, setCashFlows] = useState(DEFAULT_FLOWS);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [calcName, setCalcName] = useState('My XIRR Calculation');
  const { saveCalculation } = useSavedCalculations();

  const handleAddFlow = () => {
    const lastDate = cashFlows.length > 0 ? cashFlows[cashFlows.length - 1].date : getTodayDate();
    setCashFlows([
      ...cashFlows,
      {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        date: lastDate,
        amount: 10000,
      },
    ]);
  };

  const handleRemoveFlow = (id) => {
    if (cashFlows.length <= 2) {
      alert('At least two cash flows are required to calculate XIRR.');
      return;
    }
    setCashFlows(cashFlows.filter((cf) => cf.id !== id));
  };

  const handleFlowChange = (id, field, value) => {
    setCashFlows(
      cashFlows.map((cf) => {
        if (cf.id !== id) return cf;
        return {
          ...cf,
          [field]: field === 'amount' ? (value === '' ? '' : Number(value)) : value,
        };
      })
    );
  };

  const handleReset = () => {
    setCashFlows([
      { id: '1', date: '2020-01-01', amount: -100000 },
      { id: '2', date: getTodayDate(), amount: 120000 },
    ]);
  };

  const loadPreset = (presetKey) => {
    const today = getTodayDate();
    if (presetKey === 'sip3yr') {
      setCashFlows([
        { id: '1', date: '2021-01-01', amount: -25000 },
        { id: '2', date: '2021-07-01', amount: -25000 },
        { id: '3', date: '2022-01-01', amount: -25000 },
        { id: '4', date: '2022-07-01', amount: -25000 },
        { id: '5', date: '2023-01-01', amount: -25000 },
        { id: '6', date: today, amount: 185000 },
      ]);
      setCalcName('3-Year Mutual Fund SIP & Exit');
    } else if (presetKey === 'equityFlip') {
      setCashFlows([
        { id: '1', date: '2020-03-25', amount: -200000 },
        { id: '2', date: '2021-10-15', amount: 50000 },
        { id: '3', date: '2022-06-10', amount: -50000 },
        { id: '4', date: today, amount: 380000 },
      ]);
      setCalcName('Equity Growth Portfolio');
    }
  };

  // Calculations
  const { result, summary, sortedFlows } = useMemo(() => {
    const validFlows = cashFlows
      .filter((cf) => cf.date && cf.amount !== '' && !isNaN(Number(cf.amount)))
      .map((cf) => ({
        ...cf,
        amount: Number(cf.amount),
      }));

    const sorted = [...validFlows].sort((a, b) => new Date(a.date) - new Date(b.date));

    let totalInvested = 0;
    let totalWithdrawn = 0;

    sorted.forEach((cf) => {
      if (cf.amount < 0) {
        totalInvested += Math.abs(cf.amount);
      } else {
        totalWithdrawn += cf.amount;
      }
    });

    const netProfit = totalWithdrawn - totalInvested;
    const absoluteReturn = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

    let tenureDays = 0;
    if (sorted.length >= 2) {
      const d1 = new Date(sorted[0].date);
      const d2 = new Date(sorted[sorted.length - 1].date);
      tenureDays = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    }

    const calcResult = calculateXIRR(sorted);

    return {
      result: calcResult,
      summary: {
        totalInvested,
        totalWithdrawn,
        netProfit,
        absoluteReturn,
        tenureDays,
        tenureYears: (tenureDays / 365.25).toFixed(1),
        count: sorted.length,
      },
      sortedFlows: sorted,
    };
  }, [cashFlows]);

  // Chart data
  const chartData = useMemo(() => {
    return sortedFlows.map((cf, idx) => ({
      index: idx + 1,
      date: cf.date,
      amount: cf.amount,
      type: cf.amount < 0 ? 'Outflow (Invested)' : 'Inflow (Return)',
      formattedAmount: formatCurrency(Math.abs(cf.amount)),
    }));
  }, [sortedFlows]);

  const handleExportCSV = () => {
    const rows = sortedFlows.map((cf, idx) => ({
      'S.No': idx + 1,
      'Date': cf.date,
      'Type': cf.amount < 0 ? 'Investment / Outflow' : 'Return / Inflow',
      'Amount (₹)': cf.amount,
      'Formatted Amount': formatCurrency(cf.amount),
    }));
    exportToCSV(rows, 'xirr_cash_flows');
  };

  const handleExportPDF = () => {
    exportToPDF('xirr-report-container', 'XIRR Calculation Report');
  };

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: calcName || 'XIRR Calculation',
        type: 'xirr',
        inputs: { cashFlows },
        results: {
          xirr: result.xirr,
          totalInvested: summary.totalInvested,
          totalWithdrawn: summary.totalWithdrawn,
          netProfit: summary.netProfit,
          absoluteReturn: summary.absoluteReturn,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save calculation:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12" id="xirr-report-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            XIRR Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate Extended Internal Rate of Return for irregular, dated cash flows and SIP investments.
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

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
        <span className="font-medium text-muted-foreground flex items-center gap-1.5">
          <Info className="h-4 w-4 text-primary" /> Quick Presets:
        </span>
        <Button variant="secondary" size="sm" onClick={() => loadPreset('sip3yr')} className="text-xs h-7">
          3-Yr SIP + Exit
        </Button>
        <Button variant="secondary" size="sm" onClick={() => loadPreset('equityFlip')} className="text-xs h-7">
          Equity Portfolio
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs h-7 text-muted-foreground gap-1 ml-auto">
          <RotateCcw className="h-3.5 w-3.5" /> Reset Default
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cash Flows Input */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Dated Cash Flows</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use negative (-) for investments/outflows and positive (+) for withdrawals/portfolio value.
                  </p>
                </div>
                <Button size="sm" onClick={handleAddFlow} className="gap-1.5 h-8">
                  <Plus className="h-4 w-4" /> Add Cash Flow
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-2">
                <span className="col-span-1">#</span>
                <span className="col-span-4">Date</span>
                <span className="col-span-5">Amount (₹)</span>
                <span className="col-span-2 text-right">Action</span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {cashFlows.map((cf, index) => {
                  const isNegative = Number(cf.amount) < 0;
                  return (
                    <div
                      key={cf.id}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <span className="col-span-1 text-xs font-medium text-muted-foreground text-center">
                        {index + 1}
                      </span>
                      <div className="col-span-4">
                        <Input
                          type="date"
                          value={cf.date}
                          onChange={(e) => handleFlowChange(cf.id, 'date', e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="col-span-5 relative">
                        <Input
                          type="number"
                          step="any"
                          value={cf.amount}
                          onChange={(e) => handleFlowChange(cf.id, 'amount', e.target.value)}
                          placeholder="e.g. -50000 or 60000"
                          className={`h-9 text-xs font-mono font-medium ${
                            isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFlow(cf.id)}
                          disabled={cashFlows.length <= 2}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Remove cash flow"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Label htmlFor="calc-name" className="text-xs text-muted-foreground">Name:</Label>
                  <Input
                    id="calc-name"
                    value={calcName}
                    onChange={(e) => setCalcName(e.target.value)}
                    className="h-8 w-48 text-xs"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Outflow (Invested)
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Inflow (Redeemed)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Key Results & Diagnostics */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main XIRR Card */}
          <Card className="border-2 border-primary/20 shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Annualized Return
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-center space-y-2">
              {result.error ? (
                <div className="py-4 space-y-2">
                  <div className="inline-flex items-center justify-center p-3 rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-semibold text-destructive">Calculation Error</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">{result.error}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    {result.xirr >= 0 ? (
                      <TrendingUp className="h-7 w-7 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-7 w-7 text-rose-500" />
                    )}
                    <span
                      className={`text-5xl font-extrabold tracking-tight font-mono ${
                        result.xirr >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatPercent(result.xirr, 2)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    XIRR (Internal Rate of Return)
                  </p>
                </div>
              )}

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 gap-3 pt-6 border-t mt-4 text-left">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total Invested</p>
                  <p className="text-sm font-semibold font-mono mt-0.5 text-foreground">
                    {formatCurrency(summary.totalInvested)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total Inflows / Value</p>
                  <p className="text-sm font-semibold font-mono mt-0.5 text-foreground">
                    {formatCurrency(summary.totalWithdrawn)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Net Profit / Gain</p>
                  <p
                    className={`text-sm font-semibold font-mono mt-0.5 ${
                      summary.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(summary.netProfit)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Absolute Return</p>
                  <p className="text-sm font-semibold font-mono mt-0.5 text-foreground">
                    {formatPercent(summary.absoluteReturn, 2)}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-between text-xs text-muted-foreground">
                <span>Tenure: {summary.tenureYears} yrs ({summary.tenureDays} days)</span>
                <span>Entries: {summary.count} flows</span>
              </div>
            </CardContent>
          </Card>

          {/* Validation Checklist */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Input Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 ${
                    sortedFlows.length >= 2 ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}
                />
                <span>At least 2 cash flows entered ({sortedFlows.length}/2)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 ${
                    summary.totalInvested > 0 ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                />
                <span>Includes initial negative cash flow (investments)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`h-4 w-4 ${
                    summary.totalWithdrawn > 0 ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                />
                <span>Includes positive cash flow (redemption / current value)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chart Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Cash Flow Timeline</CardTitle>
          <p className="text-xs text-muted-foreground">
            Visual distribution of your investments (downward) and redemptions/valuations (upward).
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(val) => `₹${Math.abs(val) >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                  tick={{ fontSize: 11 }}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                <RechartsTooltip
                  formatter={(val) => [formatCurrency(val), 'Amount']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                />
                <Bar dataKey="amount" radius={[4, 4, 4, 4]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.amount >= 0 ? '#10b981' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="pt-6">
          <div className="flex gap-3 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
            <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">Understanding XIRR</p>
              <p>
                XIRR (Extended Internal Rate of Return) is used when cash flows occur at irregular dates or varying intervals,
                such as SIPs, STPs, lump sum top-ups, and partial withdrawals. It computes the annualized compounding rate where
                the Net Present Value (NPV) of all cash flows equals zero.
              </p>
              <p className="mt-1">
                Market investments are subject to market risks. Past XIRR does not guarantee identical future performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
