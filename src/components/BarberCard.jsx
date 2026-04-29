import { Link } from "react-router-dom";
import { MapPin, Star, BadgeCheck, Zap, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BarberCard({ barber }) {
  return (
    <Link
      to={`/barber/${barber.id}`}
      className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {barber.profile_photo ? (
          <img
            src={barber.profile_photo}
            alt={barber.display_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-heading font-bold text-muted-foreground/30">
            {barber.display_name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {barber.license_verified && (
            <Badge className="bg-primary/90 text-primary-foreground border-0 text-xs gap-1 backdrop-blur-sm">
              <BadgeCheck className="w-3 h-3" /> Verified
            </Badge>
          )}
          {barber.is_available_now && (
            <Badge className="bg-emerald-500/90 text-white border-0 text-xs gap-1 backdrop-blur-sm">
              <Zap className="w-3 h-3" /> Available
            </Badge>
          )}
        </div>
        {barber.is_featured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-amber-500/90 text-white border-0 text-xs backdrop-blur-sm">
              ⭐ Featured
            </Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-semibold text-base text-foreground group-hover:text-primary transition-colors">
              {barber.display_name}
            </h3>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{barber.neighborhood || barber.city}</span>
            </div>
            {barber.barbershop_id && (
              <div className="flex items-center gap-1 text-muted-foreground text-[10px] mt-0.5">
                <Building2 className="w-2.5 h-2.5" />
                <span>Barbershop</span>
              </div>
            )}
          </div>
          {barber.rating > 0 && (
            <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-lg shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold">{barber.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({barber.total_reviews})</span>
            </div>
          )}
        </div>
        {barber.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {barber.specialties.slice(0, 3).map((s) => (
              <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}