import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Scissors, Calendar, DollarSign,
  Users, Star, LogOut, Menu, X, Shield, Settings, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { path: "/admin", icon: LayoutDashboard, label: "Overview" },
  { path: "/admin/barbers", icon: Scissors, label: "Barbers" },
  { path: "/admin/bookings", icon: Calendar, label: "Bookings" },
  { path: "/admin/revenue", icon: DollarSign, label: "Revenue" },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/reviews", icon: Star, label: "Reviews" },
  { path: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then((me) => {
      if (!me || me.role !== "admin") {
        navigate("/");
      } else {
        setUser(me);
      }
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (path) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  const Sidebar = () => (
    <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">NextCut Admin</p>
            <p className="text-[10px] text-slate-400">Control Center</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? "bg-primary text-white"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-slate-800">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <Home className="w-4 h-4" /> Back to Site
        </Link>
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-medium text-slate-300 truncate">{user?.full_name}</p>
          <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60 flex flex-col h-full">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold text-sm">Admin</span>
          </div>
          <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}