import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Generate from './pages/Generate';
import BrandVoice from './pages/BrandVoice';
import Outputs from './pages/Outputs';
import OutputDetail from './pages/OutputDetail';
import Clients from './pages/Clients';
import Templates from './pages/Templates';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Services from './pages/Services';
import Work from './pages/Work';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import RefundPolicy from './pages/RefundPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import OnboardingChecklist from './components/OnboardingChecklist';
import Admin from './pages/Admin.jsx';

const LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        {/* Global Overlays */}
        <CookieConsent />
        
        <BrowserRouter>
          <OnboardingChecklist />
          <Routes>

            {/* Public Routes */}
            <Route path="/" element={LOCAL_MODE ? <Navigate to="/app/generate" replace /> : <LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/work" element={<Work />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />



            {/* Protected App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/app/analytics" replace />} />
                <Route path="generate"    element={<Generate />} />
                <Route path="outputs"     element={<Outputs />} />
                <Route path="outputs/:id" element={<OutputDetail />} />
                <Route path="brand-voice" element={<BrandVoice />} />
                <Route path="clients"     element={<Clients />} />
                <Route path="templates"   element={<Templates />} />
                <Route path="analytics"   element={<Analytics />} />
                <Route path="settings"    element={<Settings />} />
                <Route path="admin"       element={<Admin />} />
              </Route>
            </Route>

            {/* Global Fallbacks */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
