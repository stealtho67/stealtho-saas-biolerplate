import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
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
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/barber/:id" element={<BarberProfile />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<BarberDashboard />} />
        <Route path="/apply" element={<BarberApplication />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/barbers" element={<AdminBarbers />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/revenue" element={<AdminRevenue />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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