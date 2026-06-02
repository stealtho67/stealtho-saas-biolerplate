import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes — joining NextCut, listing your profile, taking bookings, and accepting payments is free. We don't charge a monthly fee to use the core platform. We earn a small commission (7%) only when we bring you a brand-new client via our marketplace. If a client books through your own referral link, or if they already know you, our commission is 0–4%. We also offer optional paid plans ($29–$99/mo) with analytics and marketing tools — but you'll never need them just to run your booking business.",
  },
  {
    q: "How do no-show charges work?",
    a: "When a client books online with a card, that card is saved securely via Stripe. You set your own no-show policy in your profile (e.g., charge 50% if they don't show or cancel within 24 hours). If a client no-shows, NextCut auto-charges the saved card according to your policy. The charge goes directly to your Stripe account. You're in control of the policy — we just enforce it for you.",
  },
  {
    q: "What does NextCut take?",
    a: "Commission depends on how the client found you: 0% if they booked through your own referral link, 3% if they're a direct client who found you on NextCut, 4% for a repeat client we brought you previously, and 7% for a brand-new client we sourced for you from our marketplace, search, or campaigns. Tips are always 100% yours — we never touch tips. Stripe's standard card processing fee (~2.9% + $0.30) applies to all online payments, which is standard across all payment processors.",
  },
  {
    q: "How is this different from Booksy?",
    a: "Booksy charges $40–100/month just to take appointments, and still doesn't auto-charge no-shows out of the box. NextCut is free to join and includes no-show protection from day one. We earn only when we bring you a new client — if you bring your own clients, we earn nothing. We're also built mobile-first for barbers, not a corporate software platform retrofitted for beauty professionals.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no contracts and no lock-in. If you're on a paid plan, you can cancel at any time from your account settings. You'll keep access until the end of your current billing period — we don't offer partial-month refunds. Your free Starter plan access never expires, so cancelling a paid plan just returns you to Starter.",
  },
  {
    q: "Who owns my client relationships?",
    a: "You do — always. NextCut provides the booking infrastructure, but your clients are yours. We never market to your clients on your behalf without your permission, and we don't share client data with other barbers. If you ever leave NextCut, we'll provide your client list and booking history to export.",
  },
  {
    q: "How do payouts work?",
    a: "We use Stripe Connect for payouts. You connect your bank account through Stripe's secure onboarding (takes about 5 minutes). When a client pays online, NextCut processes the payment and transfers your earnings (service price minus our commission) directly to your bank, typically within 1–2 business days. Stripe's standard processing fee applies to all card payments.",
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        data-no-lift
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-heading font-semibold text-base">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-primary shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <p className="text-sm text-muted-foreground leading-relaxed pb-5">{a}</p>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-14 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[250px] rounded-full bg-primary/8 blur-3xl" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-heading font-black text-4xl md:text-5xl mb-4 tracking-tight">
            Frequently asked<br />
            <span className="text-primary">questions</span>
          </h1>
          <p className="text-muted-foreground text-base">
            Honest answers about how NextCut works and what it costs.
          </p>
        </div>
      </section>

      {/* FAQ list */}
      <section className="px-4 pb-20 max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl px-6 divide-y-0">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm mb-2">Still have questions?</p>
          <a
            href="mailto:support@nextcut.app"
            className="text-primary hover:underline font-medium text-sm"
          >
            support@nextcut.app
          </a>
        </div>
      </section>
    </div>
  );
}