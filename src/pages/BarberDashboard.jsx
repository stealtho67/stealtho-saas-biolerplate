import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, DollarSign, Users, Star, TrendingUp, Clock } from "lucide-react";
import PayoutsSection from "@/components/PayoutsSection";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function BarberDashboard() {
  const [barber, setBarber] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const me = await base44.auth.me();
    const barbers = await base44.entities.Barber.filter({ user_email: me.email });
    if (barbers.length === 0) {
      setLoading(false);
      return;
    }
    const b = barbers[0];
    setBarber(b);
    const allBookings = await base44.entities.Booking.filter({ barber_id: b.id });
    setBookings(allBookings);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="font-heading font-bold text-xl">Set up your barber profile first</h2>
        <Link to="/profile"><Button className="mt-4">Go to Profile</Button></Link>
      </div>
    );
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const completedBookings = bookings.filter(b => b.status === "completed");
  const monthBookings = completedBookings.filter(b => {
    const d = parseISO(b.date);
    return isWithinInterval(d, { start: monthStart, end: monthEnd });
  });
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const monthEarnings = monthBookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const upcomingBookings = bookings
    .filter(b => b.status === "confirmed")
    .sort((a, b) => new Date(a.date + "T" + a.time) - new Date(b.date + "T" + b.time))
    .slice(0, 5);

  const stats = [
    { icon: DollarSign, label: "This Month", value: `$${monthEarnings}`, color: "text-emerald-600 bg-emerald-100" },
    { icon: Calendar, label: "Month Bookings", value: monthBookings.length, color: "text-blue-600 bg-blue-100" },
    { icon: Users, label: "Total Clients", value: completedBookings.length, color: "text-purple-600 bg-purple-100" },
    { icon: Star, label: "Rating", value: barber.rating?.toFixed(1) || "New", color: "text-amber-600 bg-amber-100" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {barber.display_name}</p>
        </div>
        <Link to="/profile">
          <Button variant="outline" size="sm">Edit Profile</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 bg-card rounded-2xl border border-border">
            <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <p className="font-heading font-bold text-2xl">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Total Earnings Card */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground mb-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 opacity-80" />
          <span className="text-sm opacity-80">Total Earnings</span>
        </div>
        <p className="font-heading font-bold text-3xl">${totalEarnings}</p>
        <p className="text-xs opacity-60 mt-1">{completedBookings.length} completed bookings</p>
      </div>

      {/* Payouts Section */}
      <PayoutsSection barber={barber} bookings={bookings} />

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