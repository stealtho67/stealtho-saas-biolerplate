import { useState, useEffect } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, MapPin, Star, Loader2, Search, LayoutDashboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format, isPast, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import StarRating from "../components/StarRating";
import EmptyState from "../components/EmptyState";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isBarber, setIsBarber] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    // Show success toast when returning from Stripe Checkout
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast.success("Payment confirmed! Your booking is all set.");
      window.history.replaceState({}, "", "/my-bookings");
    }
  }, []);

  const loadData = async () => {
    const me = await base44.auth.me();
    if (!me) {
      setLoading(false);
      return;
    }
    setUser(me);

    // Check for barber record — more reliable than role field which can lag
    const barbers = await base44.entities.Barber.filter({ user_email: me.email });
    const hasBarberRecord = barbers.length > 0;
    setIsBarber(hasBarberRecord);

    let allBookings;
    if (hasBarberRecord) {
      allBookings = await base44.entities.Booking.filter({ barber_id: barbers[0].id });
    } else {
      allBookings = await base44.entities.Booking.filter({ client_email: me.email });
    }
    setBookings(allBookings.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setLoading(false);
  };

  const updateStatus = async (bookingId, status) => {
    await base44.entities.Booking.update(bookingId, { status });
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    // Update barber total_bookings count when completing a booking
    if (status === "completed") {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking?.barber_id) {
        const barbers = await base44.entities.Barber.filter({ id: booking.barber_id });
        if (barbers.length > 0) {
          await base44.entities.Barber.update(booking.barber_id, {
            total_bookings: (barbers[0].total_bookings || 0) + 1,
          });
        }
      }
    }
  };

  const markPaid = async (booking) => {
    const updates = {
      payment_status: "paid",
      payment_method: "in_person",
      paid_at: new Date().toISOString(),
    };
    await base44.entities.Booking.update(booking.id, updates);
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, ...updates } : b));
  };

  const submitReview = async () => {
    setSubmitting(true);
    // Prevent duplicate reviews for the same booking
    const existing = await base44.entities.Review.filter({ booking_id: reviewModal.id, client_email: user.email });
    if (existing.length > 0) {
      setReviewModal(null);
      setSubmitting(false);
      return;
    }
    await base44.entities.Review.create({
      client_email: user.email,
      client_name: user.full_name,
      barber_id: reviewModal.barber_id,
      booking_id: reviewModal.id,
      rating: reviewRating,
      comment: reviewComment,
    });
    // Update barber rating
    const reviews = await base44.entities.Review.filter({ barber_id: reviewModal.barber_id });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await base44.entities.Barber.update(reviewModal.barber_id, {
      rating: Math.round(avgRating * 10) / 10,
      total_reviews: reviews.length,
    });
    setSubmitting(false);
    setReviewModal(null);
    setReviewRating(5);
    setReviewComment("");
  };

  const safeIsPast = (b) => { try { return isPast(parseISO(b.date + "T" + (b.time || "00:00"))); } catch { return false; } };
  const upcoming = bookings.filter(b => b.status === "confirmed" && !safeIsPast(b));
  const past = bookings.filter(b => b.status === "completed" || (b.status === "confirmed" && safeIsPast(b)));
  const cancelled = bookings.filter(b => b.status === "cancelled");

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <Calendar className="w-12 h-12 text-muted-foreground/30" />
        <h2 className="font-heading font-bold text-xl">Sign in to view your bookings</h2>
        <Button onClick={() => base44.auth.redirectToLogin(window.location.href)}>Sign In</Button>
      </div>
    );
  }

  const statusColors = {
    confirmed: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
  };

  const BookingCard = ({ booking }) => (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-sm">{booking.service_name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isBarber ? booking.client_name : booking.barber_name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={`${statusColors[booking.status]} border-0 text-xs`}>
            {booking.status}
          </Badge>
          <Badge className={`border-0 text-xs ${booking.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {booking.payment_status === "paid" ? "Paid" : "Unpaid"}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {format(parseISO(booking.date), "MMM d, yyyy")}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {booking.time}
        </span>
        <span className="font-heading font-semibold text-foreground">${booking.service_price || booking.price}</span>
        {isBarber && booking.barber_earnings != null && (
          <span className="text-emerald-600 font-medium">Your cut: ${booking.barber_earnings}</span>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        {isBarber && booking.status === "confirmed" && (
          <Button size="sm" variant="default" className="h-8 text-xs rounded-lg" onClick={() => updateStatus(booking.id, "completed")}>
            Mark Complete
          </Button>
        )}
        {isBarber && booking.status === "completed" && booking.payment_status !== "paid" && (
          <Button size="sm" className="h-8 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => markPaid(booking)}>
            Mark Paid
          </Button>
        )}
        {/* Only the booking owner (client) or barber can cancel, and only upcoming bookings */}
        {booking.status === "confirmed" && !isPast(parseISO(booking.date + "T" + (booking.time || "00:00"))) && (
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg text-destructive" onClick={() => updateStatus(booking.id, "cancelled")}>
            Cancel
          </Button>
        )}
        {!isBarber && booking.status === "completed" && (
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => setReviewModal(booking)}>
            <Star className="w-3 h-3 mr-1" /> Leave Review
          </Button>
        )}
        {!isBarber && (
          <Link to={`/barber/${booking.barber_id}`}>
            <Button size="sm" variant="ghost" className="h-8 text-xs rounded-lg">View Barber</Button>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">
          {isBarber ? "My Appointments" : "My Bookings"}
        </h1>
        {isBarber && (
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="w-full bg-secondary rounded-xl h-11">
          <TabsTrigger value="upcoming" className="flex-1 rounded-lg">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 rounded-lg">
            Past ({past.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1 rounded-lg">
            Cancelled ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <div className="space-y-4">
              <EmptyState icon={Calendar} title="No upcoming bookings" description={isBarber ? "New appointments will appear here" : "Browse barbers to book your next cut"} />
              {!isBarber && (
                <div className="text-center">
                  <Link to="/explore">
                    <Button className="gap-2"><Search className="w-4 h-4" /> Find a Barber</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            upcoming.map(b => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          {past.length === 0 ? (
            <EmptyState icon={Clock} title="No past bookings" />
          ) : (
            past.map(b => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4 space-y-3">
          {cancelled.length === 0 ? (
            <EmptyState icon={Calendar} title="No cancelled bookings" />
          ) : (
            cancelled.map(b => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      <Dialog open={!!reviewModal} onOpenChange={() => setReviewModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Leave a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex justify-center">
              <StarRating rating={reviewRating} size="lg" interactive onChange={setReviewRating} />
            </div>
            <Textarea
              placeholder="Share your experience... (optional)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
            />
            <Button onClick={submitReview} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}