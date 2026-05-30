import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Scissors, Zap, Star, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    period: "forever",
    icon: Scissors,
    iconColor: "text-teal-400",
    iconBg: "bg-teal-400/10",
    highlight: false,
    badge: null,
    cta: "Get started — free",
    ctaVariant: "outline",
    href: "/apply",
    isInternal: true,
    features: [
      "Marketplace listing + public booking page",
      "Full profile, portfolio & review display",
      "In-app card payments — barber keeps full ticket",
      "Auto-charge no-shows (barber sets the policy)",
      "0% commission on your own referred clients",
      "Client list & booking history in NextCut",
    ],
    footnote: "NextCut earns only when we bring you a new client (7%). Tips are always 100% yours.",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$29",
    period: "/mo",
    icon: Zap,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    highlight: false,
    badge: null,
    cta: "Subscribe",
    ctaVariant: "outline",
    href: "#",
    isInternal: false,
    features: [
      "Everything in Starter",
      "Analytics dashboard — revenue, trends, peak hours",
      "Automatic review request messages after each visit",
      "Full client history & visit frequency",
      "No-show pattern detection & alerts",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$59",
    period: "/mo",
    icon: Star,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-400/10",
    highlight: false,
    badge: null,
    cta: "Subscribe",
    ctaVariant: "outline",
    href: "#",
    isInternal: false,
    features: [
      "Everything in Growth",
      "Marketing automation (rebooking nudges, win-backs)",
      "AI strategy recommendations & booking insights",
      "Advanced metrics — LTV, retention, churn",
      "Custom branding on your booking page",
    ],
  },
  {
    id: "spotlight",
    name: "Spotlight",
    price: "$99",
    period: "/mo",
    icon: Crown,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10",
    highlight: true,
    badge: "Most popular",
    cta: "Subscribe",
    ctaVariant: "default",
    href: "#",
    isInternal: false,
    limit: "Limited to 10 barbers per city",
    features: [
      "Everything in Pro",
      "Priority placement at top of marketplace",
      "Featured badge on search results",
      "Concierge onboarding & ongoing support",
      "Early access to all new features",
    ],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-14 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary/8 blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            Honest pricing
          </div>
          <h1 className="font-heading font-black text-4xl md:text-5xl mb-4 tracking-tight">
            Free forever.<br />
            <span className="text-primary">Upgrade when you're ready.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-3 max-w-xl mx-auto">
            Booksy charges ~$40/mo and still won't auto-charge no-shows. We do both — free.
          </p>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            The core is free. We only earn a small commission when <em>we</em> bring you a new client. Your own clients? 0%.
          </p>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="px-4 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.highlight
                    ? "bg-primary/5 border-primary/40 ring-1 ring-primary/30"
                    : "bg-card border-border"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="mb-5">
                  <div className={`w-10 h-10 rounded-xl ${plan.iconBg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-heading font-black text-3xl">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                    )}
                  </div>
                  {plan.limit && (
                    <p className="text-xs text-amber-400 mt-1 font-medium">{plan.limit}</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.footnote && (
                  <p className="text-xs text-muted-foreground/70 mb-4 leading-relaxed border-t border-border pt-3">
                    {plan.footnote}
                  </p>
                )}

                {/* CTA */}
                {plan.isInternal ? (
                  <Link to={plan.href}>
                    <Button variant={plan.ctaVariant} className="w-full">
                      {plan.cta} <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <a href={plan.href} target="_blank" rel="noopener noreferrer">
                    <Button variant={plan.ctaVariant} className={`w-full ${plan.highlight ? "shadow-lg shadow-primary/25" : ""}`}>
                      {plan.cta}
                    </Button>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Commission clarity */}
      <section className="px-4 pb-20 max-w-2xl mx-auto text-center">
        <h2 className="font-heading font-bold text-xl mb-4">How does our commission work?</h2>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 text-left">
          {[
            { label: "Your referral / booking link", rate: "0%", desc: "Your own clients booked through your link — you keep 100% of every ticket." },
            { label: "Barber-direct client", rate: "3%", desc: "Clients already in your network who find you on NextCut." },
            { label: "Repeat NextCut client", rate: "4%", desc: "A client who found you via NextCut and comes back for another booking." },
            { label: "New NextCut lead", rate: "7%", desc: "A brand-new client we brought you from our marketplace or campaigns." },
          ].map(({ label, rate, desc }) => (
            <div key={label} className="flex items-start gap-4">
              <span className="font-heading font-black text-xl text-primary w-12 shrink-0">{rate}</span>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground border-t border-border pt-4">
            Tips are <strong>always 100% yours</strong> and never included in commission calculations.
          </p>
        </div>
      </section>
    </div>
  );
}