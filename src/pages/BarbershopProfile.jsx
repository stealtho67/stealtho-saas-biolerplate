import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Phone, Globe, Instagram, Scissors, ArrowLeft, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BarberCard from "@/components/BarberCard";

export default function BarbershopProfile() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const s = await base44.entities.Barbershop.get(id);
      if (!s || s.status !== "active") { setLoading(false); return; }
      setShop(s);
      const shopBarbers = await base44.entities.Barber.filter({ barbershop_id: id, status: "active" });
      setBarbers(shopBarbers);
    } catch {
      // not found
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-3">
        <h2 className="font-heading font-bold text-xl">Barbershop not found</h2>
        <p className="text-muted-foreground text-sm">This shop may not be available.</p>
        <Link to="/barbershops"><Button className="mt-2">Browse Barbershops</Button></Link>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      {/* Banner */}
      <div className="relative">
        <div className="h-48 md:h-64 bg-gradient-to-br from-primary/20 to-accent overflow-hidden">
          {shop.shop_banner ? (
            <img src={shop.shop_banner} alt="" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Scissors className="w-16 h-16 text-primary/20" />
            </div>
          )}
        </div>
        <div className="absolute top-4 left-4">
          <Link to="/barbershops">
            <Button variant="secondary" size="icon" className="rounded-full backdrop-blur-sm bg-white/80">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-12 relative">
        {/* Shop header card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted shrink-0 border-4 border-card flex items-center justify-center">
              {shop.shop_logo ? (
                <img src={shop.shop_logo} alt={shop.shop_name} className="w-full h-full object-cover" />
              ) : (
                <Scissors className="w-8 h-8 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-xl md:text-2xl">{shop.shop_name}</h1>
                {shop.is_featured && (
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">⭐ Featured</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{shop.address || shop.neighborhood || shop.city}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Scissors className="w-3.5 h-3.5 shrink-0" />
                <span>{barbers.length} barber{barbers.length !== 1 ? "s" : ""} on NextCut</span>
              </div>
            </div>
          </div>

          {shop.description && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{shop.description}</p>
          )}

          {/* Amenities */}
          {shop.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {shop.amenities.map(a => (
                <span key={a} className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
                  {a}
                </span>
              ))}
            </div>
          )}

          {/* Contact info */}
          <div className="mt-4 flex flex-wrap gap-3">
            {shop.phone && (
              <a href={`tel:${shop.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-3.5 h-3.5" /> {shop.phone}
              </a>
            )}
            {shop.website && (
              <a href={shop.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Globe className="w-3.5 h-3.5" /> Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {shop.instagram && (
              <a href={shop.instagram.startsWith("http") ? shop.instagram : `https://instagram.com/${shop.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </a>
            )}
          </div>
        </div>

        {/* Barbers section */}
        <div className="mt-6">
          <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            Our Barbers
          </h2>
          {barbers.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <Scissors className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No barbers listed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {barbers.map(barber => (
                <BarberCard key={barber.id} barber={barber} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}