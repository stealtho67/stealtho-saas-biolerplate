import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Calendar, DollarSign, Users, Star, TrendingUp, Clock,
  Info, Link2, Copy, LayoutDashboard, UserCircle, Scissors,
  Images, CreditCard
} from "lucide-react";
import { COMMISSION_LABELS, getCommissionRules } from "@/lib/commissionRules";
import ProfileEditor from "@/components/barber/ProfileEditor";
import ServicesEditor from "@/components/barber/ServicesEditor";
import PortfolioEditor from "@/components/barber/PortfolioEditor";
import OnboardingChecklist from "@/components/barber/OnboardingChecklist";
import StripePayoutsSection from "@/components/barber/StripePayoutsSection";
import StatusHeader from "@/components/barber/StatusHeader";
import BarberInfoTab from "@/components/barber/BarberInfoTab";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "services", label: "Services", icon: Scissors },
  { id: "portfolio", label: "Portfolio", icon: Images },
  { id: "payouts", label: "Payouts", icon: CreditCard },
  { id: "info", label: "Info", icon: Info },
];

export default function BarberDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [barber, setBarber] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { loadDashboard(); }, []);

  // Auto-sync Stripe status when returning from Stripe onboarding
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stripeParam = params.get("stripe");
    if (stripeParam === "complete" || stripeParam === "refresh") {
      window.history.replaceState({}, "", "/dashboard");
      setActiveTab("payouts");
      if (stripeParam === "refresh") {
        toast.info("Your Stripe session expired. Click 'Resume on Stripe' to continue setup.");
        return;
      }
      // Give Stripe a moment to process, then sync — retry up to 3x if still in progress
      const syncWithRetry = async (attemptsLeft) => {
        try {
          const me = await base44.auth.me();
          const barbers = await base44.entities.Barber.filter({ user_email: me.email });
          if (barbers.length === 0) return;

          const res = await base44.functions.invoke("stripeConnect", {
            action: "sync_status",
            barber_id: barbers[0].id,
          });

          if (res.data?.status) {
            setBarber(prev => prev ? {
              ...prev,
              stripe_status: res.data.status,
              payouts_enabled: res.data.payouts_enabled,
              stripe_onboarding_complete: res.data.charges_enabled && res.data.payouts_enabled,
            } : prev);

            if (res.data.status === "active") {
              toast.success("🎉 Stripe connected! Payouts are now enabled.");
            } else if (res.data.status === "verification_needed") {
              toast.warning("Stripe needs more info before payouts can be enabled. Check the Payouts tab.");
            } else if (attemptsLeft > 1) {
              // Status still pending — retry after a delay
              setTimeout(() => syncWithRetry(attemptsLeft - 1), 4000);
            } else {
              toast.info("Stripe setup in progress. Click 'Check Status' in the Payouts tab once you've finished onboarding.");
            }
          }
        } catch {
          // Silent — don't block UI
        }
      };
      setTimeout(() => syncWithRetry(3), 1500);
    }
  }, [location.search]);

  const loadDashboard = async () => {
    const me = await base44.auth.me();
    if (!me) { navigate("/", { replace: true }); return; }

    const barbers = await base44.entities.Barber.filter({ user_email: me.email });

    const hasBarberRecord = barbers.length > 0;

    if (!hasBarberRecord) {
      // Admins without a barber record → admin dashboard
      if (me.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        // No barber record → apply
        navigate("/apply", { replace: true });
      }
      return;
    }
    // All barbers with a record (pending, action_required, active, suspended) see their dashboard
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
          <p className="text-sm text-muted-foreground mt-1">Apply to join NextCut as a barber</p>
        </div>
        <Link to="/apply"><Button className="mt-2">Apply as a Barber</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-heading font-bold text-2xl">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {barber.display_name}</p>
      </div>

      {/* Status Header — always visible */}
      <div className="mb-5">
        <StatusHeader barber={barber} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-secondary rounded-xl h-12 mb-6 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            // Badge dots for tabs needing attention
            const needsAttention =
              (id === "payouts" && barber.stripe_status !== "active") ||
              (id === "services" && services.length === 0) ||
              (id === "profile" && (!barber.bio || !barber.profile_photo));

            return (
              <TabsTrigger key={id} value={id} className="flex-1 rounded-lg flex items-center gap-1.5 relative">
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">{label}</span>
                {needsAttention && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 border-2 border-background" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview">
          <OverviewTab
            barber={barber}
            services={services}
            bookings={bookings}
            onNavigate={setActiveTab}
            onBarberUpdate={setBarber}
          />
        </TabsContent>

        {/* ── PROFILE TAB ── */}
        <TabsContent value="profile">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-heading font-semibold mb-1">Edit Profile</h2>
            <p className="text-xs text-muted-foreground mb-5">A complete profile with a photo and bio gets significantly more bookings.</p>
            <ProfileEditor barber={barber} onSaved={setBarber} />
          </div>
        </TabsContent>

        {/* ── SERVICES TAB ── */}
        <TabsContent value="services">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-heading font-semibold mb-1">Manage Services</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Add at least one service before clients can book you. Keep pricing up to date.
            </p>
            <ServicesEditor
              barberId={barber.id}
              initialServices={services}
              onServicesChange={setServices}
            />
          </div>
        </TabsContent>

        {/* ── PORTFOLIO TAB ── */}
        <TabsContent value="portfolio">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-heading font-semibold mb-1">Portfolio</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Upload examples of your work. Barbers with portfolio photos attract more clients.
            </p>
            <PortfolioEditor barber={barber} onSaved={setBarber} />
          </div>
        </TabsContent>

        {/* ── PAYOUTS TAB ── */}
        <TabsContent value="payouts">
          <StripePayoutsSection
            barber={barber}
            bookings={bookings}
            onBarberUpdate={setBarber}
          />
        </TabsContent>

        {/* ── INFO TAB ── */}
        <TabsContent value="info">
          <BarberInfoTab barber={barber} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ────────────────────────────────────────────────
// Overview sub-component
// ────────────────────────────────────────────────
function OverviewTab({ barber, services, bookings, onNavigate, onBarberUpdate }) {
  const [rates, setRates] = useState(null);
  const [availableNow, setAvailableNow] = useState(barber.is_available_now || false);
  useEffect(() => { getCommissionRules().then(setRates); }, []);

  const toggleAvailableNow = async () => {
    const next = !availableNow;
    setAvailableNow(next); // optimistic
    try {
      await base44.entities.Barber.update(barber.id, { is_available_now: next });
      onBarberUpdate?.({ ...barber, is_available_now: next });
    } catch {
      setAvailableNow(!next); // rollback
    }
  };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const completedBookings = bookings.filter(b => b.status === "completed");
  const monthBookings = completedBookings.filter(b => {
    try { return isWithinInterval(parseISO(b.date), { start: monthStart, end: monthEnd }); }
    catch { return false; }
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
      {/* Setup Checklist — shown at top of overview */}
      <OnboardingChecklist barber={barber} services={services} onNavigate={onNavigate} />

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

      {/* Available Now Toggle */}
      <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
        <div>
          <p className="text-sm font-semibold">Available Now</p>
          <p className="text-xs text-muted-foreground">Let clients know you're ready for walk-ins</p>
        </div>
        <button
          onClick={toggleAvailableNow}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
            availableNow ? "bg-primary" : "bg-muted"
          }`}
          aria-label="Toggle availability"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
              availableNow ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
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

      {/* Stripe Payouts — inline preview with navigate CTA */}
      {barber.stripe_status !== "active" && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading font-semibold text-sm mb-1">Stripe Payouts Setup</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {barber.stripe_status === "onboarding_in_progress"
                  ? "You've started Stripe setup. Finish onboarding to enable payouts."
                  : "Connect Stripe to receive automatic payouts from online bookings."}
              </p>
            </div>
            <Button size="sm" onClick={() => onNavigate("payouts")} className="shrink-0 gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              {barber.stripe_status === "onboarding_in_progress" ? "Continue" : "Set Up"}
            </Button>
          </div>
        </div>
      )}

      {/* Direct Booking Link */}
      <DirectBookingLink barber={barber} rates={rates} />

      {/* Earnings Breakdown */}
      <EarningsBreakdown bookings={completedBookings} rates={rates} />

      {/* Upcoming Appointments */}
      <UpcomingAppointments bookings={upcomingBookings} />
    </div>
  );
}

function DirectBookingLink({ barber, rates }) {
  const directPct = rates ? Math.round(rates.barber_direct_client * 100) : "...";
  const newPct = rates ? Math.round(rates.new_nextcut_lead * 100) : "...";
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-1">
        <Link2 className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-semibold text-sm">Your Direct Booking Link</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Share with your existing clients — earns you a lower {directPct}% fee vs {newPct}% for new marketplace leads.
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
  );
}

function EarningsBreakdown({ bookings, rates }) {
  const colorMap = {
    new_nextcut_lead: "bg-purple-100 text-purple-700",
    repeat_client: "bg-blue-100 text-blue-700",
    barber_direct_client: "bg-emerald-100 text-emerald-700",
  };
  const getRateDesc = (type) => {
    if (!rates) return "Loading rates...";
    const pct = Math.round(rates[type] * 100);
    const labels = {
      new_nextcut_lead: `New NextCut leads — ${pct}% fee`,
      repeat_client: `Returning clients — ${pct}% fee`,
      barber_direct_client: `Your own clients — ${pct}% fee`,
    };
    return labels[type];
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-heading font-semibold mb-1">Earnings Breakdown</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Commission depends on how the client found you. Tips are always 100% yours and never shared.
      </p>
      <div className="space-y-3">
        {["new_nextcut_lead", "repeat_client", "barber_direct_client"].map(type => {
          const typeBookings = bookings.filter(b => (b.commission_type || "new_nextcut_lead") === type);
          if (typeBookings.length === 0) return null;
          const gross = typeBookings.reduce((s, b) => s + (b.service_price || b.price || 0), 0);
          const fees = typeBookings.reduce((s, b) => s + (b.platform_fee || 0), 0);
          const tips = typeBookings.reduce((s, b) => s + (b.tip_amount || 0), 0);
          return (
            <div key={type} className="p-4 bg-secondary rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colorMap[type]}`}>
                  {COMMISSION_LABELS[type]}
                </span>
                <span className="text-xs text-muted-foreground">{typeBookings.length} bookings</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{getRateDesc(type)}</p>
              <div className="flex gap-4 text-xs">
                <div><p className="text-muted-foreground">Gross</p><p className="font-semibold">${gross.toFixed(2)}</p></div>
                <div><p className="text-muted-foreground">Platform fee</p><p className="font-semibold text-destructive">-${fees.toFixed(2)}</p></div>
                {tips > 0 && <div><p className="text-muted-foreground">Tips (yours)</p><p className="font-semibold text-emerald-600">+${tips.toFixed(2)}</p></div>}
              </div>
            </div>
          );
        })}
        {bookings.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">No completed bookings yet</p>
        )}
      </div>
      <div className="flex items-start gap-2 mt-4 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>Commission is calculated only on service price. Tips are never shared with the platform.</span>
      </div>
    </div>
  );
}

function UpcomingAppointments({ bookings }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold">Upcoming Appointments</h3>
        <Link to="/my-bookings">
          <Button variant="ghost" size="sm" className="text-xs">View All</Button>
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No upcoming appointments</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
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
  );
}