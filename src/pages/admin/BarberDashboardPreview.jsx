import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Shield, ArrowLeft, LayoutDashboard, UserCircle, Scissors, Images, CreditCard, BookOpen } from "lucide-react";
import BarberInfoTab from "@/components/barber/BarberInfoTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusHeader from "@/components/barber/StatusHeader";
import OnboardingChecklist from "@/components/barber/OnboardingChecklist";
import ProfileEditor from "@/components/barber/ProfileEditor";
import ServicesEditor from "@/components/barber/ServicesEditor";
import PortfolioEditor from "@/components/barber/PortfolioEditor";
import StripePayoutsSection from "@/components/barber/StripePayoutsSection";
import { format, parseISO } from "date-fns";
import { DollarSign, Calendar, Users, Star, TrendingUp, Clock } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "services", label: "Services", icon: Scissors },
  { id: "portfolio", label: "Portfolio", icon: Images },
  { id: "payouts", label: "Payouts", icon: CreditCard },
  { id: "info", label: "Info", icon: BookOpen },
];

// Blank barber template for when a barber has minimal data
const BLANK_BARBER = {
  display_name: "Unnamed Barber",
  bio: "",
  city: "",
  neighborhood: "",
  profile_photo: "",
  portfolio_images: [],
  specialties: [],
  status: "pending",
  stripe_status: "not_connected",
  payouts_enabled: false,
  stripe_onboarding_complete: false,
  license_verified: false,
  rating: 0,
  total_reviews: 0,
  total_bookings: 0,
  is_available_now: false,
};

export default function BarberDashboardPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [barber, setBarber] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    loadPreview();
  }, [id]);

  const loadPreview = async () => {
    const me = await base44.auth.me();
    if (!me || me.role !== "admin") {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    const barbers = await base44.entities.Barber.filter({ id });
    const b = barbers.length > 0 ? { ...BLANK_BARBER, ...barbers[0] } : { ...BLANK_BARBER, id };

    setBarber(b);

    if (b.id) {
      const [allBookings, svcList] = await Promise.all([
        base44.entities.Booking.filter({ barber_id: b.id }),
        base44.entities.Service.filter({ barber_id: b.id }),
      ]);
      setBookings(allBookings);
      setServices(svcList);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <Shield className="w-12 h-12 text-destructive/40" />
        <h2 className="font-heading font-bold text-xl">Admin Only</h2>
        <p className="text-sm text-muted-foreground">This preview is only accessible to admins.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Admin Preview Banner */}
      <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-red-50 border border-red-200">
        <Shield className="w-4 h-4 text-red-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-red-700">Admin Preview — Barber Dashboard</p>
          <p className="text-xs text-red-500 truncate">Viewing as: {barber.display_name} · ID: {barber.id}</p>
        </div>
        <Link to="/admin/barbers">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50">
            <ArrowLeft className="w-3 h-3" /> Back to Admin
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-5">
        <h1 className="font-heading font-bold text-2xl">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {barber.display_name}</p>
      </div>

      {/* Status Header */}
      <div className="mb-5">
        <StatusHeader barber={barber} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-secondary rounded-xl h-12 mb-6 overflow-x-auto">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <TabsTrigger key={tabId} value={tabId} className="flex-1 rounded-lg flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <OverviewTab
            barber={barber}
            services={services}
            bookings={bookings}
            onNavigate={setActiveTab}
          />
        </TabsContent>

        {/* PROFILE */}
        <TabsContent value="profile">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-heading font-semibold mb-1">Edit Profile</h2>
            <p className="text-xs text-muted-foreground mb-5">A complete profile with a photo and bio gets significantly more bookings.</p>
            <ProfileEditor barber={barber} onSaved={(updated) => setBarber(b => ({ ...b, ...updated }))} />
          </div>
        </TabsContent>

        {/* SERVICES */}
        <TabsContent value="services">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-heading font-semibold mb-1">Manage Services</h2>
            <p className="text-xs text-muted-foreground mb-5">Add at least one service before clients can book you.</p>
            <ServicesEditor
              barberId={barber.id}
              initialServices={services}
              onServicesChange={setServices}
            />
          </div>
        </TabsContent>

        {/* PORTFOLIO */}
        <TabsContent value="portfolio">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-heading font-semibold mb-1">Portfolio</h2>
            <p className="text-xs text-muted-foreground mb-5">Upload examples of your work.</p>
            <PortfolioEditor barber={barber} onSaved={(updated) => setBarber(b => ({ ...b, ...updated }))} />
          </div>
        </TabsContent>

        {/* PAYOUTS */}
        <TabsContent value="payouts">
          <StripePayoutsSection
            barber={barber}
            bookings={bookings}
            onBarberUpdate={(updated) => setBarber(b => ({ ...b, ...updated }))}
          />
        </TabsContent>

        {/* INFO */}
        <TabsContent value="info">
          <BarberInfoTab barber={barber} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ barber, services, bookings, onNavigate }) {
  const completedBookings = bookings.filter(b => b.status === "completed");
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.barber_earnings ?? b.price ?? 0), 0);
  const upcomingBookings = bookings
    .filter(b => b.status === "confirmed")
    .sort((a, b) => new Date(a.date + "T" + a.time) - new Date(b.date + "T" + b.time))
    .slice(0, 5);

  const stats = [
    { icon: DollarSign, label: "Total Earnings", value: `$${totalEarnings.toFixed(0)}`, color: "text-emerald-600 bg-emerald-100" },
    { icon: Calendar, label: "Completed", value: completedBookings.length, color: "text-blue-600 bg-blue-100" },
    { icon: Users, label: "Upcoming", value: upcomingBookings.length, color: "text-purple-600 bg-purple-100" },
    { icon: Star, label: "Rating", value: barber.rating?.toFixed(1) || "New", color: "text-amber-600 bg-amber-100" },
  ];

  return (
    <div className="space-y-5">
      <OnboardingChecklist barber={barber} services={services} onNavigate={onNavigate} />

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

      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 opacity-80" />
          <span className="text-sm opacity-80">Total Earnings</span>
        </div>
        <p className="font-heading font-bold text-3xl">${totalEarnings.toFixed(2)}</p>
        <p className="text-xs opacity-60 mt-1">{completedBookings.length} completed bookings</p>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-heading font-semibold mb-4">Upcoming Appointments</h3>
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