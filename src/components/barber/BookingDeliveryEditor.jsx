import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Globe, Webhook, CheckCircle2, Bell, ChevronRight } from "lucide-react";

const METHODS = [
  {
    id: "nextcut_only",
    label: "NextCut only",
    description: "Bookings stay inside NextCut. No extra forwarding.",
    icon: CheckCircle2,
  },
  {
    id: "email",
    label: "Send to my email",
    description: "Receive a notification email for every new booking.",
    icon: Mail,
  },
  {
    id: "webhook",
    label: "Post to a URL / webhook",
    description: "Send booking data as JSON to any URL — connect your CRM, Zapier, or intake system.",
    icon: Webhook,
  },
  {
    id: "website",
    label: "My website / booking page",
    description: "Store your external booking page URL for reference. NextCut handles the actual booking.",
    icon: Globe,
  },
];

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidUrl(v) {
  try { return v.startsWith("http"); } catch { return false; }
}

export default function BookingDeliveryEditor({ barber, onSaved }) {
  const [method, setMethod] = useState(barber.booking_delivery_method || "nextcut_only");
  const [email, setEmail] = useState(barber.booking_delivery_email || "");
  const [webhookUrl, setWebhookUrl] = useState(barber.booking_delivery_webhook_url || "");
  const [websiteUrl, setWebsiteUrl] = useState(barber.booking_delivery_website_url || "");
  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (method === "email") {
      if (!email.trim()) { toast.error("Please enter a delivery email address."); return false; }
      if (!isValidEmail(email.trim())) { toast.error("Please enter a valid email address."); return false; }
    }
    if (method === "webhook") {
      if (!webhookUrl.trim()) { toast.error("Please enter a webhook URL."); return false; }
      if (!isValidUrl(webhookUrl.trim())) { toast.error("Please enter a valid URL starting with http:// or https://"); return false; }
    }
    if (method === "website") {
      if (!websiteUrl.trim()) { toast.error("Please enter your website or booking page URL."); return false; }
      if (!isValidUrl(websiteUrl.trim())) { toast.error("Please enter a valid URL starting with http:// or https://"); return false; }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const updates = {
      booking_delivery_method: method,
      booking_delivery_email: method === "email" ? email.trim() : (barber.booking_delivery_email || ""),
      booking_delivery_webhook_url: method === "webhook" ? webhookUrl.trim() : (barber.booking_delivery_webhook_url || ""),
      booking_delivery_website_url: method === "website" ? websiteUrl.trim() : (barber.booking_delivery_website_url || ""),
    };
    await base44.entities.Barber.update(barber.id, updates);
    onSaved?.({ ...barber, ...updates });
    toast.success("Booking delivery preferences saved.");
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Method selector */}
      <div className="space-y-2">
        {METHODS.map((m) => {
          const Icon = m.icon;
          const isSelected = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border transition-all ${
                isSelected ? "border-primary bg-accent" : "border-border hover:border-primary/30"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-primary/10" : "bg-secondary"}`}>
                <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground"}`}>{m.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{m.description}</p>
              </div>
              {isSelected && <ChevronRight className="w-4 h-4 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Conditional input fields */}
      {method === "email" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Notification email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">We'll send a booking summary here every time a client books you.</p>
        </div>
      )}

      {method === "webhook" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Webhook / intake URL</label>
          <Input
            type="url"
            placeholder="https://hooks.zapier.com/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            NextCut will POST booking details as JSON to this URL on every new booking.
            Works with Zapier, Make, n8n, or any custom endpoint.
          </p>
        </div>
      )}

      {method === "website" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Your website or booking page URL</label>
          <Input
            type="url"
            placeholder="https://yourbarbershop.com/book"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This is stored for your records. Clients still book through NextCut — this URL is not used to redirect them.
          </p>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save Preferences"}
      </Button>
    </div>
  );
}