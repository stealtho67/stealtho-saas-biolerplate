import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

const QUICK_REASONS = [
  "Complete your profile — add a bio and profile photo",
  "Add at least one service with accurate pricing",
  "Upload your barber license or verification document",
  "Connect Stripe to enable payouts",
  "Upload portfolio photos (minimum 3–5 recommended)",
  "Finish your availability setup",
  "Additional information required — contact support",
];

export default function SendBackModal({ barber, open, onClose, onConfirm, loading }) {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    if (!note.trim()) return;
    onConfirm(note.trim());
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <DialogTitle>Send Back — Action Required</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            This will set <strong>{barber?.display_name}</strong>'s status to <strong>Action Required</strong> and remove them from public visibility. They will see your note in their dashboard.
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Reasons</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map(reason => (
              <button
                key={reason}
                onClick={() => setNote(reason)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors text-left ${
                  note === reason
                    ? "bg-amber-100 border-amber-300 text-amber-800"
                    : "bg-secondary border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Admin Note <span className="text-destructive">*</span>
            </p>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Explain what the barber needs to complete before being approved..."
              className="min-h-[80px] text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">This note is shown directly to the barber in their dashboard.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={!note.trim() || loading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? "Sending..." : "Send Back"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}