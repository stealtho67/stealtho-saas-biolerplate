import { Link } from "react-router-dom";
import { Scissors, ChevronRight, Users, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-14 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary/8 blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 glow-teal">
            <Scissors className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading font-black text-4xl md:text-5xl mb-6 tracking-tight">
            Built for barbers.<br />
            <span className="text-primary">Not booking companies.</span>
          </h1>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 pb-16 max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 text-center mb-8">
          <p className="text-lg md:text-xl text-foreground leading-relaxed font-medium">
            "NextCut is the free booking app built for barbers, not billion-dollar booking companies. List your chair, take bookings, get paid, and auto-charge the no-shows that cost you real money — all free. Upgrade only when you want the growth tools."
          </p>
          <p className="text-sm text-muted-foreground mt-4">— Built by StealthO</p>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg mb-2">Why we built this</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Existing booking software charges barbers $40–100/month just to take appointments. Then they still lose $50–200/month to no-shows with no recourse. We built NextCut to flip that — free to list, free to take bookings, auto-charge no-shows from day one. We only make money when we actually bring you new clients.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg mb-2">Our honest model</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  The platform is free. We earn a small commission (7%) only when we bring you a brand-new client through our marketplace. Repeat clients are 4%, clients who come via your own referral link are 0%. Tips are always 100% yours, always. Optional paid plans give you analytics, marketing automation, and priority placement — but you'll never need them just to take bookings.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg mb-2">Who we're for</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Independent barbers, suite tenants, shop owners — anyone who's tired of paying monthly software fees and losing money to no-shows. Mobile-first, because most barbers run their business from their phone. Simple enough to set up in 10 minutes. Powerful enough to grow your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="font-heading font-bold text-2xl mb-3">Join the movement</h2>
          <p className="text-muted-foreground text-sm mb-6">Free forever. No credit card. No catch.</p>
          <Link to="/apply">
            <Button className="h-12 px-8 rounded-xl shadow-lg shadow-primary/25 text-base">
              List your chair free <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            Questions? <a href="mailto:support@nextcut.app" className="text-primary hover:underline">support@nextcut.app</a>
          </p>
        </div>
      </section>
    </div>
  );
}