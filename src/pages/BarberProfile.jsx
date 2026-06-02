import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Star, BadgeCheck, Clock, Calendar, ArrowLeft, Share2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import StarRating from "../components/StarRating";
import ReviewCard from "../components/ReviewCard";
import BookingModal from "../components/BookingModal";

export default function BarberProfile() {
  const { id } = useParams();
  const [barber, setBarber] = useState(null);
  const [shop, setShop] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadData();
    // Handle cancelled Stripe payment — show toast and clean up pending booking
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") {
      toast.info("Payment cancelled — your booking was not confirmed.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [id]);

  const loadData = async () => {
    // Use get() first for reliability, fall back to filter if needed
    let b;
    try {
      b = await base44.entities.Barber.get(id);
    } catch (_) {
      const list = await base44.entities.Barber.filter({ id });
      b = list[0];
    }
    // Block access to non-active barbers
    if (!b || b.status !== "active") {
      setLoading(false);
      return;
    }
    setBarber(b);

    const [svcRes, rev] = await Promise.all([
      base44.functions.invoke("manageBarberServices", { action: "listPublic", barberId: id }),
      base44.entities.Review.filter({ barber_id: id }),
    ]);
    // Load barbershop if linked
    if (b.barbershop_id) {
      base44.entities.Barbershop.get(b.barbershop_id).then(s => { if (s?.status === "active") setShop(s); }).catch(() => {});
    }
    // Handle both response shapes from manageBarberServices
    const rawServices = svcRes.data?.services || svcRes.data || [];
    setServices(Array.isArray(rawServices) ? rawServices : []);
    setReviews(rev.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-3">
        <h2 className="font-heading font-bold text-xl">Barber not found</h2>
        <p className="text-muted-foreground text-sm">This barber may not be available.</p>
        <Link to="/explore"><Button className="mt-2">Browse Barbers</Button></Link>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="relative">
        <div className="h-48 md:h-64 bg-gradient-to-br from-primary/20 to-accent overflow-hidden">
          {barber.profile_photo && (
            <img src={barber.profile_photo} alt="" className="w-full h-full object-cover opacity-30" />
          )}
        </div>
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Link to="/explore">
            <Button variant="secondary" size="icon" className="rounded-full backdrop-blur-sm bg-white/80">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full backdrop-blur-sm bg-white/80"
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-16 relative">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-muted shrink-0 border-4 border-card">
              {barber.profile_photo ? (
                <img src={barber.profile_photo} alt={barber.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-heading font-bold text-muted-foreground/50">
                  {barber.display_name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-bold text-xl md:text-2xl">{barber.display_name}</h1>
                {barber.license_verified && (
                  <Badge className="bg-primary/10 text-primary border-0 gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {barber.neighborhood || barber.city}
                </span>
                {barber.years_experience && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {barber.years_experience}yr exp
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <StarRating rating={barber.rating || 0} size="md" />
                <span className="text-sm font-medium">{barber.rating?.toFixed(1) || "New"}</span>
                <span className="text-xs text-muted-foreground">({barber.total_reviews || 0} reviews)</span>
              </div>
            </div>
          </div>
          {/* Barbershop badge */}
          {shop && (
          <Link to={`/barbershop/${shop.id}`} className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors">
            <Building2 className="w-3.5 h-3.5" />
            {shop.shop_name}
          </Link>
          )}
          {barber.bio && (
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{barber.bio}</p>
          )}
          {barber.specialties?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {barber.specialties.map(s => (
                <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
                  {s}
                </span>
              ))}
            </div>
          )}
          <Button
            size="lg"
            className="w-full mt-5 h-12 rounded-xl shadow-lg shadow-primary/20 font-medium text-base"
            onClick={() => setBookingOpen(true)}
            disabled={services.length === 0}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {services.length === 0 ? "No services available" : "Book Now"}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="portfolio" className="mt-6">
          <TabsList className="w-full bg-secondary rounded-xl h-11">
            <TabsTrigger value="portfolio" className="flex-1 rounded-lg">Portfolio</TabsTrigger>
            <TabsTrigger value="services" className="flex-1 rounded-lg">Services</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 rounded-lg">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-4">
            {barber.portfolio_images?.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {barber.portfolio_images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className="aspect-square rounded-xl overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                  >
                    <img src={img} alt={`Work ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">No portfolio photos yet</p>
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-4 space-y-2">
            {services.map((service) => (
              <div key={service.id} className="flex justify-between items-center p-4 bg-card rounded-xl border border-border">
                <div>
                  <h4 className="font-medium text-sm">{service.service_name}</h4>
                  {service.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                  )}
                  <span className="text-xs text-muted-foreground">{service.duration_minutes} min</span>
                </div>
                <span className="font-heading font-bold text-lg">${service.price}</span>
              </div>
            ))}
            {services.length === 0 && (
              <p className="text-center text-muted-foreground py-12 text-sm">No services listed yet</p>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 space-y-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {reviews.length === 0 && (
              <p className="text-center text-muted-foreground py-12 text-sm">No reviews yet</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="" className="max-w-full max-h-full rounded-lg object-contain" />
        </div>
      )}

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        barber={barber}
        services={services}
      />
    </div>
  );
}