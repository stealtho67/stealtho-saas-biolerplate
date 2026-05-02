import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Scissors, Star, Shield, Zap, TrendingUp, CheckCircle2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BarberCard from "../components/BarberCard";
import ShopCard from "../components/ShopCard";

export default function Home() {
  const [featuredBarbers, setFeaturedBarbers] = useState([]);
  const [topBarbers, setTopBarbers] = useState([]);
  const [availableNow, setAvailableNow] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [shopBarberCounts, setShopBarberCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [stats, setStats] = useState({ barbers: 0, cities: 0, shops: 0 });
  const [isBarberUser, setIsBarberUser] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [allBarbers, allShops] = await Promise.all([
      base44.entities.Barber.filter({ status: "active" }),
      base44.entities.Barbershop.filter({ status: "active" }),
    ]);
    setFeaturedBarbers(allBarbers.filter(b => b.is_featured).slice(0, 4));
    setTopBarbers([...allBarbers].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4));
    setAvailableNow(allBarbers.filter(b => b.is_available_now).slice(0, 4));
    // Count barbers per shop
    const counts = {};
    allBarbers.forEach(b => { if (b.barbershop_id) counts[b.barbershop_id] = (counts[b.barbershop_id] || 0) + 1; });
    setShopBarberCounts(counts);
    const featShops = allShops.filter(s => s.is_featured).slice(0, 3);
    setFeaturedShops(featShops.length > 0 ? featShops : allShops.slice(0, 3));
    const uniqueCities = new Set(allBarbers.map(b => b.city).filter(Boolean));
    setStats({ barbers: allBarbers.length, cities: uniqueCities.size, shops: allShops.length });
    setLoading(false);
    base44.auth.me().then(async me => {
      if (!me) return;
      setUserRole(me.role || "client");
      if (me.role === "barber" || me.role === "admin") {
        setIsBarberUser(true);
      } else if (me.email) {
        const myBarbers = await base44.entities.Barber.filter({ user_email: me.email });
        setIsBarberUser(myBarbers.length > 0);
      }
    }).catch(() => setUserRole("client"));
  };

  return (
    <div className="pb-24 md:pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Scissors className="w-3.5 h-3.5" />
              The future of haircuts
            </div>
            <h1 className="font-heading font-bold text-4xl md:text-6xl tracking-tight leading-[1.1]">
              Fresh cuts,{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                zero hassle
              </span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl mt-4 leading-relaxed max-w-lg">
              Book top-rated barbers near you in seconds. Licensed, reviewed, and ready to cut.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link to="/explore">
                <Button size="lg" className="gap-2 text-base px-8 h-12 rounded-xl shadow-lg shadow-primary/20">
                  <Search className="w-4 h-4" /> Find a Barber
                </Button>
              </Link>
              <Link to="/apply">
                <Button variant="outline" size="lg" className="gap-2 text-base px-8 h-12 rounded-xl">
                  Apply as Barber <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats — live data */}
          {!loading && stats.barbers > 0 && (
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-sm">
              {[
                { label: "Active Barbers", value: stats.barbers },
                { label: "Barbershops", value: stats.shops || 0 },
                { label: "Cities", value: stats.cities || 1 },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-heading font-bold text-2xl md:text-3xl">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "Verified Barbers", desc: "Every barber is licensed and background-checked" },
            { icon: Zap, title: "Book in Seconds", desc: "Find, select, book — done in under 60 seconds" },
            { icon: Star, title: "Rated & Reviewed", desc: "Real reviews from real clients you can trust" },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-card border border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-base">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Barbershops */}
      {!loading && featuredShops.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="font-heading font-bold text-lg">Barbershops</h2>
            </div>
            <Link to="/barbershops" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {featuredShops.map(shop => (
              <ShopCard key={shop.id} shop={shop} barberCount={shopBarberCounts[shop.id] || 0} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center">
            <Link to="/apply?type=shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Building2 className="w-3.5 h-3.5" />
              Own a barbershop? <span className="text-primary font-medium underline underline-offset-2">Apply to list your shop</span>
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </Link>
          </div>
        </section>
      )}

      {/* Available Now */}
      {availableNow.length > 0 && (
        <BarberSection
          title="Available Now"
          icon={<Zap className="w-4 h-4 text-emerald-500" />}
          barbers={availableNow}
          linkTo="/explore"
        />
      )}

      {/* Featured Barbers */}
      {featuredBarbers.length > 0 && (
        <BarberSection
          title="Featured Barbers"
          icon={<Star className="w-4 h-4 text-amber-500" />}
          barbers={featuredBarbers}
          linkTo="/explore"
        />
      )}

      {/* Top Rated */}
      {topBarbers.length > 0 && (
        <BarberSection
          title="Top Rated"
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
          barbers={topBarbers}
          linkTo="/explore"
        />
      )}

      {/* Empty marketplace state */}
      {!loading && topBarbers.length === 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12 text-center">
          <div className="bg-card border border-border rounded-2xl p-10 max-w-lg mx-auto">
            <Scissors className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-heading font-bold text-xl mb-2">Barbers Coming Soon</h2>
            <p className="text-muted-foreground text-sm mb-6">
              We're onboarding our first barbers. Be among the first to join NextCut!
            </p>
            <Link to="/apply">
              <Button className="gap-2">Apply as a Barber <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </section>
      )}

      {/* Barber CTA — shown to non-barbers who haven't applied */}
      {!loading && !isBarberUser && userRole !== "admin" && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="bg-gradient-to-br from-primary/10 to-accent/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-heading font-bold text-xl md:text-2xl mb-2">Are you a barber?</h2>
              <p className="text-muted-foreground text-sm max-w-md">
                Join NextCut and grow your client base. Set your own schedule, manage bookings, and get paid directly.
              </p>
              <ul className="mt-3 space-y-1">
                {["Free to apply", "Keep 80-90% of every booking", "Build your portfolio"].map(item => (
                  <li key={item} className="text-sm flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/apply" className="shrink-0">
              <Button size="lg" className="gap-2 h-12 px-8 rounded-xl shadow-lg shadow-primary/20">
                Apply as a Barber <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function BarberSection({ title, icon, barbers, linkTo }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-heading font-bold text-lg">{title}</h2>
        </div>
        <Link to={linkTo} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
          See all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {barbers.map((barber) => (
          <BarberCard key={barber.id} barber={barber} />
        ))}
      </div>
    </section>
  );
}