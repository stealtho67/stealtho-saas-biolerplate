import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const STATUS_COLORS = {
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
};

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    const all = await base44.entities.Booking.list("-created_date", 500);
    setBookings(all);
    setLoading(false);
  };

  const updateBooking = async (id, data, msg) => {
    await base44.entities.Booking.update(id, data);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    toast.success(msg);
  };

  const filtered = bookings.filter(b => {
    const matchSearch = !search || b.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.barber_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.service_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-slate-900">Bookings</h1>
        <p className="text-sm text-slate-500">All platform bookings — {bookings.length} total</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 bg-white" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-36 bg-white">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Client", "Barber", "Service", "Date & Time", "Amount", "Payment", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{b.client_name || b.client_email}</td>
                  <td className="px-4 py-3 text-slate-600">{b.barber_name}</td>
                  <td className="px-4 py-3 text-slate-600">{b.service_name}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {b.date && format(parseISO(b.date), "MMM d, yyyy")} {b.time}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">${b.service_price || b.price || 0}</td>
                  <td className="px-4 py-3">
                    <Badge className={`border-0 text-xs ${b.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {b.payment_status || "unpaid"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`${STATUS_COLORS[b.status]} border-0 text-xs`}>{b.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {b.status === "confirmed" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 rounded-lg"
                          onClick={() => updateBooking(b.id, { status: "completed" }, "Marked complete")}>
                          Complete
                        </Button>
                      )}
                      {b.status !== "cancelled" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => updateBooking(b.id, { status: "cancelled" }, "Booking cancelled")}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No bookings found</div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Loading = () => <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>;