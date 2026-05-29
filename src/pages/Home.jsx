import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import BarberCard from "@/components/BarberCard";
import { Scissors, MapPin, Star, Shield, Clock, ChevronRight, Search, Users, Building2, CheckCircle2 } from "lucide-react";

function BarberGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border">
          <div className="aspect-square skeleton" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-2/3 rounded skeleton" />
            <div className="h-3 w-1/2 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [featuredBarbers, setFeaturedBarbers] = useState([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [searchCity, setSearchCity] = useState("");

  useEffect(() => {
    base44.entities.Barber.filter({ status: "active", is_featured: true }, "-rating", 8)
      .then(data => {
        setFeaturedBarbers(data);
        setLoadingBarbers(false);
      })
      .catch(() => setLoadingBarbers(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = searchCity.trim() ? `?city=${encodeURIComponent(searchCity.trim())}` : "";
    window.location.href = `/explore${params}`;
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <section className="relative px-4 pt-16 pb-20 md:pt-24 md:pb-28 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5 border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Now live in your city
          </div>
          <h1 className="font-heading font-black text-4xl md:text-6xl mb-4 tracking-tight">
            Book your next <span className="text-foreground">cut</span><br />
            <span className="text-primary">in minutes.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-lg mx-auto">
            Browse verified local barbers, view their work, and book online — no phone calls, no waiting.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchCity}
                onChange={e => setSearchCity(e.target.value)}
                placeholder="Enter your city..."
                className="w-full h-12 pl-9 pr-4 rounded-xl bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <Button type="submit" className="h-12 px-5 rounded-xl bg-primary hover:bg-orange-600 shadow-lg shadow-primary/25">
              <Search className="w-4 h-4" />
            </Button>
          </form>

          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" />Verified barbers</span>
            <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-primary" />Rated & reviewed</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />Book in 60 seconds</span>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <h2 className="font-heading font-bold text-2xl md:text-3xl text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "1", icon: Search, title: "Find a barber", body: "Search by city or specialty. Browse portfolios and real reviews." },
            { step: "2", icon: Scissors, title: "Pick your service", body: "Choose a service, pick a time that works for you, and confirm." },
            { step: "3", icon: CheckCircle2, title: "Show up fresh", body: "You're booked. Show up, get cut, leave happy." },
          ].map(({ step, icon: Icon, title, body }) => (
            <div key={step} className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-bold text-primary mb-1">Step {step}</span>
              <h3 className="font-heading font-bold text-base mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Barbers ── */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-xl md:text-2xl">Featured barbers</h2>
          <Link to="/explore" className="text-sm text-primary hover:underline flex items-center gap-1">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingBarbers ? (
          <BarberGridSkeleton />
        ) : featuredBarbers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredBarbers.map(barber => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Scissors className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-sm mb-1">Founding barbers are joining now</p>
            <p className="text-xs text-muted-foreground mb-4">Be among the first barbers on the platform — slots are limited.</p>
            <Link to="/apply">
              <Button size="sm" className="rounded-xl">Apply as a Barber</Button>
            </Link>
          </div>
        )}
      </section>

      {/* ── Why Join ── */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Barbers CTA */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Are you a barber?</h3>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              Get discovered locally, showcase your portfolio, and keep clients coming back — free to join, no commission.
            </p>
            <ul className="space-y-1.5 mb-5">
              {["Free founding profile", "Keep your booking link", "80–90% of every booking"].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />{item}
                </li>
              ))}
            </ul>
            <Link to="/apply">
              <Button className="w-full rounded-xl">Join as a Barber <ChevronRight className="w-4 h-4" /></Button>
            </Link>
          </div>

          {/* Shops CTA */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Own a barbershop?</h3>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              List your shop, all your barbers, and start getting booked — manage walk-ins, appointments, and payouts in one place.
            </p>
            <ul className="space-y-1.5 mb-5">
              {["All your chairs, one profile", "Local discovery placement", "Online booking & payments"].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />{item}
                </li>
              ))}
            </ul>
            <Link to="/apply?type=shop">
              <Button variant="outline" className="w-full rounded-xl">List Your Shop <ChevronRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Section ── */}
      <section className="px-4 py-12 max-w-3xl mx-auto text-center">
        <h2 className="font-heading font-bold text-xl md:text-2xl mb-8">Built for trust</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Shield, label: "License verified", desc: "Every barber is license-checked before going live" },
            { icon: Star, label: "Real reviews", desc: "Reviews come from verified clients only" },
            { icon: Users, label: "Community first", desc: "Built to support independent barbers, not big chains" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex flex-col items-center p-4 rounded-xl bg-card border border-border">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="font-semibold text-xs mb-1">{label}</p>
              <p className="text-muted-foreground text-xs leading-relaxed hidden md:block">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 py-16 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="font-heading font-bold text-2xl md:text-3xl mb-3">Ready for your next cut?</h2>
          <p className="text-muted-foreground text-sm mb-6">Find a barber near you in seconds.</p>
          <Link to="/explore">
            <Button className="h-12 px-8 rounded-xl bg-primary hover:bg-orange-600 shadow-lg shadow-primary/25 text-base">
              Browse Barbers <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-4 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scissors className="w-4 h-4 text-primary" />
              <span className="font-bold">NextCut</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">The local marketplace for barbers and clients.</p>
          </div>
          <div>
            <p className="font-semibold mb-2">For Clients</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li><Link to="/explore" className="hover:text-foreground">Find a Barber</Link></li>
              <li><Link to="/barbershops" className="hover:text-foreground">Browse Shops</Link></li>
              <li><Link to="/my-bookings" className="hover:text-foreground">My Bookings</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">For Barbers</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li><Link to="/apply" className="hover:text-foreground">Join as Barber</Link></li>
              <li><Link to="/apply?type=shop" className="hover:text-foreground">List Your Shop</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Company</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li><span className="opacity-50">About</span></li>
              <li><span className="opacity-50">Contact</span></li>
              <li><span className="opacity-50">Privacy</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} NextCut. All rights reserved.
        </div>
      </footer>
    </div>
  );
}