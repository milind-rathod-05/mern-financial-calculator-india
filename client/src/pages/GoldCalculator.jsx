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
import { Info, Download, Save, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { calculateGold } from '../utils/financialCalculations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function GoldCalculator() {
  const { saveCalculation } = useSavedCalculations();
  const [saveStatus, setSaveStatus] = useState('');

  const [investmentType, setInvestmentType] = useState('amount'); // 'amount' or 'weight'
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [goldWeight, setGoldWeight] = useState(20);
  const [purchasePrice, setPurchasePrice] = useState(5000);
  const [currentPrice, setCurrentPrice] = useState(6500);
  const [makingChargesPercent, setMakingChargesPercent] = useState(8);
  const [taxPercent, setTaxPercent] = useState(0);
  const [sellingCostPercent, setSellingCostPercent] = useState(0);

  const result = useMemo(() => {
    return calculateGold({
      investmentType,
      investmentAmount: Number(investmentAmount) || 0,
      goldWeight: Number(goldWeight) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      currentPrice: Number(currentPrice) || 0,
      makingChargesPercent: Number(makingChargesPercent) || 0,
      taxPercent: Number(taxPercent) || 0,
      sellingCostPercent: Number(sellingCostPercent) || 0,
    });
  }, [
    investmentType,
    investmentAmount,
    goldWeight,
    purchasePrice,
    currentPrice,
    makingChargesPercent,
    taxPercent,
    sellingCostPercent,
  ]);

  const isProfit = result.profitLoss >= 0;

  // Comparison bar chart: Total Cost vs Net Realizable Value
  const comparisonData = useMemo(() => {
    return [
      {
        name: 'Investment',
        'Total Buy Cost': result.totalBuyCost,
        'Gross Market Value': result.currentValue,
        'Net Realizable Value': result.netValue,
      },
    ];
  }, [result]);

  const pieData = useMemo(() => {
    const list = [
      { name: 'Total Buy Cost', value: result.totalBuyCost },
    ];
    if (result.sellingCost > 0) {
      list.push({ name: 'Selling Deductions', value: result.sellingCost });
    }
    if (result.tax > 0) {
      list.push({ name: 'Capital Gains Tax', value: result.tax });
    }
    return list;
  }, [result]);

  const handleSave = async () => {
    try {
      await saveCalculation({
        name: `Gold Investment (${result.goldWeight}g)`,
        type: 'gold',
        inputs: {
          investmentType,
          investmentAmount,
          goldWeight,
          purchasePrice,
          currentPrice,
          makingChargesPercent,
          taxPercent,
          sellingCostPercent,
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
    const csvData = [
      { Parameter: 'Investment Basis', Value: investmentType },
      { Parameter: 'Purchased Weight (Grams)', Value: `${result.goldWeight} g` },
      { Parameter: 'Purchase Rate per Gram', Value: formatCurrency(purchasePrice) },
      { Parameter: 'Current Market Rate per Gram', Value: formatCurrency(currentPrice) },
      { Parameter: 'Making Charges (%)', Value: formatPercent(makingChargesPercent) },
      { Parameter: 'Total Buy Cost', Value: formatCurrency(result.totalBuyCost) },
      { Parameter: 'Gross Current Value', Value: formatCurrency(result.currentValue) },
      { Parameter: 'Selling Deductions', Value: formatCurrency(result.sellingCost) },
      { Parameter: 'Capital Gains Tax', Value: formatCurrency(result.tax) },
      { Parameter: 'Net In-Hand Value', Value: formatCurrency(result.netValue) },
      { Parameter: 'Net Profit / Loss', Value: formatCurrency(result.profitLoss) },
      { Parameter: 'Net Return (%)', Value: formatPercent(result.returnPercent) },
    ];
    exportToCSV(csvData, 'gold_investment_analysis');
  };

  const handleExportPDF = () => {
    exportToPDF('gold-report', 'Gold Investment Performance Analysis');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gold Investment Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Calculate your physical or digital gold returns accounting for making charges, GST, and liquidation costs.
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
              <CardTitle className="text-xl">Purchase & Current Market Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Investment Type Mode */}
              <div className="space-y-2">
                <Label>Investment Mode</Label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setInvestmentType('amount')}
                    className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                      investmentType === 'amount'
                        ? 'bg-background text-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    By Total Amount (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestmentType('weight')}
                    className={`py-2 px-3 text-xs font-semibold rounded-md transition-all ${
                      investmentType === 'weight'
                        ? 'bg-background text-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    By Weight (Grams)
                  </button>
                </div>
              </div>

              {/* Amount or Weight Input */}
              {investmentType === 'amount' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="investmentAmount">Total Investment Amount</Label>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(investmentAmount)}</span>
                  </div>
                  <Input
                    id="investmentAmount"
                    type="number"
                    min={1000}
                    max={10000000}
                    step={1000}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                  />
                  <input
                    type="range"
                    min={5000}
                    max={1000000}
                    step={5000}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="goldWeight">Gold Weight (Grams)</Label>
                    <span className="text-sm font-semibold text-primary">{goldWeight} g</span>
                  </div>
                  <Input
                    id="goldWeight"
                    type="number"
                    min={0.5}
                    max={2000}
                    step={0.5}
                    value={goldWeight}
                    onChange={(e) => setGoldWeight(Number(e.target.value))}
                  />
                  <input
                    type="range"
                    min={1}
                    max={100}
                    step={0.5}
                    value={goldWeight}
                    onChange={(e) => setGoldWeight(Number(e.target.value))}
                    className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              )}

              {/* Purchase Price per gram */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="purchasePrice">Purchase Price (₹ / gram)</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(purchasePrice)}</span>
                </div>
                <Input
                  id="purchasePrice"
                  type="number"
                  min={1000}
                  max={25000}
                  step={50}
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={3000}
                  max={12000}
                  step={50}
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Current Price per gram */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="currentPrice">Current Selling Price (₹ / gram)</Label>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(currentPrice)}</span>
                </div>
                <Input
                  id="currentPrice"
                  type="number"
                  min={1000}
                  max={25000}
                  step={50}
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={3000}
                  max={15000}
                  step={50}
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Making Charges % */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="makingCharges">Making Charges / Premium (%)</Label>
                  <span className="text-sm font-semibold text-primary">{makingChargesPercent}%</span>
                </div>
                <Input
                  id="makingCharges"
                  type="number"
                  step="0.5"
                  min={0}
                  max={35}
                  value={makingChargesPercent}
                  onChange={(e) => setMakingChargesPercent(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={0.5}
                  value={makingChargesPercent}
                  onChange={(e) => setMakingChargesPercent(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Selling Cost % and Capital Gains Tax % */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sellingCost">Selling Deduct (%)</Label>
                  <Input
                    id="sellingCost"
                    type="number"
                    step="0.5"
                    min={0}
                    max={20}
                    value={sellingCostPercent}
                    onChange={(e) => setSellingCostPercent(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxPercent">Capital Gains Tax (%)</Label>
                  <Input
                    id="taxPercent"
                    type="number"
                    step="1"
                    min={0}
                    max={35}
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Results & Visuals */}
        <div className="lg:col-span-7 space-y-6" id="gold-report">
          {/* Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Profit or Loss Card with color indicator */}
            <Card
              className={
                isProfit
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                    {isProfit ? 'Total Net Profit' : 'Total Net Loss'}
                  </p>
                  {isProfit ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    isProfit
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {isProfit ? '+' : ''}
                  {formatCurrency(result.profitLoss)}
                </p>
                <p
                  className={`text-xs font-semibold mt-1 ${
                    isProfit
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {isProfit ? '+' : ''}
                  {formatPercent(result.returnPercent)} Return
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Net Realizable Value
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatCurrency(result.netValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Gold Quantity: {result.goldWeight} grams
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Total Purchase Cost
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {formatCurrency(result.totalBuyCost)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Including {makingChargesPercent}% making charges
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">
                  Current Market Gross Value
                </p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {formatCurrency(result.currentValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  At {formatCurrency(currentPrice)}/g before deductions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart: Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost vs Net Value Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                    <Bar dataKey="Total Buy Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gross Market Value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Net Realizable Value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cost Details Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Transaction Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border text-sm">
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">Gold Quantity</span>
                  <span className="font-semibold">{result.goldWeight} grams</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">Total Acquisition Cost</span>
                  <span className="font-medium">{formatCurrency(result.totalBuyCost)}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">Selling Deduction Charges</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    -{formatCurrency(result.sellingCost)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">Capital Gains Tax Deducted</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    -{formatCurrency(result.tax)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground font-semibold">Net Cash Realizable</span>
                  <span className="font-bold">{formatCurrency(result.netValue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4 flex gap-3 text-amber-900 dark:text-amber-200">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">Gold Investment & Tax Regulations in India:</p>
                <p>
                  Physical jewellery typically incurs 3% GST plus making charges ranging between 6% and 25%,
                  which are not recoverable when selling back. Under revised Income Tax guidelines, gains from
                  physical gold held for over 24 months are treated as Long Term Capital Gains (LTCG) taxed at 12.5%
                  without indexation. Digital Gold and Sovereign Gold Bonds (SGB) have separate tax treatments.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
