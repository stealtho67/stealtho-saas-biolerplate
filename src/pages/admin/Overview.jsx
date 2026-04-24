import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, Calendar, Scissors, Users, TrendingUp, Zap } from "lucide-react";
import StripeReadiness from "@/components/admin/StripeReadiness";
import { calcFees } from "@/lib/stripeConfig";
import { COMMISSION_LABELS } from "@/lib/commissionRules";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer
} from "recharts";
import { subDays, format, parseISO, isAfter } from "date-fns";

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [bookings, barbers, users] = await Promise.all([
      base44.entities.Booking.list("-created_date", 1000),
      base44.entities.Barber.list("-created_date", 500),
      base44.entities.User.list("-created_date", 500),
    ]);

    const now = new Date();
    const d7 = subDays(now, 7);
    const d30 = subDays(now, 30);

    const completed = bookings.filter(b => b.status === "completed");
    const paid = completed.filter(b => b.payment_status === "paid");
    const unpaid = completed.filter(b => b.payment_status !== "paid");
    const totalRevenue = completed.reduce((s, b) => s + (b.service_price || b.price || 0), 0);
    const totalPlatformFees = completed.reduce((s, b) => s + (b.platform_fee ?? calcFees(b.price || 0).platformFee), 0);
    const rev7 = completed.filter(b => isAfter(parseISO(b.date), d7)).reduce((s, b) => s + (b.service_price || b.price || 0), 0);
    const rev30 = completed.filter(b => isAfter(parseISO(b.date), d30)).reduce((s, b) => s + (b.service_price || b.price || 0), 0);

    // Daily chart — last 14 days
    const dailyMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(now, i), "MMM d");
      dailyMap[d] = { date: d, revenue: 0, bookings: 0 };
    }
    completed.forEach(b => {
      if (b.date) {
        const d = format(parseISO(b.date), "MMM d");
        if (dailyMap[d]) {
          dailyMap[d].revenue += (b.service_price || b.price || 0);
          dailyMap[d].bookings += 1;
        }
      }
    });
    const dailyChart = Object.values(dailyMap);

    // Top barbers by revenue
    const barberRevMap = {};
    completed.forEach(b => {
      if (!barberRevMap[b.barber_id]) barberRevMap[b.barber_id] = { id: b.barber_id, name: b.barber_name, revenue: 0, bookings: 0 };
      barberRevMap[b.barber_id].revenue += (b.service_price || b.price || 0);
      barberRevMap[b.barber_id].bookings += 1;
    });
    const topBarbers = Object.values(barberRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Commission type breakdown (paid bookings only)
    const commissionBreakdown = {};
    paid.forEach(b => {
      const type = b.commission_type || "new_nextcut_lead";
      if (!commissionBreakdown[type]) commissionBreakdown[type] = { count: 0, revenue: 0, fees: 0 };
      commissionBreakdown[type].count += 1;
      commissionBreakdown[type].revenue += (b.service_price || b.price || 0);
      commissionBreakdown[type].fees += (b.platform_fee ?? calcFees(b.price || 0).platformFee);
    });

    setData({
      totalRevenue,
      totalPlatformFees,
      paidBookings: paid.length,
      unpaidBookings: unpaid.length,
      rev7,
      rev30,
      allBarbers: barbers,
      activeBarbers: barbers.filter(b => b.status === "active").length,
      pendingBarbers: barbers.filter(b => b.status === "pending").length,
      totalUsers: users.length,
      dailyChart,
      topBarbers,
      commissionBreakdown,
    });
    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  const stats = [
    { icon: DollarSign, label: "Total Revenue", value: `$${data.totalRevenue.toLocaleString()}`, sub: `$${data.rev7} last 7d`, color: "text-emerald-600 bg-emerald-100" },
    { icon: DollarSign, label: "Platform Fees", value: `$${data.totalPlatformFees.toLocaleString()}`, sub: "Per booking (varies)", color: "text-teal-600 bg-teal-100" },
    { icon: Calendar, label: "Paid Bookings", value: data.paidBookings, sub: `${data.unpaidBookings} unpaid`, color: "text-blue-600 bg-blue-100" },
    { icon: Scissors, label: "Active Barbers", value: data.activeBarbers, sub: `${data.pendingBarbers} pending`, color: "text-purple-600 bg-purple-100" },
    { icon: Users, label: "Total Users", value: data.totalUsers.toLocaleString(), sub: "All time", color: "text-orange-600 bg-orange-100" },
    { icon: TrendingUp, label: "Revenue (30d)", value: `$${data.rev30.toLocaleString()}`, sub: "Last 30 days", color: "text-teal-600 bg-teal-100" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Platform performance at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="font-heading font-bold text-xl text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-heading font-semibold text-sm text-slate-700 mb-4">Daily Revenue (14 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.dailyChart}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174,62%,40%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(174,62%,40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v) => [`$${v}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(174,62%,40%)" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-heading font-semibold text-sm text-slate-700 mb-4">Daily Bookings (14 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="bookings" fill="hsl(174,62%,40%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Barbers */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-heading font-semibold text-sm text-slate-700 mb-4">Top Performing Barbers</h3>
        <div className="space-y-3">
          {data.topBarbers.map((b, i) => (
            <div key={b.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{b.name}</p>
                  <p className="text-xs text-slate-400">{b.bookings} bookings</p>
                </div>
              </div>
              <span className="font-heading font-bold text-emerald-600">${b.revenue.toLocaleString()}</span>
            </div>
          ))}
          {data.topBarbers.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">No completed bookings yet</p>
          )}
        </div>
      </div>

      {/* Commission Type Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-heading font-semibold text-sm text-slate-700 mb-4">Revenue by Commission Type</h3>
        {Object.keys(COMMISSION_LABELS).length === 0 || Object.keys(data.commissionBreakdown).length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-4">No paid bookings yet</p>
        ) : (
          <div className="space-y-3">
            {["new_nextcut_lead", "repeat_client", "barber_direct_client"].map(type => {
              const d = data.commissionBreakdown[type];
              if (!d) return null;
              const colorMap = {
                new_nextcut_lead: "bg-purple-100 text-purple-700",
                repeat_client: "bg-blue-100 text-blue-700",
                barber_direct_client: "bg-emerald-100 text-emerald-700",
              };
              return (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colorMap[type]}`}>
                      {COMMISSION_LABELS[type]}
                    </span>
                    <span className="text-xs text-slate-500">{d.count} bookings</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-heading font-bold text-emerald-600">${d.revenue.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">Platform: ${d.fees.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stripe Readiness */}
      <StripeReadiness barbers={data.allBarbers} />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
    </div>
  );
}