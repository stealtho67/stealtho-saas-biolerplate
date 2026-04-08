import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, BarChart2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { subDays, format, parseISO, isAfter, startOfWeek, startOfMonth } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PLATFORM_FEE = 0.1; // 10%
const COLORS = ["hsl(174,62%,40%)", "hsl(174,45%,55%)", "hsl(210,40%,50%)", "hsl(43,74%,66%)", "hsl(27,87%,67%)"];

export default function RevenueTracking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const all = await base44.entities.Booking.list("-created_date", 1000);
    setBookings(all.filter(b => b.status === "completed"));
    setLoading(false);
  };

  if (loading) return <Loading />;

  const days = parseInt(range);
  const cutoff = subDays(new Date(), days);
  const ranged = bookings.filter(b => b.date && isAfter(parseISO(b.date), cutoff));

  const totalGross = bookings.reduce((s, b) => s + (b.price || 0), 0);
  const rangeGross = ranged.reduce((s, b) => s + (b.price || 0), 0);
  const platformRevenue = totalGross * PLATFORM_FEE;
  const avgValue = bookings.length ? Math.round(totalGross / bookings.length) : 0;

  // Daily breakdown
  const dailyMap = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), days <= 14 ? "MMM d" : "MMM d");
    dailyMap[d] = { date: d, gross: 0, fee: 0 };
  }
  ranged.forEach(b => {
    if (b.date) {
      const d = format(parseISO(b.date), "MMM d");
      if (dailyMap[d]) {
        dailyMap[d].gross += b.price || 0;
        dailyMap[d].fee += (b.price || 0) * PLATFORM_FEE;
      }
    }
  });
  const dailyChart = Object.values(dailyMap);

  // Per barber
  const barberMap = {};
  bookings.forEach(b => {
    if (!barberMap[b.barber_id]) barberMap[b.barber_id] = { name: b.barber_name, gross: 0, count: 0 };
    barberMap[b.barber_id].gross += b.price || 0;
    barberMap[b.barber_id].count += 1;
  });
  const perBarber = Object.values(barberMap).sort((a, b) => b.gross - a.gross).slice(0, 8);
  const pieData = perBarber.slice(0, 5).map(b => ({ name: b.name, value: b.gross }));

  const stats = [
    { icon: DollarSign, label: "Total Gross Revenue", value: `$${totalGross.toLocaleString()}`, color: "text-emerald-600 bg-emerald-100" },
    { icon: TrendingUp, label: `Revenue (${range}d)`, value: `$${rangeGross.toLocaleString()}`, color: "text-blue-600 bg-blue-100" },
    { icon: DollarSign, label: "Platform Fees (10%)", value: `$${platformRevenue.toLocaleString()}`, color: "text-purple-600 bg-purple-100" },
    { icon: BarChart2, label: "Avg Booking Value", value: `$${avgValue}`, color: "text-orange-600 bg-orange-100" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Revenue</h1>
          <p className="text-sm text-slate-500">Platform earnings and payouts</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-32 h-9 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="font-heading font-bold text-xl text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-heading font-semibold text-sm text-slate-700 mb-4">Gross vs. Platform Fee</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dailyChart}>
            <defs>
              <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174,62%,40%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(174,62%,40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(days / 7)} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v, n) => [`$${v.toFixed(0)}`, n === "gross" ? "Gross" : "Platform Fee"]} />
            <Area type="monotone" dataKey="gross" stroke="hsl(174,62%,40%)" fill="url(#grossGrad)" strokeWidth={2} name="gross" />
            <Area type="monotone" dataKey="fee" stroke="hsl(174,45%,55%)" fill="none" strokeWidth={2} strokeDasharray="4 2" name="fee" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-heading font-semibold text-sm text-slate-700 mb-4">Revenue by Barber</h3>
          <div className="space-y-3">
            {perBarber.map((b, i) => (
              <div key={b.name} className="flex items-center gap-3">
                <div className="w-5 text-xs font-bold text-slate-400">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{b.name}</span>
                    <span className="text-slate-500 text-xs">{b.count} bookings</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(b.gross / (perBarber[0]?.gross || 1)) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-heading font-bold text-emerald-600 w-16 text-right">${b.gross}</span>
              </div>
            ))}
            {perBarber.length === 0 && <p className="text-center text-slate-400 text-sm py-6">No data yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-heading font-semibold text-sm text-slate-700 mb-4">Revenue Share</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => [`$${v}`, ""]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const Loading = () => <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>;