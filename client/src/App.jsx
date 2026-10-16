import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SavedCalculationsProvider } from './contexts/SavedCalculationsContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import SIPCalculator from './pages/SIPCalculator';
import AdvancedSIPCalculator from './pages/AdvancedSIPCalculator';
import LumpsumCalculator from './pages/LumpsumCalculator';
import PPFCalculator from './pages/PPFCalculator';
import SSACalculator from './pages/SSACalculator';
import FDCalculator from './pages/FDCalculator';
import RDCalculator from './pages/RDCalculator';
import LoanEMICalculator from './pages/LoanEMICalculator';
import RetirementCalculator from './pages/RetirementCalculator';
import NPSCalculator from './pages/NPSCalculator';
import SimpleInterestCalculator from './pages/SimpleInterestCalculator';
import CompoundInterestCalculator from './pages/CompoundInterestCalculator';
import InflationCalculator from './pages/InflationCalculator';
import GoalCalculator from './pages/GoalCalculator';
import GoldCalculator from './pages/GoldCalculator';
import CAGRCalculator from './pages/CAGRCalculator';
import XIRRCalculator from './pages/XIRRCalculator';
import InvestmentComparison from './pages/InvestmentComparison';
import HomeLoanCalculator from './pages/HomeLoanCalculator';
import PersonalLoanCalculator from './pages/PersonalLoanCalculator';
import CarLoanCalculator from './pages/CarLoanCalculator';
import EducationLoanCalculator from './pages/EducationLoanCalculator';
import SavedCalculations from './pages/SavedCalculations';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SavedCalculationsProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="sip" element={<SIPCalculator />} />
              <Route path="sip/advanced" element={<AdvancedSIPCalculator />} />
              <Route path="lumpsum" element={<LumpsumCalculator />} />
              <Route path="ppf" element={<PPFCalculator />} />
              <Route path="ssa" element={<SSACalculator />} />
              <Route path="fd" element={<FDCalculator />} />
              <Route path="rd" element={<RDCalculator />} />
              <Route path="emi" element={<LoanEMICalculator />} />
              <Route path="retirement" element={<RetirementCalculator />} />
              <Route path="nps" element={<NPSCalculator />} />
              <Route path="simple-interest" element={<SimpleInterestCalculator />} />
              <Route path="compound-interest" element={<CompoundInterestCalculator />} />
              <Route path="inflation" element={<InflationCalculator />} />
              <Route path="goal" element={<GoalCalculator />} />
              <Route path="gold" element={<GoldCalculator />} />
              <Route path="cagr" element={<CAGRCalculator />} />
              <Route path="xirr" element={<XIRRCalculator />} />
              <Route path="compare" element={<InvestmentComparison />} />
              <Route path="home-loan" element={<HomeLoanCalculator />} />
              <Route path="personal-loan" element={<PersonalLoanCalculator />} />
              <Route path="car-loan" element={<CarLoanCalculator />} />
              <Route path="education-loan" element={<EducationLoanCalculator />} />
              <Route path="saved" element={<SavedCalculations />} />
              <Route path="auth" element={<AuthPage />} />
            </Route>
          </Routes>
        </SavedCalculationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
