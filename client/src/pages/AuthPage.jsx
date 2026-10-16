import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import {
  Calculator,
  Mail,
  Lock,
  User,
  ShieldCheck,
  TrendingUp,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function AuthPage() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginData.email || !loginData.password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!registerData.name || !registerData.email || !registerData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(registerData.name, registerData.email, registerData.password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Registration failed. Please try again with another email.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const demoEmail = 'demo@fincalc.in';
    const demoPassword = 'Password123!';
    setLoginData({ email: demoEmail, password: demoPassword });
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Demo login failed. Please check server connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-1 shadow-sm">
            <Calculator className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            FinCalc India
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your personal, Indian-specific wealth & loan planning suite.
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-lg border">
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setError(''); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none border-b h-12">
              <TabsTrigger value="login" className="text-sm font-semibold">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="text-sm font-semibold">
                Register
              </TabsTrigger>
            </TabsList>

            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Tab Content */}
            <TabsContent value="login">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="text-lg">Welcome back</CardTitle>
                <CardDescription className="text-xs">
                  Enter your credentials to access your synced calculations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-xs">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-9 h-10 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-xs">
                        Password
                      </Label>
                    </div>
                    <div className="relative">
                      <Lock className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-9 h-10 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-10 text-xs font-semibold gap-2">
                    {loading ? 'Signing In...' : 'Sign In'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>

                <div className="pt-3 border-t text-center">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Use Sample Demo Account
                  </button>
                </div>
              </CardContent>
            </TabsContent>

            {/* Register Tab Content */}
            <TabsContent value="register">
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="text-lg">Create Free Account</CardTitle>
                <CardDescription className="text-xs">
                  Save unlimited SIP, EMI, PPF, and tax scenarios securely in the cloud.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name" className="text-xs">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="Aarav Sharma"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        className="pl-9 h-10 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-xs">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="aarav@example.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="pl-9 h-10 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-pass" className="text-xs">
                      Password (min 6 characters)
                    </Label>
                    <div className="relative">
                      <Lock className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="reg-pass"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="pl-9 h-10 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-confirm" className="text-xs">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="reg-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.confirmPassword}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, confirmPassword: e.target.value })
                        }
                        className="pl-9 h-10 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-10 text-xs font-semibold gap-2">
                    {loading ? 'Creating Account...' : 'Create Account'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground">
          <div className="p-2.5 rounded-lg border bg-card flex flex-col items-center gap-1 shadow-2xs">
            <Cloud className="h-4 w-4 text-primary" />
            <span className="font-medium">Cloud Sync</span>
          </div>
          <div className="p-2.5 rounded-lg border bg-card flex flex-col items-center gap-1 shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">100% Private</span>
          </div>
          <div className="p-2.5 rounded-lg border bg-card flex flex-col items-center gap-1 shadow-2xs">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="font-medium">India Specific</span>
          </div>
        </div>
      </div>
    </div>
  );
}
