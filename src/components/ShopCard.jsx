import { Link } from "react-router-dom";
import { MapPin, Scissors, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ShopCard({ shop, barberCount = 0 }) {
  return (
    <Link
      to={`/barbershop/${shop.id}`}
      className="group block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      {/* Banner / Logo area */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent overflow-hidden">
        {shop.shop_banner ? (
          <img
            src={shop.shop_banner}
            alt={shop.shop_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Scissors className="w-10 h-10 text-primary/30" />
          </div>
        )}
        {shop.is_featured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-amber-500/90 text-white border-0 text-xs backdrop-blur-sm">⭐ Featured</Badge>
          </div>
        )}
        {/* Logo bubble */}
        {shop.shop_logo && (
          <div className="absolute bottom-0 left-4 translate-y-1/2 w-12 h-12 rounded-xl overflow-hidden border-2 border-card bg-card shadow-md">
            <img src={shop.shop_logo} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className={`p-4 ${shop.shop_logo ? "pt-8" : ""}`}>
        <h3 className="font-heading font-semibold text-base text-foreground group-hover:text-primary transition-colors leading-tight">
          {shop.shop_name}
        </h3>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{shop.neighborhood || shop.city}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            <Scissors className="w-3 h-3" />
            {barberCount} barber{barberCount !== 1 ? "s" : ""}
          </span>
        </div>
        {shop.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{shop.description}</p>
        )}
      </div>
    </Link>
  );
}