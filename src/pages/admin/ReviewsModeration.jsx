import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ReviewsModeration() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    const all = await base44.entities.Review.list("-created_date", 500);
    setReviews(all);
    setLoading(false);
  };

  const deleteReview = async (id) => {
    await base44.entities.Review.delete(id);
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success("Review removed");
  };

  const filtered = reviews.filter(r =>
    !search ||
    r.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.comment?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const Stars = ({ rating }) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`} />
      ))}
    </div>
  );

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-slate-900">Reviews Moderation</h1>
        <p className="text-sm text-slate-500">{reviews.length} total reviews</p>
      </div>

      <div className="relative max-w-xs mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search reviews..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 bg-white" />
      </div>

      <div className="space-y-3">
        {paginated.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
              {r.client_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-800">{r.client_name || r.client_email}</span>
                  <Stars rating={r.rating} />
                  <span className="text-xs text-slate-400">
                    {r.created_date && format(new Date(r.created_date), "MMM d, yyyy")}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                  onClick={() => deleteReview(r.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              {r.comment && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{r.comment}</p>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">No reviews found</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-slate-500">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

const Loading = () => <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>;