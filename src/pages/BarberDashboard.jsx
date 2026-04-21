import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Calendar, DollarSign, Users, Star, TrendingUp, Clock, Info, Link2, Copy, LayoutDashboard, UserCircle, Scissors, Images } from "lucide-react";
import { COMMISSION_LABELS } from "@/lib/commissionRules";
import PayoutsSection from "@/components/PayoutsSection";
import ProfileEditor from "@/components/barber/ProfileEditor";
import ServicesEditor from "@/components/barber/ServicesEditor";
import PortfolioEditor from "@/components/barber/PortfolioEditor";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function BarberDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [barber, setBarber] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  // Auto-sync Stripe status when returning from Stripe onboarding
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("stripe") === "complete") {
      // Remove query param from URL without reload
      window.history.replaceState({}, "", "/dashboard");
      // Sync after a short delay to let Stripe finalize
      setTimeout(async () => {
        try {
          const me = await base44.auth.me();
          const barbers = await base44.entities.Barber.filter({ user_email: me.email });
          if (barbers.length > 0) {
            const res = await base44.functions.invoke("stripeConnect", {
              action: "sync_status",
              barber_id: barbers[0].id,
            });
            if (res.data?.status) {
              setBarber(prev => prev ? { ...prev, stripe_status: res.data.status, payouts_enabled: res.data.payouts_enabled } : prev);
              if (res.data.status === "active") {
                toast.success("🎉 Stripe connected! Payouts are now enabled.");
              }
            }
          }
        } catch (e) {
          // Silent — don't block UI
        }
      }, 2000);
    }
  }, [location.search]);

  const loadDashboard = async () => {
    const me = await base44.auth.me();
    // Redirect non-barbers (clients) away from this page
    if (me && me.role !== "barber" && me.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }
    const barbers = await base44.entities.Barber.filter({ user_email: me.email });
    if (barbers.length === 0) { setLoading(false); return; }
    const b = barbers[0];
    setBarber(b);
    const [allBookings, svcList] = await Promise.all([
      base44.entities.Booking.filter({ barber_id: b.id }),
      base44.entities.Service.filter({ barber_id: b.id }),
    ]);
    setBookings(allBookings);
    setServices(svcList);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <Scissors className="w-12 h-12 text-muted-foreground/30" />
        <div>
          <h2 className="font-heading font-bold text-xl">No barber profile found</h2>
          <p className="text-sm text-muted-foreground mt-1">Apply to become a barber on NextCut</p>
        </div>
        <Link to="/apply"><Button className="mt-2">Apply as a Barber</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl">My Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {barber.display_name}</p>
        </div>
        {barber.status === "pending" && (
          <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium border border-amber-200">
            ⏳ Pending Approval
          </span>
        )}
        {barber.status === "active" && (
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium border border-emerald-200">
            ✓ Active
          </span>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full bg-secondary rounded-xl h-12 mb-6">
          <TabsTrigger value="overview" className="flex-1 rounded-lg flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" /><span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex-1 rounded-lg flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5" /><span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex-1 rounded-lg flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5" /><span className="hidden sm:inline">Services</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex-1 rounded-lg flex items-center gap-1.5">
            <Images className="w-3.5 h-3.5" /><span className="hidden sm:inline">Portfolio</span>
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview">
          <OverviewTab barber={barber} bookings={bookings} />
        </TabsContent>

        {/* ── PROFILE TAB ── */}
        <TabsContent value="profile">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-heading font-semibold mb-5">Edit Profile</h2>
            <ProfileEditor barber={barber} onSaved={setBarber} />
          </div>
        </TabsContent>

        {/* ── SERVICES TAB ── */}
        <TabsContent value="services">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-heading font-semibold mb-5">Manage Services</h2>
            <ServicesEditor barberId={barber.id} initialServices={services} />
          </div>
        </TabsContent>

        {/* ── PORTFOLIO TAB ── */}
        <TabsContent value="portfolio">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-heading font-semibold mb-5">Portfolio</h2>
            <PortfolioEditor barber={barber} onSaved={setBarber} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ────────────────────────────────────────────────
// Overview sub-component
// ────────────────────────────────────────────────
function OverviewTab({ barber, bookings }) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const completedBookings = bookings.filter(b => b.status === "completed");
  const monthBookings = completedBookings.filter(b => {
    const d = parseISO(b.date);
    return isWithinInterval(d, { start: monthStart, end: monthEnd });
  });
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.barber_earnings ?? b.price ?? 0), 0);
  const monthEarnings = monthBookings.reduce((sum, b) => sum + (b.barber_earnings ?? b.price ?? 0), 0);
  const upcomingBookings = bookings
    .filter(b => b.status === "confirmed")
    .sort((a, b) => new Date(a.date + "T" + a.time) - new Date(b.date + "T" + b.time))
    .slice(0, 5);

  const stats = [
    { icon: DollarSign, label: "This Month", value: `$${monthEarnings.toFixed(0)}`, color: "text-emerald-600 bg-emerald-100" },
    { icon: Calendar, label: "Month Bookings", value: monthBookings.length, color: "text-blue-600 bg-blue-100" },
    { icon: Users, label: "Total Clients", value: completedBookings.length, color: "text-purple-600 bg-purple-100" },
    { icon: Star, label: "Rating", value: barber.rating?.toFixed(1) || "New", color: "text-amber-600 bg-amber-100" },
  ];

  return (
    <div className="space-y-5">
      {/* Pending approval banner */}
      {barber.status === "pending" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Your application is under review</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Once an admin approves your profile, you'll be visible to clients on the marketplace.
              You can still set up your services, portfolio, and Stripe while you wait.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 bg-card rounded-2xl border border-border">
            <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="font-heading font-bold text-2xl">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Total Earnings Banner */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 opacity-80" />
          <span className="text-sm opacity-80">Total Earnings</span>
        </div>
        <p className="font-heading font-bold text-3xl">${totalEarnings.toFixed(2)}</p>
        <p className="text-xs opacity-60 mt-1">{completedBookings.length} completed bookings</p>
      </div>

      {/* Payouts */}
      <PayoutsSection barber={barber} bookings={bookings} />

      {/* Direct Booking Link */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-semibold text-sm">Your Direct Booking Link</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Share with your own clients — earns you 10% commission rate (vs 20% for marketplace leads).
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={`${window.location.origin}/barber/${barber.id}?source=barber_direct_link`}
            className="flex-1 text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-muted-foreground"
          />
          <Button size="sm" variant="outline" onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/barber/${barber.id}?source=barber_direct_link`);
            toast.success("Link copied!");
          }}>
            <Copy className="w-3.5 h-3.5 mr-1" /> Copy
          </Button>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-heading font-semibold mb-1">Earnings Breakdown</h3>
        <p className="text-xs text-muted-foreground mb-4">Commission rate depends on how the client was acquired. Tips are always 100% yours.</p>
        <div className="space-y-3">
          {["new_nextcut_lead", "repeat_client", "barber_direct_client"].map(type => {
            const typeBookings = completedBookings.filter(b => (b.commission_type || "new_nextcut_lead") === type);
            if (typeBookings.length === 0) return null;
            const gross = typeBookings.reduce((s, b) => s + (b.service_price || b.price || 0), 0);
            const fees = typeBookings.reduce((s, b) => s + (b.platform_fee || 0), 0);
            const tips = typeBookings.reduce((s, b) => s + (b.tip_amount || 0), 0);
            const colorMap = { new_nextcut_lead: "bg-purple-100 text-purple-700", repeat_client: "bg-blue-100 text-blue-700", barber_direct_client: "bg-emerald-100 text-emerald-700" };
            const rateDesc = { new_nextcut_lead: "New NextCut leads — 20%", repeat_client: "Returning clients — 15%", barber_direct_client: "Your own clients — 10%" };
            return (
              <div key={type} className="p-4 bg-secondary rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colorMap[type]}`}>{COMMISSION_LABELS[type]}</span>
                  <span className="text-xs text-muted-foreground">{typeBookings.length} bookings</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{rateDesc[type]}</p>
                <div className="flex gap-4 text-xs">
                  <div><p className="text-muted-foreground">Gross</p><p className="font-semibold">${gross.toFixed(2)}</p></div>
                  <div><p className="text-muted-foreground">Platform fee</p><p className="font-semibold text-destructive">-${fees.toFixed(2)}</p></div>
                  {tips > 0 && <div><p className="text-muted-foreground">Tips (yours)</p><p className="font-semibold text-emerald-600">+${tips.toFixed(2)}</p></div>}
                </div>
              </div>
            );
          })}
          {completedBookings.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">No completed bookings yet</p>
          )}
        </div>
        <div className="flex items-start gap-2 mt-4 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Commission is calculated only on service price. Tips are never shared with the platform.</span>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold">Upcoming Appointments</h3>
          <Link to="/my-bookings">
            <Button variant="ghost" size="sm" className="text-xs">View All</Button>
          </Link>
        </div>
        {upcomingBookings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No upcoming appointments</p>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {booking.client_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{booking.client_name}</h4>
                    <p className="text-xs text-muted-foreground">{booking.service_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{format(parseISO(booking.date), "MMM d")}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" /> {booking.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}