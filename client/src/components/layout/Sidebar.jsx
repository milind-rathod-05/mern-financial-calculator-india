import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
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
  Bookmark,
  X,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAVIGATION_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'Investments',
    items: [
      { name: 'SIP Calculator', path: '/sip', icon: TrendingUp },
      { name: 'Advanced SIP / Step-Up', path: '/sip/advanced', icon: ArrowUpCircle },
      { name: 'Lumpsum Calculator', path: '/lumpsum', icon: Wallet },
      { name: 'PPF Calculator', path: '/ppf', icon: Shield, badge: '80C' },
      { name: 'SSA (Sukanya Samriddhi)', path: '/ssa', icon: Heart, badge: 'Tax Free' },
      { name: 'FD Calculator', path: '/fd', icon: Landmark },
      { name: 'RD Calculator', path: '/rd', icon: Repeat },
    ],
  },
  {
    title: 'Retirement',
    items: [
      { name: 'EPF / Retirement', path: '/retirement', icon: Briefcase },
      { name: 'NPS Calculator', path: '/nps', icon: PiggyBank, badge: '80CCD' },
    ],
  },
  {
    title: 'Loans & EMI',
    items: [
      { name: 'Loan EMI Calculator', path: '/emi', icon: Receipt },
      { name: 'Home Loan EMI', path: '/home-loan', icon: Home },
      { name: 'Personal Loan EMI', path: '/personal-loan', icon: User },
      { name: 'Car Loan EMI', path: '/car-loan', icon: Car },
      { name: 'Education Loan EMI', path: '/education-loan', icon: GraduationCap },
    ],
  },
  {
    title: 'Financial Tools',
    items: [
      { name: 'Simple Interest', path: '/simple-interest', icon: Calculator },
      { name: 'Compound Interest', path: '/compound-interest', icon: Layers },
      { name: 'Inflation Calculator', path: '/inflation', icon: TrendingDown },
      { name: 'Goal-Based Planner', path: '/goal', icon: Target },
      { name: 'Gold Investment', path: '/gold', icon: Gem },
      { name: 'CAGR Calculator', path: '/cagr', icon: BarChart3 },
      { name: 'XIRR Calculator', path: '/xirr', icon: LineChart },
    ],
  },
  {
    title: 'Compare & Portfolio',
    items: [
      { name: 'Investment Comparison', path: '/compare', icon: ArrowLeftRight },
      { name: 'Saved Calculations', path: '/saved', icon: Bookmark },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-border">
        <NavLink
          to="/"
          onClick={handleNavClick}
          className="flex items-center gap-2.5 font-bold text-lg text-primary focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-base shadow-sm">
            ₹
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-foreground leading-tight tracking-tight">
              FinCalc <span className="text-primary">India</span>
            </span>
            <span className="text-[11px] font-normal text-muted-foreground leading-none">
              Indian Financial Planning
            </span>
          </div>
        </NavLink>

        {/* Mobile close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {NAVIGATION_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              isActive
                                ? 'text-primary-foreground'
                                : 'text-muted-foreground group-hover:text-foreground'
                            )}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0',
                              isActive
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-muted text-muted-foreground border border-border/50'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-border mt-auto bg-muted/20">
        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
            <span>Indian Financial Norms</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Formulas adhere to RBI, EPFO, PPF Act 2019 & Section 80C guidelines.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:z-30 lg:border-r border-border bg-card">
        {navContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
