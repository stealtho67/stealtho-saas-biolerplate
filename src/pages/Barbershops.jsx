import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import ShopCard from "@/components/ShopCard";
import EmptyState from "@/components/EmptyState";

export default function Barbershops() {
  const [shops, setShops] = useState([]);
  const [barberCounts, setBarberCounts] = useState({});
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadShops(); }, []);
  useEffect(() => { applyFilter(); }, [shops, search]);

  const loadShops = async () => {
    setLoading(true);
    const [allShops, allBarbers] = await Promise.all([
      base44.entities.Barbershop.filter({ status: "active" }),
      base44.entities.Barber.filter({ status: "active" }),
    ]);
    // Count barbers per shop
    const counts = {};
    allBarbers.forEach(b => {
      if (b.barbershop_id) {
        counts[b.barbershop_id] = (counts[b.barbershop_id] || 0) + 1;
      }
    });
    setBarberCounts(counts);
    setShops(allShops.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)));
    setLoading(false);
  };

  const applyFilter = () => {
    if (!search.trim()) { setFiltered(shops); return; }
    const q = search.toLowerCase();
    setFiltered(shops.filter(s =>
      s.shop_name?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.neighborhood?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    ));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl">Barbershops</h1>
        <p className="text-muted-foreground text-sm mt-1">Find top barbershops near you on NextCut</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-11 rounded-xl"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="text-xs text-muted-foreground mb-4">
        {filtered.length} shop{filtered.length !== 1 ? "s" : ""} found
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        search ? (
          <EmptyState icon={MapPin} title="No barbershops found" description="Try a different search" />
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Partner shops are joining now</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
              Own or manage a barbershop? List it on NextCut and connect with clients in your neighborhood.
            </p>
            <a
              href="/apply?type=shop"
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
            >
              Apply as a Shop
            </a>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(shop => (
            <ShopCard key={shop.id} shop={shop} barberCount={barberCounts[shop.id] || 0} />
          ))}
        </div>
      )}
    </div>
  );
}