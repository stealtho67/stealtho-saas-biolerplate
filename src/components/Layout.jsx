import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Calendar, User, Scissors, Menu, X, LogOut, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [barberProfile, setBarberProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      if (me?.role === "barber") {
        const barbers = await base44.entities.Barber.filter({ user_email: me.email });
        if (barbers.length > 0) setBarberProfile(barbers[0]);
      }
    } catch (e) {
      // Not logged in — still render public layout
    }
  };

  const isAdmin = user?.role === "admin";
  const isBarber = user?.role === "barber";
  const isActive = (path) => location.pathname === path;

  const navItems = isAdmin
    ? [
        { path: "/", icon: Home, label: "Home" },
        { path: "/explore", icon: Search, label: "Explore" },
        { path: "/my-bookings", icon: Calendar, label: "Bookings" },
        { path: "/profile", icon: User, label: "Profile" },
        { path: "/admin", icon: Shield, label: "Admin" },
      ]
    : isBarber
    ? [
        { path: "/", icon: Home, label: "Home" },
        { path: "/dashboard", icon: Scissors, label: "Dashboard" },
        { path: "/my-bookings", icon: Calendar, label: "Bookings" },
        { path: "/profile", icon: User, label: "Profile" },
      ]
    : [
        { path: "/", icon: Home, label: "Home" },
        { path: "/explore", icon: Search, label: "Explore" },
        { path: "/my-bookings", icon: Calendar, label: "Bookings" },
        { path: "/profile", icon: User, label: "Profile" },
      ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav - Desktop */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-card border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-card/80">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Scissors className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">NextCut</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
          {user && (
            <span className="text-sm text-muted-foreground">
              {user.full_name}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => base44.auth.logout()}
            className="text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-50 backdrop-blur-xl bg-card/80">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Scissors className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg">NextCut</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-background/95 backdrop-blur-sm">
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-destructive mt-4"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

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