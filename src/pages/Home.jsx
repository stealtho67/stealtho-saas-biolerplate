import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Scissors, Star, Shield, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import BarberCard from "../components/BarberCard";

export default function Home() {
  const [featuredBarbers, setFeaturedBarbers] = useState([]);
  const [topBarbers, setTopBarbers] = useState([]);
  const [availableNow, setAvailableNow] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    const allBarbers = await base44.entities.Barber.filter({ status: "active" });
    setFeaturedBarbers(allBarbers.filter(b => b.is_featured).slice(0, 4));
    setTopBarbers([...allBarbers].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4));
    setAvailableNow(allBarbers.filter(b => b.is_available_now).slice(0, 4));
    setLoading(false);
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
              <Link to="/profile">
                <Button variant="outline" size="lg" className="gap-2 text-base px-8 h-12 rounded-xl">
                  I'm a Barber <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12 max-w-md">
            {[
              { label: "Licensed Barbers", value: "100+" },
              { label: "Happy Clients", value: "5K+" },
              { label: "Cities", value: "12" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-heading font-bold text-2xl md:text-3xl">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
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

      {/* Available Now */}
      {availableNow.length > 0 && (
        <BarberSection
          title="Available Now"
          icon={<Zap className="w-4 h-4 text-emerald-500" />}
          barbers={availableNow}
          linkTo="/explore?filter=available"
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
          linkTo="/explore?sort=rating"
        />
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