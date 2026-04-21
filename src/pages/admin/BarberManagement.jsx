import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Eye, BadgeCheck, MapPin, Ban, Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { stripeStatusInfo } from "@/lib/stripeConfig";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function BarberManagement() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => { loadBarbers(); }, []);

  const loadBarbers = async () => {
    const all = await base44.entities.Barber.list("-created_date", 500);
    setBarbers(all);
    setLoading(false);
  };

  const updateBarber = async (id, data, msg) => {
    setActionLoading(id);
    await base44.entities.Barber.update(id, data);
    setBarbers(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    setActionLoading(null);
    toast.success(msg);

    // Fire-and-forget email notification on approval
    if (data.status === "active") {
      const barber = barbers.find(b => b.id === id);
      if (barber?.user_email) {
        base44.integrations.Core.SendEmail({
          to: barber.user_email,
          subject: "NextCut — You're Approved! 🎉",
          body: `Hi ${barber.display_name},\n\nGreat news! Your NextCut barber application has been approved. You are now visible on the marketplace and can start receiving bookings.\n\nComplete your profile and connect Stripe to start getting paid:\n${window.location.origin}/dashboard\n\nWelcome to the team!\n— The NextCut Team`
        }).catch(() => {});
      }
    }
  };

  const pending = barbers.filter(b => b.status === "pending");
  const active = barbers.filter(b => b.status === "active");
  // "suspended" covers both rejected applicants and suspended active barbers
  const suspended = barbers.filter(b => b.status === "suspended");

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-slate-900">Barber Management</h1>
        <p className="text-sm text-slate-500">Approve, manage, and monitor barbers</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-slate-100 rounded-xl mb-6">
          <TabsTrigger value="pending" className="rounded-lg">
            Pending {pending.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full">{pending.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="suspended" className="rounded-lg">Rejected/Suspended ({suspended.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pending.length === 0 ? (
            <Empty msg="No pending applications" />
          ) : (
            <div className="grid gap-4">
              {pending.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {b.profile_photo
                        ? <img src={b.profile_photo} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-300">{b.display_name?.[0]}</div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{b.display_name}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {b.city}{b.neighborhood ? `, ${b.neighborhood}` : ""}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{b.user_email}</p>
                          {b.years_experience && (
                            <p className="text-xs text-slate-500 mt-0.5">{b.years_experience} yrs experience</p>
                          )}
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 border-0">Pending Review</Badge>
                      </div>
                      {b.bio && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{b.bio}</p>}
                      {b.specialties?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {b.specialties.slice(0, 5).map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{s}</span>
                          ))}
                          {b.specialties.length > 5 && <span className="text-[10px] text-slate-400">+{b.specialties.length - 5} more</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {b.license_image ? (
                          <a href={b.license_image} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <Eye className="w-3.5 h-3.5" /> View License
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">No license uploaded</span>
                        )}
                        {b.profile_photo && (
                          <a href={b.profile_photo} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:underline">View Photo</a>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Applied: {b.created_date ? new Date(b.created_date).toLocaleDateString() : "—"}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1.5"
                          disabled={actionLoading === b.id}
                          onClick={() => updateBarber(b.id, { status: "active", license_verified: !!b.license_image }, "Barber approved!")}
                        >
                          {actionLoading === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-600 border-red-200 hover:bg-red-50 rounded-lg gap-1.5"
                          disabled={actionLoading === b.id}
                          onClick={() => updateBarber(b.id, { status: "suspended" }, "Barber rejected")}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Barber</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Stripe</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Bookings</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {active.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          {b.profile_photo ? <img src={b.profile_photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">{b.display_name?.[0]}</div>}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{b.display_name}</p>
                          {b.license_verified && <BadgeCheck className="w-3 h-3 text-primary inline" />}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{b.city}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {(() => { const s = stripeStatusInfo(b.stripe_status || "not_connected"); return <span className={`text-xs px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>{s.label}</span>; })()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{b.total_bookings || 0}</td>
                    <td className="px-4 py-3">
                     <div className="flex items-center gap-2">
                       <Link to={`/barber/${b.id}`} target="_blank">
                         <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg gap-1">
                           <ExternalLink className="w-3 h-3" /> View
                         </Button>
                       </Link>
                       <Button
                         size="sm"
                         variant="outline"
                         className="h-7 text-xs rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                         disabled={actionLoading === b.id}
                         onClick={() => updateBarber(b.id, { status: "suspended" }, "Barber suspended")}
                       >
                         <Ban className="w-3 h-3 mr-1" /> Suspend
                       </Button>
                     </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="suspended">
          {suspended.length === 0 ? <Empty msg="No suspended barbers" /> : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Barber</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suspended.map(b => (
                    <tr key={b.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{b.display_name}</p>
                        <p className="text-xs text-slate-400">{b.city} · {b.user_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs rounded-lg" disabled={actionLoading === b.id}
                            onClick={() => updateBarber(b.id, { status: "active" }, "Barber reinstated as active")}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" disabled={actionLoading === b.id}
                            onClick={() => updateBarber(b.id, { status: "pending" }, "Barber moved back to pending")}>
                            Move to Pending
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Loading = () => <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>;
const Empty = ({ msg }) => <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">{msg}</div>;