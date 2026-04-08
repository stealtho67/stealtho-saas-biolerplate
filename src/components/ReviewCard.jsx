import StarRating from "./StarRating";
import { format } from "date-fns";

export default function ReviewCard({ review }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {review.client_name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-medium">{review.client_name || "Client"}</p>
            <p className="text-xs text-muted-foreground">
              {review.created_date && format(new Date(review.created_date), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      {review.comment && (
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}