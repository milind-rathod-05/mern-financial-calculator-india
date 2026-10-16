import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useSavedCalculations } from '../contexts/SavedCalculationsContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatPercent } from '../utils/currencyFormatter';
import {
  Trash2,
  Copy,
  Search,
  Calculator,
  LogIn,
  ExternalLink,
  Calendar,
  AlertCircle,
  Cloud,
  CheckCircle2,
  Filter,
  Layers,
  ArrowRight,
} from 'lucide-react';

// Map calculator type to route
const TYPE_ROUTES = {
  'sip': '/sip',
  'step-up-sip': '/sip/advanced',
  'lumpsum': '/lumpsum',
  'ppf': '/ppf',
  'ssa': '/ssa',
  'fd': '/fd',
  'rd': '/rd',
  'epf': '/retirement',
  'nps': '/nps',
  'loan-emi': '/emi',
  'home-loan': '/home-loan',
  'personal-loan': '/personal-loan',
  'car-loan': '/car-loan',
  'education-loan': '/education-loan',
  'simple-interest': '/simple-interest',
  'compound-interest': '/compound-interest',
  'inflation': '/inflation',
  'goal-based': '/goal',
  'gold': '/gold',
  'cagr': '/cagr',
  'xirr': '/xirr',
  'comparison': '/compare',
};

const TYPE_LABELS = {
  'sip': 'SIP',
  'step-up-sip': 'Step-Up SIP',
  'lumpsum': 'Lumpsum',
  'ppf': 'PPF',
  'ssa': 'Sukanya Samriddhi',
  'fd': 'Fixed Deposit',
  'rd': 'Recurring Deposit',
  'epf': 'EPF / Retirement',
  'nps': 'NPS',
  'loan-emi': 'Loan EMI',
  'home-loan': 'Home Loan',
  'personal-loan': 'Personal Loan',
  'car-loan': 'Car Loan',
  'education-loan': 'Education Loan',
  'simple-interest': 'Simple Interest',
  'compound-interest': 'Compound Interest',
  'inflation': 'Inflation',
  'goal-based': 'Goal Planner',
  'gold': 'Gold',
  'cagr': 'CAGR',
  'xirr': 'XIRR',
  'comparison': 'Comparison',
};

export default function SavedCalculations() {
  const navigate = useNavigate();
  const { calculations, loading, deleteCalculation, duplicateCalculation } = useSavedCalculations();
  const { isAuthenticated, user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  // Filter calculations
  const filteredCalculations = useMemo(() => {
    return calculations.filter((calc) => {
      // Type filter
      if (selectedType !== 'all' && calc.type !== selectedType) {
        return false;
      }
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = (calc.name || '').toLowerCase().includes(query);
        const matchesType = (TYPE_LABELS[calc.type] || calc.type || '').toLowerCase().includes(query);
        return matchesName || matchesType;
      }
      return true;
    });
  }, [calculations, selectedType, searchQuery]);

  // Extract all present types for the filter dropdown
  const availableTypes = useMemo(() => {
    const types = new Set();
    calculations.forEach((c) => {
      if (c.type) types.add(c.type);
    });
    return Array.from(types);
  }, [calculations]);

  const handleDelete = async (id) => {
    try {
      await deleteCalculation(id);
      setDeleteConfirmId(null);
      setActionMessage('Calculation deleted successfully.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete calculation:', err);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateCalculation(id);
      setActionMessage('Calculation duplicated.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Failed to duplicate calculation:', err);
    }
  };

  const handleOpen = (calc) => {
    const route = TYPE_ROUTES[calc.type] || '/';
    // Navigate with saved calculation in state
    navigate(route, { state: { savedCalc: calc } });
  };

  // Helper to render key metric
  const renderKeyResult = (calc) => {
    const res = calc.results || {};
    if (res.maturityValue !== undefined) {
      return (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Maturity Value</p>
          <p className="text-lg font-bold font-mono text-primary">{formatCurrency(res.maturityValue)}</p>
        </div>
      );
    }
    if (res.monthlyEMI !== undefined || res.emi !== undefined) {
      return (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly EMI</p>
          <p className="text-lg font-bold font-mono text-primary">{formatCurrency(res.monthlyEMI || res.emi)}</p>
        </div>
      );
    }
    if (res.xirr !== undefined) {
      return (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">XIRR Return</p>
          <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatPercent(res.xirr, 2)}
          </p>
        </div>
      );
    }
    if (res.cagr !== undefined) {
      return (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CAGR</p>
          <p className="text-lg font-bold font-mono text-primary">{formatPercent(res.cagr, 2)}</p>
        </div>
      );
    }
    if (res.totalCorpus !== undefined) {
      return (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Corpus Value</p>
          <p className="text-lg font-bold font-mono text-primary">{formatCurrency(res.totalCorpus)}</p>
        </div>
      );
    }
    return (
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saved State</p>
        <p className="text-sm font-semibold font-mono text-foreground">Completed</p>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Saved Calculations
          </h1>
          <p className="text-muted-foreground mt-1">
            Review, duplicate, or reload previously configured financial calculations and scenarios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <Button onClick={() => navigate('/auth')} variant="outline" size="sm" className="gap-2">
              <LogIn className="h-4 w-4" /> Sign In to Sync Cloud
            </Button>
          )}
          <Button onClick={() => navigate('/')} variant="default" size="sm" className="gap-2">
            <Calculator className="h-4 w-4" /> New Calculation
          </Button>
        </div>
      </div>

      {/* Cloud Sync Status Banner */}
      {!isAuthenticated ? (
        <Card className="bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 shadow-sm">
          <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-300">
            <div className="flex items-center gap-3">
              <Cloud className="h-5 w-5 text-blue-600 shrink-0" />
              <span>
                You are currently saving calculations locally on this browser. Create a free FinCalc India account to sync across devices and access them anywhere.
              </span>
            </div>
            <Button
              onClick={() => navigate('/auth')}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 h-8 text-xs gap-1"
            >
              Sign In / Register <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Synced with cloud account: <strong>{user?.email}</strong></span>
        </div>
      )}

      {/* Toast Feedback */}
      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {actionMessage}
        </div>
      )}

      {/* Controls: Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search saved scenarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-10 text-xs bg-background border rounded-md px-3 text-foreground w-full sm:w-56"
          >
            <option value="all">All Calculation Types ({calculations.length})</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t] || t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calculations Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Loading your saved calculations...
        </div>
      ) : filteredCalculations.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 rounded-full bg-muted text-muted-foreground">
              <Calculator className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-base">No Saved Calculations Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchQuery || selectedType !== 'all'
                ? 'No calculations match your filter criteria. Try clearing the search or type filter.'
                : 'You have not saved any calculations yet. Run any calculator and click the Save button to store it here.'}
            </p>
            <Button onClick={() => navigate('/sip')} size="sm" className="mt-2 text-xs">
              Explore SIP Calculator
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCalculations.map((calc) => {
            const formattedDate = calc.createdAt
              ? new Date(calc.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent';

            const typeLabel = TYPE_LABELS[calc.type] || calc.type || 'Calculator';

            return (
              <Card
                key={calc._id}
                className="shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border"
              >
                <CardHeader className="pb-3 pt-4 border-b">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {typeLabel}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3" /> {formattedDate}
                    </span>
                  </div>
                  <CardTitle className="text-base font-semibold mt-2 line-clamp-1">
                    {calc.name || 'Untitled Calculation'}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                  {/* Key Result */}
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    {renderKeyResult(calc)}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpen(calc)}
                      className="text-xs h-8 gap-1 flex-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open / Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(calc._id)}
                      title="Duplicate calculation"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>

                    {deleteConfirmId === calc._id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(calc._id)}
                          className="h-8 text-[11px] px-2"
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(null)}
                          className="h-8 text-[11px] px-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(calc._id)}
                        title="Delete calculation"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
