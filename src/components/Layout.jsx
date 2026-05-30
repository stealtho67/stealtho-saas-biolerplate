import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Search, Calendar, User, Scissors, LogOut, Shield, Building2, HelpCircle, Info, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [barberProfile, setBarberProfile] = useState(null);
  

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      // Check for barber profile regardless of role — role update can lag or fail
      if (me?.email) {
        const barbers = await base44.entities.Barber.filter({ user_email: me.email });
        if (barbers.length > 0) setBarberProfile(barbers[0]);
      }
    } catch (e) {
      // Not logged in — still render public layout
    }
  };

  const isAdmin = user?.role === "admin";
  // Barber = explicit role OR has a barber record linked to their account
  const isBarber = user?.role === "barber" || !!barberProfile;
  const isActive = (path) => location.pathname === path;

  const navItems = isAdmin && !barberProfile
    ? [
        { path: "/", icon: Home, label: "Home" },
        { path: "/explore", icon: Search, label: "Explore" },
        { path: "/barbershops", icon: Building2, label: "Shops" },
        { path: "/my-bookings", icon: Calendar, label: "Bookings" },
        { path: "/profile", icon: User, label: "Profile" },
        { path: "/admin", icon: Shield, label: "Admin" },
      ]
    : isAdmin && barberProfile
    ? [
        { path: "/", icon: Home, label: "Home" },
        { path: "/explore", icon: Search, label: "Explore" },
        { path: "/barbershops", icon: Building2, label: "Shops" },
        { path: "/dashboard", icon: Scissors, label: "Dashboard" },
        { path: "/my-bookings", icon: Calendar, label: "Bookings" },
        { path: "/profile", icon: User, label: "Profile" },
        { path: "/admin", icon: Shield, label: "Admin" },
      ]
    : isBarber
    ? [
        { path: "/", icon: Home, label: "Home" },
        { path: "/explore", icon: Search, label: "Explore" },
        { path: "/barbershops", icon: Building2, label: "Shops" },
        { path: "/dashboard", icon: Scissors, label: "Dashboard" },
        { path: "/my-bookings", icon: Calendar, label: "Bookings" },
        { path: "/profile", icon: User, label: "Profile" },
      ]
    : [
        { path: "/", icon: Home, label: "Home" },
        { path: "/explore", icon: Search, label: "Explore" },
        { path: "/barbershops", icon: Building2, label: "Shops" },
        { path: "/my-bookings", icon: Calendar, label: "Bookings" },
        { path: "/profile", icon: User, label: "Profile" },
      ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav - Desktop */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-card border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-card/80">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center glow-teal">
            <Scissors className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">
            <span className="text-foreground">Next</span><span className="text-primary">Cut</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              data-no-lift
              className={`nav-link-underline flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/pricing"
            data-no-lift
            className={`nav-link-underline text-sm font-medium transition-colors px-2 py-1 ${isActive("/pricing") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Pricing
          </Link>
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.full_name}</span>
              <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="text-muted-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => base44.auth.redirectToLogin(window.location.href)}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Header — context-aware (logo on root tabs, back button on sub-routes) */}
      <MobileHeader />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-10 hidden md:block">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Scissors className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold">NextCut</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">The free booking platform built for barbers.</p>
            <p className="text-muted-foreground text-xs mt-2">A StealthO company.</p>
          </div>
          <div>
            <p className="font-semibold mb-2">For Clients</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li><Link to="/explore" className="hover:text-foreground">Find a Barber</Link></li>
              <li><Link to="/barbershops" className="hover:text-foreground">Browse Shops</Link></li>
              <li><Link to="/my-bookings" className="hover:text-foreground">My Bookings</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">For Barbers</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li><Link to="/apply" className="hover:text-foreground">Join Free</Link></li>
              <li><Link to="/apply?type=shop" className="hover:text-foreground">List Your Shop</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Company</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground">How It Works</Link></li>
              <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
              <li><a href="mailto:support@nextcut.app" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Legal</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} NextCut — a StealthO company. All rights reserved.</span>
          <span>
            <a href="mailto:support@nextcut.app" className="hover:text-foreground">support@nextcut.app</a>
            {" · "}
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            {" · "}
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          </span>
        </div>
      </footer>

      {/* Mobile footer — minimal */}
      <div className="md:hidden border-t border-border px-4 py-6 text-center text-xs text-muted-foreground space-y-1 pb-24">
        <div className="flex justify-center gap-4">
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <a href="mailto:support@nextcut.app" className="hover:text-foreground">Contact</a>
        </div>
        <p>© {new Date().getFullYear()} NextCut — a StealthO company</p>
      </div>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
              isActive(item.path)
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}