import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Plus, Search, X, CheckCircle2, XCircle, Pause, ChevronDown, ChevronUp, MapPin, Scissors, Globe, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  suspended: "bg-red-100 text-red-700",
};

export default function BarbershopManagement() {
  const [shops, setShops] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newShop, setNewShop] = useState({ shop_name: "", city: "", neighborhood: "", description: "", address: "", phone: "", website: "", owner_email: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [allShops, allBarbers] = await Promise.all([
      base44.entities.Barbershop.list("-created_date", 500),
      base44.entities.Barber.list("-created_date", 500),
    ]);
    setShops(allShops);
    setBarbers(allBarbers);
    setLoading(false);
  };

  const updateStatus = async (shop, status) => {
    await base44.entities.Barbershop.update(shop.id, { status });
    setShops(prev => prev.map(s => s.id === shop.id ? { ...s, status } : s));
    toast.success(`${shop.shop_name} marked as ${status}`);
  };

  const createShop = async () => {
    if (!newShop.shop_name.trim() || !newShop.city.trim()) {
      toast.error("Shop name and city are required");
      return;
    }
    setCreating(true);
    const created = await base44.entities.Barbershop.create({ ...newShop, status: "active" });
    setShops(prev => [created, ...prev]);
    setShowCreate(false);
    setNewShop({ shop_name: "", city: "", neighborhood: "", description: "", address: "", phone: "", website: "", owner_email: "" });
    toast.success("Barbershop created!");
    setCreating(false);
  };

  const getShopBarbers = (shopId) => barbers.filter(b => b.barbershop_id === shopId);

  const linkBarber = async (barberId, shopId) => {
    await base44.entities.Barber.update(barberId, { barbershop_id: shopId || null });
    setBarbers(prev => prev.map(b => b.id === barberId ? { ...b, barbershop_id: shopId || null } : b));
    toast.success(shopId ? "Barber linked to shop" : "Barber unlinked from shop");
  };

  const filtered = shops.filter(s =>
    s.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  );

  const unlinkedBarbers = barbers.filter(b => !b.barbershop_id && b.status === "active");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Barbershops</h1>
          <p className="text-sm text-slate-500 mt-0.5">{shops.length} shops registered</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Barbershop
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-heading font-semibold text-slate-800">New Barbershop</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Shop Name *</label>
              <Input value={newShop.shop_name} onChange={e => setNewShop(p => ({ ...p, shop_name: e.target.value }))} placeholder="King's Cuts" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">City *</label>
              <Input value={newShop.city} onChange={e => setNewShop(p => ({ ...p, city: e.target.value }))} placeholder="Denver" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Neighborhood</label>
              <Input value={newShop.neighborhood} onChange={e => setNewShop(p => ({ ...p, neighborhood: e.target.value }))} placeholder="Downtown" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Owner Email</label>
              <Input value={newShop.owner_email} onChange={e => setNewShop(p => ({ ...p, owner_email: e.target.value }))} placeholder="owner@shop.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Address</label>
              <Input value={newShop.address} onChange={e => setNewShop(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Phone</label>
              <Input value={newShop.phone} onChange={e => setNewShop(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
              <Input value={newShop.description} onChange={e => setNewShop(p => ({ ...p, description: e.target.value }))} placeholder="About this barbershop..." />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createShop} disabled={creating}>{creating ? "Creating..." : "Create Shop"}</Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shops..." className="pl-9" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-slate-400" /></button>}
      </div>

      {/* Shops list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No barbershops yet. Add the first one!</p>
          </div>
        )}
        {filtered.map(shop => {
          const shopBarbers = getShopBarbers(shop.id);
          const isExpanded = expandedId === shop.id;
          return (
            <div key={shop.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {/* Shop row */}
              <div className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {shop.shop_logo ? (
                      <img src={shop.shop_logo} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Building2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{shop.shop_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{shop.neighborhood || shop.city}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Scissors className="w-3 h-3" />{shopBarbers.length} barbers</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`text-xs border-0 ${STATUS_STYLES[shop.status] || STATUS_STYLES.pending}`}>
                    {shop.status}
                  </Badge>
                  {shop.status !== "active" && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2"
                      onClick={() => updateStatus(shop, "active")}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activate
                    </Button>
                  )}
                  {shop.status === "active" && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                      onClick={() => updateStatus(shop, "suspended")}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Suspend
                    </Button>
                  )}
                  <button onClick={() => setExpandedId(isExpanded ? null : shop.id)} className="p-1 text-slate-400 hover:text-slate-700">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50">
                  {/* Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500">
                    {shop.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{shop.address}</span>}
                    {shop.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{shop.phone}</span>}
                    {shop.website && <a href={shop.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Globe className="w-3 h-3" />Website</a>}
                    {shop.owner_email && <span>Owner: {shop.owner_email}</span>}
                  </div>
                  {shop.description && <p className="text-xs text-slate-500 leading-relaxed">{shop.description}</p>}

                  {/* Barbers in this shop */}
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-2">Barbers in this shop ({shopBarbers.length})</p>
                    {shopBarbers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No barbers linked yet</p>
                    ) : (
                      <div className="space-y-1.5">
                        {shopBarbers.map(b => (
                          <div key={b.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg overflow-hidden bg-muted">
                                {b.profile_photo ? <img src={b.profile_photo} alt="" className="w-full h-full object-cover" /> :
                                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">{b.display_name?.[0]}</div>}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-800">{b.display_name}</p>
                                <p className="text-[10px] text-slate-400">{b.status}</p>
                              </div>
                            </div>
                            <button onClick={() => linkBarber(b.id, null)} className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Link an unlinked barber */}
                  {unlinkedBarbers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-2">Add a barber to this shop</p>
                      <div className="space-y-1">
                        {unlinkedBarbers.slice(0, 8).map(b => (
                          <div key={b.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                            <span className="text-xs text-slate-700">{b.display_name} <span className="text-slate-400">({b.city})</span></span>
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => linkBarber(b.id, shop.id)}>Link</Button>
                          </div>
                        ))}
                        {unlinkedBarbers.length > 8 && (
                          <p className="text-[10px] text-slate-400 pl-1">...and {unlinkedBarbers.length - 8} more independent barbers</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}