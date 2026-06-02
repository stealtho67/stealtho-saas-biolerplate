import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import AuthGate from './components/AuthGate';
import Home from './pages/Home';
import Explore from './pages/Explore';
import BarberProfile from './pages/BarberProfile';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import BarberDashboard from './pages/BarberDashboard';
import BarberApplication from './pages/BarberApplication';
import AdminOverview from './pages/admin/Overview';
import AdminBarbers from './pages/admin/BarberManagement';
import AdminBookings from './pages/admin/BookingManagement';
import AdminRevenue from './pages/admin/RevenueTracking';
import AdminUsers from './pages/admin/UserManagement';
import AdminReviews from './pages/admin/ReviewsModeration';
import AdminSettings from './pages/admin/Settings';
import BarberDashboardPreview from './pages/admin/BarberDashboardPreview';
import Barbershops from './pages/Barbershops';
import BarbershopProfile from './pages/BarbershopProfile';
import AdminBarbershops from './pages/admin/BarbershopManagement';
import Pricing from './pages/Pricing';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 16 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -16 }}
    transition={{ duration: 0.18, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {children}
      </Routes>
    </AnimatePresence>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  useDarkMode();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <AnimatedRoutes>
      <Route element={<Layout />}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/explore" element={<PageWrapper><Explore /></PageWrapper>} />
        <Route path="/barber/:id" element={<PageWrapper><BarberProfile /></PageWrapper>} />
        <Route path="/my-bookings" element={<AuthGate pathname="/my-bookings"><PageWrapper><MyBookings /></PageWrapper></AuthGate>} />
        <Route path="/profile" element={<AuthGate pathname="/profile"><PageWrapper><Profile /></PageWrapper></AuthGate>} />
        <Route path="/dashboard" element={<AuthGate pathname="/dashboard"><PageWrapper><BarberDashboard /></PageWrapper></AuthGate>} />
        <Route path="/apply" element={<PageWrapper><BarberApplication /></PageWrapper>} />
        <Route path="/barbershops" element={<PageWrapper><Barbershops /></PageWrapper>} />
        <Route path="/barbershop/:id" element={<PageWrapper><BarbershopProfile /></PageWrapper>} />
        <Route path="/pricing" element={<PageWrapper><Pricing /></PageWrapper>} />
        <Route path="/how-it-works" element={<PageWrapper><HowItWorks /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
        <Route path="/faq" element={<PageWrapper><FAQ /></PageWrapper>} />
        <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
        <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<PageWrapper><AdminOverview /></PageWrapper>} />
        <Route path="/admin/barbers" element={<PageWrapper><AdminBarbers /></PageWrapper>} />
        <Route path="/admin/bookings" element={<PageWrapper><AdminBookings /></PageWrapper>} />
        <Route path="/admin/revenue" element={<PageWrapper><AdminRevenue /></PageWrapper>} />
        <Route path="/admin/users" element={<PageWrapper><AdminUsers /></PageWrapper>} />
        <Route path="/admin/reviews" element={<PageWrapper><AdminReviews /></PageWrapper>} />
        <Route path="/admin/settings" element={<PageWrapper><AdminSettings /></PageWrapper>} />
        <Route path="/admin/barber-preview/:id" element={<PageWrapper><BarberDashboardPreview /></PageWrapper>} />
        <Route path="/admin/barbershops" element={<PageWrapper><AdminBarbershops /></PageWrapper>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </AnimatedRoutes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App