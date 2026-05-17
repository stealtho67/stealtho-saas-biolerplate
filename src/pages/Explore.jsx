import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BarberCard from "../components/BarberCard";
import EmptyState from "../components/EmptyState";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";

export default function Explore() {
  const [barbers, setBarbers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [cityFilter, setCityFilter] = useState("all");
  const [cities, setCities] = useState([]);

  useEffect(() => {
    loadBarbers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [barbers, search, sortBy, cityFilter]);

  const loadBarbers = useCallback(async () => {
    setLoading(true);
    const all = await base44.entities.Barber.filter({ status: "active" });
    setBarbers(all);
    const uniqueCities = [...new Set(all.map(b => b.city).filter(Boolean))];
    setCities(uniqueCities);
    setLoading(false);
  }, []);

  const { pulling, pullDistance, refreshing, threshold } = usePullToRefresh(loadBarbers);

  const applyFilters = () => {
    let result = [...barbers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.display_name?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        b.neighborhood?.toLowerCase().includes(q) ||
        b.specialties?.some(s => s.toLowerCase().includes(q))
      );
    }

    if (cityFilter !== "all") {
      result = result.filter(b => b.city === cityFilter);
    }

    if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "reviews") {
      result.sort((a, b) => (b.total_reviews || 0) - (a.total_reviews || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    setFiltered(result);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} threshold={threshold} />
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl">Explore Barbers</h1>
        <p className="text-muted-foreground text-sm mt-1">Find the perfect barber near you</p>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, city, or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="icon"
          className="h-11 w-11 rounded-xl shrink-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 p-4 bg-card rounded-xl border border-border">
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground mb-1 block">City</label>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground mb-1 block">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground mb-4">
        {filtered.length} barber{filtered.length !== 1 ? "s" : ""} found
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        search || cityFilter !== "all" ? (
          <EmptyState
            icon={MapPin}
            title="No barbers found"
            description="Try changing your search or filters"
          />
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Founding barbers are joining now</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-2">
              NextCut is building the easiest way to find your next barber by seeing real work first.
            </p>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
              Want your barber listed? Send them this page, or apply yourself.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/apply"
                className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
              >
                Apply as a Barber
              </a>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "NextCut", url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-secondary"
              >
                Share this page
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((barber) => (
            <BarberCard key={barber.id} barber={barber} />
          ))}
        </div>
      )}
    </div>
  );
}