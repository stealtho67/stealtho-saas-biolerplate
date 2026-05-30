import { Link } from "react-router-dom";
import { UserPlus, Share2, Scissors, Zap, Shield, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    num: "01",
    icon: UserPlus,
    title: "Create your free profile",
    body: "Sign up, add your bio, services, and portfolio photos. Your profile is your digital barbershop — it takes less than 10 minutes. No credit card needed.",
    detail: [
      "Upload portfolio photos to show off your work",
      "Set your own services and prices",
      "Choose your availability and location",
    ],
  },
  {
    num: "02",
    icon: Share2,
    title: "Share your booking link",
    body: "Get a unique link you can share anywhere — Instagram bio, WhatsApp, or just text it to clients. When clients book through your link, you keep 100% (no platform commission).",
    detail: [
      "One link to share on any platform",
      "0% commission from clients who use your link",
      "Works on any phone, no app required for clients",
    ],
  },
  {
    num: "03",
    icon: Scissors,
    title: "Get booked + auto-charge no-shows",
    body: "Clients book in seconds, pay online or in person, and you get paid directly to your bank via Stripe. No-shows? We auto-charge them so you stop losing money.",
    detail: [
      "Online card payments via Stripe — paid next business day",
      "Auto-charge no-shows based on your own policy",
      "Automated appointment reminders cut no-shows by ~40%",
    ],
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-14 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary/8 blur-3xl" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5 border border-primary/20">
            <Zap className="w-3.5 h-3.5" />
            Up and running in minutes
          </div>
          <h1 className="font-heading font-black text-4xl md:text-5xl mb-4 tracking-tight">
            How NextCut works
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Three steps from signup to your first online booking.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="px-4 pb-20 max-w-3xl mx-auto space-y-8">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="relative">
              {/* connector line */}
              {i < STEPS.length - 1 && (
                <div className="absolute left-6 top-20 w-0.5 h-12 bg-border hidden md:block" />
              )}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6">
                <div className="flex items-start gap-4 md:block md:w-16 shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-heading font-black text-4xl text-muted-foreground/20 hidden md:block mt-2">
                    {step.num}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-heading font-black text-2xl text-muted-foreground/20 md:hidden">{step.num}</span>
                    <h2 className="font-heading font-bold text-xl">{step.title}</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">{step.body}</p>
                  <ul className="space-y-2">
                    {step.detail.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-sm">
                        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Trust row */}
      <section className="px-4 pb-16 max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Shield, label: "License verified", desc: "Every barber is checked before going live" },
            { icon: Star, label: "Real reviews", desc: "Only verified clients can leave reviews" },
            { icon: Zap, label: "No-show protection", desc: "Auto-charge no-shows with your own policy" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="font-semibold text-xs mb-1">{label}</p>
              <p className="text-muted-foreground text-xs leading-relaxed hidden md:block">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="font-heading font-bold text-2xl mb-3">Ready to take control?</h2>
          <p className="text-muted-foreground text-sm mb-6">Join free. No credit card. No catch.</p>
          <Link to="/apply">
            <Button className="h-12 px-8 rounded-xl shadow-lg shadow-primary/25 text-base">
              Create your free profile <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}