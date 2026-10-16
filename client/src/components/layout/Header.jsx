import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  User,
  LogOut,
  Bookmark,
  X,
  TrendingUp,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Sync search input with URL search param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q !== null) {
      setSearchQuery(q);
    } else if (location.pathname !== '/') {
      setSearchQuery('');
    }
  }, [location.search, location.pathname]);

  // Click outside listener for user dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (location.pathname === '/' && location.search) {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-colors duration-200">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar menu"
            className="lg:hidden p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-base group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              ₹
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-primary tracking-tight">
                FinCalc India
              </span>
              <span className="ml-1.5 text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                v1.0
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search input */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-2 md:mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search calculators (SIP, EMI, PPF, NPS, FD...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm bg-muted/40 focus-visible:bg-background transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Right: Theme Toggle & User Menu */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 transition-transform hover:-rotate-12" />
            ) : (
              <Sun className="h-5 w-5 transition-transform hover:rotate-45 text-amber-400" />
            )}
          </Button>

          {/* User authentication states */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/saved')}
                title="Saved calculations"
                aria-label="Saved calculations"
                className="rounded-full text-muted-foreground hover:text-foreground relative"
              >
                <Bookmark className="h-5 w-5" />
              </Button>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label="User account menu"
                  aria-expanded={showUserMenu}
                  className="rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
                >
                  <User className="h-5 w-5" />
                </Button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-popover border border-border p-1.5 z-50 text-popover-foreground animate-in fade-in-0 zoom-in-95">
                    <div className="px-3 py-2 border-b border-border/60">
                      <p className="text-sm font-semibold truncate">
                        {user?.name || 'Investor'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email || ''}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/saved');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-2.5 transition-colors"
                      >
                        <Bookmark className="h-4 w-4 text-primary" />
                        <span>Saved Calculations</span>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/compare');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-2.5 transition-colors"
                      >
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span>Compare Products</span>
                      </button>
                    </div>

                    <div className="border-t border-border/60 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
              className="gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <User className="h-4 w-4" />
              <span>Login</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
