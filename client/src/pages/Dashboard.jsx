import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  ArrowUpCircle,
  Wallet,
  Shield,
  Heart,
  Landmark,
  Repeat,
  Briefcase,
  PiggyBank,
  Calculator,
  Layers,
  TrendingDown,
  Target,
  Gem,
  BarChart3,
  LineChart,
  Receipt,
  Home,
  User,
  Car,
  GraduationCap,
  ArrowLeftRight,
  Star,
  Search,
  ArrowRight,
  History,
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useSavedCalculations } from '../contexts/SavedCalculationsContext';
import { formatCurrency } from '../utils/currencyFormatter';
import { cn } from '../lib/utils';

// Lucide icon mapping for all calculators
const ICON_MAP = {
  TrendingUp,
  ArrowUpCircle,
  Wallet,
  Shield,
  Heart,
  Landmark,
  Repeat,
  Briefcase,
  PiggyBank,
  Calculator,
  Layers,
  TrendingDown,
  Target,
  Gem,
  BarChart3,
  LineChart,
  Receipt,
  Home,
  User,
  Car,
  GraduationCap,
  ArrowLeftRight,
};

// Category theme styling helper
const CATEGORY_STYLES = {
  Investments: {
    badgeVariant: 'default',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
  },
  Retirement: {
    badgeVariant: 'secondary',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
  },
  Loans: {
    badgeVariant: 'destructive',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white',
  },
  Tools: {
    badgeVariant: 'outline',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
  },
  Compare: {
    badgeVariant: 'default',
    badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white',
  },
};

export const CALCULATOR_LIST = [
  { id: 'sip', name: 'SIP Calculator', description: 'Calculate returns on Systematic Investment Plans with monthly compounding', icon: 'TrendingUp', path: '/sip', category: 'Investments' },
  { id: 'advanced-sip', name: 'Advanced SIP / Step-Up', description: 'SIP with annual step-up increases aligned with yearly salary growth', icon: 'ArrowUpCircle', path: '/sip/advanced', category: 'Investments' },
  { id: 'lumpsum', name: 'Lumpsum Calculator', description: 'One-time investment growth calculator with wealth multiplier projections', icon: 'Wallet', path: '/lumpsum', category: 'Investments' },
  { id: 'ppf', name: 'PPF Calculator', description: 'Public Provident Fund maturity estimator with Section 80C tax benefits', icon: 'Shield', path: '/ppf', category: 'Investments' },
  { id: 'ssa', name: 'SSA Calculator', description: 'Sukanya Samriddhi Account projections under Beti Bachao Beti Padhao', icon: 'Heart', path: '/ssa', category: 'Investments' },
  { id: 'fd', name: 'FD Calculator', description: 'Fixed Deposit maturity and interest with Indian bank quarterly compounding', icon: 'Landmark', path: '/fd', category: 'Investments' },
  { id: 'rd', name: 'RD Calculator', description: 'Recurring Deposit maturity estimator with quarterly compounding interest', icon: 'Repeat', path: '/rd', category: 'Investments' },
  { id: 'epf', name: 'EPF / Retirement', description: 'Employee Provident Fund retirement corpus with EPS & matching contribution', icon: 'Briefcase', path: '/retirement', category: 'Retirement' },
  { id: 'nps', name: 'NPS Calculator', description: 'National Pension System projections with annuity and pension breakdown', icon: 'PiggyBank', path: '/nps', category: 'Retirement' },
  { id: 'simple-interest', name: 'Simple Interest', description: 'Basic simple interest calculator with principal and duration breakdowns', icon: 'Calculator', path: '/simple-interest', category: 'Tools' },
  { id: 'compound-interest', name: 'Compound Interest', description: 'Compound interest with configurable frequency from daily to annual', icon: 'Layers', path: '/compound-interest', category: 'Tools' },
  { id: 'inflation', name: 'Inflation Calculator', description: 'Indian CPI inflation impact on future cost and currency purchasing power', icon: 'TrendingDown', path: '/inflation', category: 'Tools' },
  { id: 'goal', name: 'Goal-Based Planner', description: 'Plan investments backwards to fund retirement, dream house, or child education', icon: 'Target', path: '/goal', category: 'Tools' },
  { id: 'gold', name: 'Gold Investment', description: 'Gold returns comparison across physical bullion, Digital Gold, and SGBs', icon: 'Gem', path: '/gold', category: 'Tools' },
  { id: 'cagr', name: 'CAGR Calculator', description: 'Compound Annual Growth Rate for multi-year stock & mutual fund returns', icon: 'BarChart3', path: '/cagr', category: 'Tools' },
  { id: 'xirr', name: 'XIRR Calculator', description: 'Extended Internal Rate of Return for irregular portfolio cash flows', icon: 'LineChart', path: '/xirr', category: 'Tools' },
  { id: 'emi', name: 'Loan EMI Calculator', description: 'EMI, amortization, and prepayment analysis for loans of all types', icon: 'Receipt', path: '/emi', category: 'Loans' },
  { id: 'home-loan', name: 'Home Loan EMI', description: 'Home loan EMI with prepayment amortization and tax deduction insights', icon: 'Home', path: '/home-loan', category: 'Loans' },
  { id: 'personal-loan', name: 'Personal Loan EMI', description: 'Personal loan EMI calculator with monthly breakdown and total interest', icon: 'User', path: '/personal-loan', category: 'Loans' },
  { id: 'car-loan', name: 'Car Loan EMI', description: 'Car loan EMI calculator with on-road price financing estimation', icon: 'Car', path: '/car-loan', category: 'Loans' },
  { id: 'education-loan', name: 'Education Loan EMI', description: 'Education loan EMI with moratorium period and Section 80E interest deduction', icon: 'GraduationCap', path: '/education-loan', category: 'Loans' },
  { id: 'compare', name: 'Investment Comparison', description: 'Compare multiple investment options side-by-side on returns and tax', icon: 'ArrowLeftRight', path: '/compare', category: 'Compare' },
];

const CATEGORIES = [
  'All',
  'Investments',
  'Retirement',
  'Loans',
  'Tools',
  'Compare',
  'Favorites',
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFilter = searchParams.get('search') || '';

  const [activeCategory, setActiveCategory] = useState('All');
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('fincalc-favorites');
      return saved ? JSON.parse(saved) : ['sip', 'emi', 'ppf'];
    } catch {
      return ['sip', 'emi', 'ppf'];
    }
  });

  const { calculations } = useSavedCalculations();

  // Save favorites to localStorage
  const toggleFavorite = (calcId) => {
    setFavorites((prev) => {
      let updated;
      if (prev.includes(calcId)) {
        updated = prev.filter((id) => id !== calcId);
      } else {
        updated = [...prev, calcId];
      }
      localStorage.setItem('fincalc-favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Sync category tab if user searches
  useEffect(() => {
    if (searchFilter && activeCategory !== 'All' && activeCategory !== 'Favorites') {
      // Keep category filter active with search or let user explore
    }
  }, [searchFilter, activeCategory]);

  // Filtered calculators
  const filteredCalculators = useMemo(() => {
    return CALCULATOR_LIST.filter((calc) => {
      const matchesSearch =
        !searchFilter ||
        calc.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        calc.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        calc.category.toLowerCase().includes(searchFilter.toLowerCase());

      if (!matchesSearch) return false;

      if (activeCategory === 'All') return true;
      if (activeCategory === 'Favorites') return favorites.includes(calc.id);
      return calc.category === activeCategory;
    });
  }, [searchFilter, activeCategory, favorites]);

  // Favorite items for quick access section
  const favoriteCalculators = useMemo(() => {
    return CALCULATOR_LIST.filter((calc) => favorites.includes(calc.id));
  }, [favorites]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      All: CALCULATOR_LIST.length,
      Investments: CALCULATOR_LIST.filter((c) => c.category === 'Investments').length,
      Retirement: CALCULATOR_LIST.filter((c) => c.category === 'Retirement').length,
      Loans: CALCULATOR_LIST.filter((c) => c.category === 'Loans').length,
      Tools: CALCULATOR_LIST.filter((c) => c.category === 'Tools').length,
      Compare: CALCULATOR_LIST.filter((c) => c.category === 'Compare').length,
      Favorites: favorites.length,
    };
    return counts;
  }, [favorites]);

  // Clear search handler
  const handleClearSearch = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    setSearchParams(nextParams);
  };

  // Quick search input handler
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    const nextParams = new URLSearchParams(searchParams);
    if (val) {
      nextParams.set('search', val);
    } else {
      nextParams.delete('search');
    }
    setSearchParams(nextParams);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-background border border-border/80 p-6 md:p-10 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 backdrop-blur px-3 py-1 text-xs font-semibold text-primary shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            🇮🇳 Built for Indian Financial Regulations & Tax Laws
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Plan, Invest & Build Wealth with{' '}
            <span className="text-primary underline decoration-primary/40 underline-offset-4">
              FinCalc India
            </span>
          </h1>

          <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl">
            Accurate, regulatory-compliant financial calculators tailored for Indian investors.
            From SIPs and EPF to Home Loans and Sukanya Samriddhi Accounts, calculate maturity amounts
            in ₹ Lakhs & Crores.
          </p>

          {/* Quick Search in Hero */}
          <div className="pt-2 max-w-xl">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search 22+ calculators (e.g. SIP, EPF, PPF, Home Loan, CAGR)..."
                value={searchFilter}
                onChange={handleSearchInputChange}
                className="pl-10 pr-10 h-11 bg-background shadow-xs text-sm"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>22+ Calculators</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>₹ Lakhs & Crores</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Sec 80C & 80CCD</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>100% Free & Safe</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Calculations Section (if any exist) */}
      {calculations && calculations.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Recent Calculations</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/saved')}
              className="text-xs text-primary hover:text-primary gap-1"
            >
              <span>View All Saved</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {calculations.slice(0, 3).map((calc) => {
              const matchedCalc = CALCULATOR_LIST.find((c) => c.id === calc.type);
              const Icon = matchedCalc ? ICON_MAP[matchedCalc.icon] || Calculator : Calculator;

              return (
                <div
                  key={calc._id}
                  onClick={() => navigate(matchedCalc ? matchedCalc.path : '/saved')}
                  className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {calc.name || matchedCalc?.name || 'Calculation'}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase shrink-0">
                      {calc.type}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(calc.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {calc.results?.maturityAmount
                        ? formatCurrency(calc.results.maturityAmount)
                        : calc.results?.emi
                        ? `${formatCurrency(calc.results.emi)}/mo`
                        : calc.results?.totalCorpus
                        ? formatCurrency(calc.results.totalCorpus)
                        : 'View Details'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Favorite Calculators Section (when not searching and on All tab) */}
      {!searchFilter && activeCategory === 'All' && favoriteCalculators.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <h2 className="text-lg font-bold text-foreground">Quick Access Favorites</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {favoriteCalculators.length} pinned
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteCalculators.map((calc) => {
              const Icon = ICON_MAP[calc.icon] || Calculator;
              const catStyle = CATEGORY_STYLES[calc.category] || CATEGORY_STYLES.Tools;

              return (
                <div
                  key={`fav-${calc.id}`}
                  onClick={() => navigate(calc.path)}
                  className="group relative flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                        catStyle.iconBg
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(calc.id);
                      }}
                      title="Remove from favorites"
                      className="p-1 rounded-md text-amber-400 hover:text-muted-foreground transition-colors"
                    >
                      <Star className="h-4 w-4 fill-amber-400" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <span>{calc.name}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {calc.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                    <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full border', catStyle.badgeClass)}>
                      {calc.category}
                    </span>
                    <span className="font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Calculate <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Category Tabs & Filter Header */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">
              {searchFilter ? `Search Results for "${searchFilter}"` : 'All Calculators'}
            </h2>
            <Badge variant="secondary" className="font-mono">
              {filteredCalculators.length}
            </Badge>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isActive = activeCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {cat === 'Favorites' ? (
                    <Star
                      className={cn(
                        'h-3.5 w-3.5',
                        isActive ? 'fill-primary-foreground' : 'fill-amber-400 text-amber-400'
                      )}
                    />
                  ) : null}
                  <span>{cat}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background/80 text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Active Notification Banner */}
        {searchFilter && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary">
            <span>
              Showing results matching <strong>"{searchFilter}"</strong>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/20"
            >
              Clear filter
            </Button>
          </div>
        )}

        {/* Empty State */}
        {filteredCalculators.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border bg-card/50 space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">No calculators found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchFilter
                ? `We couldn't find any calculator matching "${searchFilter}". Try checking spelling or searching for another term like SIP, EMI, PPF, or FD.`
                : 'No calculators available in this category.'}
            </p>
            {searchFilter && (
              <Button variant="outline" size="sm" onClick={handleClearSearch} className="mt-2 text-xs">
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          /* Calculators Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {filteredCalculators.map((calc) => {
              const Icon = ICON_MAP[calc.icon] || Calculator;
              const isFav = favorites.includes(calc.id);
              const catStyle = CATEGORY_STYLES[calc.category] || CATEGORY_STYLES.Tools;

              return (
                <Card
                  key={calc.id}
                  onClick={() => navigate(calc.path)}
                  className="group relative flex flex-col justify-between overflow-hidden border border-border bg-card hover:border-primary/60 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    {/* Top Row: Icon, Category Badge & Favorite Star */}
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={cn(
                          'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 shadow-2xs',
                          catStyle.iconBg
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                            catStyle.badgeClass
                          )}
                        >
                          {calc.category}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(calc.id);
                          }}
                          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                          className={cn(
                            'p-1.5 rounded-md transition-colors',
                            isFav
                              ? 'text-amber-400 hover:text-amber-500'
                              : 'text-muted-foreground/50 hover:text-amber-400 hover:bg-muted'
                          )}
                        >
                          <Star
                            className={cn(
                              'h-4 w-4 transition-transform group-hover:scale-105',
                              isFav ? 'fill-amber-400' : ''
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Content: Title & Description */}
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors tracking-tight">
                        {calc.name}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {calc.description}
                      </p>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>Open Calculator</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
