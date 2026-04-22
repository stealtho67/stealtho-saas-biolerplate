import { CheckCircle2, AlertCircle, Clock, ShieldCheck, DollarSign, Zap, BookOpen, Star, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// Content is structured as sections — easy to update later
// ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: "welcome",
    icon: Zap,
    iconColor: "text-primary bg-primary/10",
    title: "Welcome to NextCut",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>NextCut is a platform that helps licensed barbers get discovered, booked, and paid. As a barber on NextCut, you can build your clientele, manage your bookings, and grow repeat business — all from one dashboard.</p>
        <p>Only approved barbers appear publicly on the marketplace. Keeping your profile complete, your services accurate, and your portfolio updated is the best way to increase bookings and stand out.</p>
        <p>This guide covers everything you need to know about how NextCut works, what's expected of you, and how to succeed on the platform.</p>
      </div>
    ),
  },
  {
    id: "how-it-works",
    icon: BookOpen,
    iconColor: "text-blue-600 bg-blue-100",
    title: "How NextCut Works",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>Clients browse the NextCut marketplace and discover approved barbers based on location, services, portfolio, rating, and availability.</p>
        <p>When a client finds a barber they like, they can view services and pricing, see portfolio photos, and book directly through NextCut. The booking immediately appears in your barber dashboard.</p>
        <ul className="space-y-2 ml-1">
          {[
            "Clients browse and discover you through the marketplace, search, or featured listings",
            "They view your services, prices, portfolio, and availability",
            "They book directly through NextCut — no back-and-forth needed",
            "Bookings appear in your dashboard and My Bookings page",
            "The platform tracks your bookings, revenue, and payout readiness",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "approval",
    icon: ShieldCheck,
    iconColor: "text-emerald-600 bg-emerald-100",
    title: "How Barber Approval Works",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>To appear publicly on NextCut, you must complete your profile and go through an admin approval process. Here's how it works:</p>
        <ol className="space-y-2 ml-1 list-none">
          {[
            "Complete your profile — bio, photo, city, specialties, years of experience",
            "Add your services and pricing",
            "Upload your barber license or verification document",
            "Your application is reviewed by the NextCut admin team",
            "Once approved, you go live on the marketplace",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <p className="font-medium text-foreground pt-1">Account Statuses</p>
        <div className="space-y-2">
          {[
            { label: "Draft", color: "bg-slate-100 text-slate-600", desc: "Profile created but not submitted" },
            { label: "Pending Review", color: "bg-amber-100 text-amber-700", desc: "Application submitted and awaiting admin review" },
            { label: "Approved / Active", color: "bg-emerald-100 text-emerald-700", desc: "Approved and visible on the marketplace" },
            { label: "Suspended", color: "bg-red-100 text-red-700", desc: "Account suspended — contact support to resolve" },
          ].map(({ label, color, desc }) => (
            <div key={label} className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${color}`}>{label}</span>
              <span className="text-xs">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "checklist",
    icon: CheckCircle2,
    iconColor: "text-purple-600 bg-purple-100",
    title: "What You Need to Complete",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="leading-relaxed">Before you're fully live on the platform, work through this checklist:</p>
        <div className="grid gap-2 mt-3">
          {[
            "Create your account",
            "Complete your profile (bio, photo, city, experience)",
            "Add services and pricing",
            "Upload portfolio photos",
            "Upload your barber license",
            "Submit your application for admin review",
            "Connect Stripe for payouts",
            "Complete Stripe onboarding (identity + banking)",
            "Receive admin approval",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "pricing",
    icon: DollarSign,
    iconColor: "text-amber-600 bg-amber-100",
    title: "Pricing Guidance",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>You set your own prices inside NextCut. Pricing is one of the most important decisions you'll make as a barber on the platform — and it's worth thinking through carefully.</p>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="font-semibold text-amber-800 text-sm mb-1">Important: Platform fee applies to service price</p>
          <p className="text-amber-700 text-xs leading-relaxed">If you want to take home around $40 on a first-time NextCut booking, you may need to price your service higher than $40, because the platform fee is calculated on the service price. See the Commission section below for exact numbers.</p>
        </div>

        <p className="font-medium text-foreground">Common services to list:</p>
        <ul className="space-y-1 ml-1">
          {[
            "Haircut only",
            "Haircut + beard combo",
            "Beard trim only",
            "Kids cut",
            "Lineup / edge-up / cleanup",
            "Specialty or textured cut",
            "Add-ons (e.g. hot towel, scalp treatment)",
            "Travel / mobile service fee (if applicable)",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="font-medium text-foreground">How to think about your prices:</p>
        <ul className="space-y-1 ml-1">
          {[
            "How long does the service take?",
            "What do you want to take home after the platform fee?",
            "What's competitive in your city or neighborhood?",
            "Are you a mobile barber or shop-based?",
            "What does your portfolio and experience justify?",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="p-4 bg-secondary rounded-xl space-y-1">
          <p className="font-medium text-foreground text-xs">Pricing rules of thumb</p>
          <p className="text-xs">Don't underprice just to get bookings — it can attract the wrong expectations and hurt your perceived value.</p>
          <p className="text-xs">Review your prices regularly. As your rating and reviews grow, you can raise prices to match your demand.</p>
          <p className="text-xs">Keep service descriptions accurate. Clients should know exactly what they're getting.</p>
        </div>
      </div>
    ),
  },
  {
    id: "commission",
    icon: DollarSign,
    iconColor: "text-emerald-600 bg-emerald-100",
    title: "Commission / Platform Fee",
    content: (
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>NextCut charges a commission on each completed, paid booking. The rate depends on how the client found you:</p>

        <div className="space-y-2">
          {[
            { rate: "20%", label: "New NextCut Client", color: "bg-purple-100 text-purple-700 border-purple-200", desc: "Client discovered you through the NextCut marketplace, search, or platform promotion" },
            { rate: "15%", label: "Repeat Client", color: "bg-blue-100 text-blue-700 border-blue-200", desc: "Same client books you again through NextCut" },
            { rate: "10%", label: "Barber-Direct Client", color: "bg-emerald-100 text-emerald-700 border-emerald-200", desc: "Client came via your direct booking link or referral" },
          ].map(({ rate, label, color, desc }) => (
            <div key={rate} className={`p-4 rounded-xl border ${color.replace("text-", "border-").split(" ")[0]} bg-opacity-50`} style={{}}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${color}`}>{rate} fee</span>
                <span className="font-semibold text-foreground text-xs">{label}</span>
              </div>
              <p className="text-xs">{desc}</p>
            </div>
          ))}
        </div>

        <div className="p-4 bg-secondary rounded-xl">
          <p className="font-semibold text-foreground text-sm mb-3">Example — $50 service price:</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>20% (new client) → platform fee</span><span className="font-semibold">$10 fee · <span className="text-emerald-600">$40 to you</span></span></div>
            <div className="flex justify-between"><span>15% (repeat client) → platform fee</span><span className="font-semibold">$7.50 fee · <span className="text-emerald-600">$42.50 to you</span></span></div>
            <div className="flex justify-between"><span>10% (direct client) → platform fee</span><span className="font-semibold">$5 fee · <span className="text-emerald-600">$45 to you</span></span></div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="font-semibold text-emerald-800 text-sm mb-1">Tips are 100% yours</p>
          <p className="text-emerald-700 text-xs">Tips are never included in commission calculations. A $10 tip on a $50 service means you keep the full $10, on top of your service earnings.</p>
        </div>

        <ul className="space-y-1 ml-1 text-xs">
          {[
            "Commission applies to service price only — not tips",
            "Cancelled and no-show bookings do not generate commission",
            "Only completed, paid bookings count toward revenue tracking",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "bookings",
    icon: Clock,
    iconColor: "text-blue-600 bg-blue-100",
    title: "Bookings and Client Flow",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>Once you're approved, clients can discover and book you directly. All bookings appear in your dashboard and in My Bookings.</p>
        <p>Keep your availability accurate — clients book based on what's open, and unavailable times should be blocked. False availability creates a poor client experience and can hurt your rating.</p>
        <p className="font-medium text-foreground">What good barber behavior looks like on the platform:</p>
        <ul className="space-y-1 ml-1">
          {[
            "Show up on time — clients scheduled around your availability",
            "Honor the listed service at the listed price",
            "Keep pricing and service descriptions accurate at all times",
            "Maintain a strong, current portfolio",
            "Update availability when your schedule changes",
            "Be professional in all client interactions",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "stripe",
    icon: ShieldCheck,
    iconColor: "text-indigo-600 bg-indigo-100",
    title: "Stripe / Payments / Payouts",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>NextCut uses Stripe to verify your identity and deposit your earnings directly into your bank account. Connecting Stripe is required to become fully payout-ready on the platform.</p>
        <p>To connect Stripe, go to the <strong className="text-foreground">Payouts tab</strong> in your dashboard and click "Connect Stripe." You'll be taken to Stripe's secure hosted onboarding form where you'll enter your identity and banking details.</p>
        <p className="font-medium text-foreground">Stripe statuses you may see:</p>
        <div className="space-y-2">
          {[
            { label: "Not Connected", color: "bg-slate-100 text-slate-600", desc: "You haven't started Stripe setup yet" },
            { label: "Onboarding In Progress", color: "bg-amber-100 text-amber-700", desc: "You've started but haven't finished Stripe's form" },
            { label: "Verification Needed", color: "bg-red-100 text-red-700", desc: "Stripe needs more information from you before payouts can be enabled" },
            { label: "Payouts Enabled", color: "bg-emerald-100 text-emerald-700", desc: "Fully verified — earnings are deposited directly to your bank" },
          ].map(({ label, color, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5 ${color}`}>{label}</span>
              <span className="text-xs">{desc}</span>
            </div>
          ))}
        </div>
        <div className="p-3 bg-secondary rounded-xl text-xs">
          <strong className="text-foreground">Note:</strong> Even if your barber profile is complete and you're approved, payouts are not considered ready until Stripe onboarding is finished. Your dashboard always shows your current payout status.
        </div>
      </div>
    ),
  },
  {
    id: "profile-tips",
    icon: Star,
    iconColor: "text-amber-600 bg-amber-100",
    title: "Profile Expectations",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>Your profile is the first thing clients see. A strong profile builds trust and gets more bookings. A low-effort profile performs worse — plain and simple.</p>
        <p className="font-medium text-foreground">A strong barber profile includes:</p>
        <ul className="space-y-1 ml-1">
          {[
            "A clear, professional profile photo",
            "A strong, honest bio that explains your background and style",
            "Specialties listed clearly (e.g. fades, textured cuts, beard work)",
            "Accurate years of experience",
            "A complete service list with accurate pricing",
            "At least 3-5 portfolio photos showing your real work",
            "Correct location and service area",
            "Updated availability",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "portfolio-tips",
    icon: Star,
    iconColor: "text-purple-600 bg-purple-100",
    title: "Portfolio Expectations",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>Your portfolio is your visual resume. Clients make booking decisions based on what they see. Upload real work only — never use images that aren't yours.</p>
        <ul className="space-y-1 ml-1">
          {[
            "Use high-quality, well-lit photos — natural light works great",
            "Show variety — different styles, textures, and cut types",
            "Lead with your strongest and most recent work",
            "Keep the portfolio current — remove old or weak photos",
            "Avoid blurry, dark, or low-resolution images",
            "Aim for at least 5-10 photos to make a strong impression",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "availability",
    icon: Clock,
    iconColor: "text-slate-600 bg-slate-100",
    title: "Availability Expectations",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>You are responsible for keeping your availability accurate. Clients book based on what's shown as open.</p>
        <ul className="space-y-1 ml-1">
          {[
            "Block dates and times when you're not available",
            "Update availability when your schedule changes",
            "False availability leads to bad client experiences and potential negative reviews",
            "Reliable, consistent scheduling builds trust and drives repeat bookings",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "success",
    icon: Zap,
    iconColor: "text-emerald-600 bg-emerald-100",
    title: "Barber Success Tips",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>Barbers who do well on NextCut share common habits. Here's what separates top performers:</p>
        <ul className="space-y-2 ml-1">
          {[
            "Complete every section of your profile — don't leave anything blank",
            "Upload strong, diverse portfolio photos before going live",
            "Set fair, thoughtful pricing from day one — don't race to the bottom",
            "Keep availability updated so clients always see accurate open slots",
            "Convert first-time clients into repeat clients through quality and professionalism",
            "Share your direct booking link with your existing client base (lower 10% fee)",
            "Maintain professionalism in every interaction — your reputation is your business",
            "Increase your prices as your rating and reviews grow",
            "Respond to bookings promptly and honor every appointment",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "rules",
    icon: AlertCircle,
    iconColor: "text-red-600 bg-red-100",
    title: "Rules & Standards",
    content: (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>All barbers on NextCut are expected to operate professionally and honestly. The following standards apply to all barbers on the platform:</p>
        <ul className="space-y-1 ml-1">
          {[
            "Be licensed if required in your city or state",
            "Provide accurate and honest profile information",
            "Keep your profile, services, and pricing up to date",
            "Act professionally with all clients",
            "Honor every booked appointment at the listed service and price",
            "Do not mislead clients about what's included in a service",
            "Follow all NextCut platform requirements",
            "Understand that public visibility and approval depend on compliance and admin review",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs">Violations of these standards may result in suspension or removal from the platform.</p>
      </div>
    ),
  },
];

const FAQ_ITEMS = [
  {
    q: "Why am I not visible publicly yet?",
    a: "Your profile must be approved by the NextCut admin team before you appear on the marketplace. Make sure your profile is complete, your services are added, and your license is uploaded. Admin will review and approve you.",
  },
  {
    q: "Why can't I receive payouts yet?",
    a: "Payouts require a completed Stripe onboarding. Go to the Payouts tab and connect your Stripe account. Once Stripe verifies your identity and banking information, payouts will be enabled.",
  },
  {
    q: "How do I know if I'm approved?",
    a: "Your dashboard status header will show 'Approved & Active' when you're live. If it shows 'Pending Approval', your application is still under review.",
  },
  {
    q: "How should I choose my prices?",
    a: "Think about how long the service takes, what you want to take home after the platform fee, and what's competitive in your area. Don't underprice — it can work against you. Review prices regularly as your demand grows.",
  },
  {
    q: "Do I keep my tips?",
    a: "Yes — 100%. Tips are never included in platform commission calculations. Every dollar a client tips goes directly to you.",
  },
  {
    q: "How does the platform fee work?",
    a: "The platform fee is a percentage of your service price — 20% for new NextCut clients, 15% for repeat clients, and 10% for clients you bring through your direct link. Tips are excluded from this calculation.",
  },
  {
    q: "What happens if I haven't finished Stripe setup?",
    a: "You can still take in-person payments for bookings. However, your payout status will show as incomplete, and online payment collection through NextCut won't be available until Stripe onboarding is done.",
  },
  {
    q: "How do I improve my chances of getting booked?",
    a: "Complete your profile fully, upload strong portfolio photos, set clear service descriptions and fair prices, keep availability accurate, and collect good reviews from your first clients. Barbers with complete profiles and strong portfolios get significantly more bookings.",
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-secondary transition-colors"
      >
        <span className="text-sm font-medium text-foreground pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3 bg-secondary/30">
          {a}
        </div>
      )}
    </div>
  );
}

function Section({ section }) {
  const Icon = section.icon;
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${section.iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-heading font-bold text-base">{section.title}</h2>
      </div>
      <div className="px-5 py-4">
        {section.content}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Status summary card shown at top if barber data is available
// ─────────────────────────────────────────────────────────────
function BarberStatusSummary({ barber }) {
  if (!barber) return null;

  const items = [
    {
      label: "Application",
      value: barber.status === "active" ? "Approved" : barber.status === "pending" ? "Pending Review" : barber.status || "Draft",
      color: barber.status === "active" ? "text-emerald-600" : "text-amber-600",
    },
    {
      label: "Payouts",
      value: barber.payouts_enabled ? "Enabled" : barber.stripe_status === "not_connected" ? "Not Connected" : "Setup Needed",
      color: barber.payouts_enabled ? "text-emerald-600" : "text-amber-600",
    },
    {
      label: "Profile",
      value: (barber.bio && barber.profile_photo && barber.display_name) ? "Complete" : "Incomplete",
      color: (barber.bio && barber.profile_photo && barber.display_name) ? "text-emerald-600" : "text-amber-600",
    },
  ];

  const nextAction = !barber.bio || !barber.profile_photo
    ? "Complete your profile to improve your chances of approval."
    : barber.status !== "active"
    ? "Your application is under review. Hang tight!"
    : !barber.payouts_enabled
    ? "Connect Stripe in the Payouts tab to enable online payments."
    : "You're fully live. Keep your availability and portfolio updated!";

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
      <h3 className="font-heading font-bold text-sm">Your Current Status</h3>
      <div className="grid grid-cols-3 gap-3">
        {items.map(({ label, value, color }) => (
          <div key={label} className="p-3 bg-secondary rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className={`text-xs font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/10 rounded-xl">
        <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-foreground leading-relaxed">{nextAction}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────
export default function BarberInfoTab({ barber }) {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h2 className="font-heading font-bold text-xl">Barber Guide</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Everything you need to know about how NextCut works and how to succeed.</p>
      </div>

      {/* Personalized status summary */}
      <BarberStatusSummary barber={barber} />

      {/* All sections */}
      {SECTIONS.map(section => (
        <Section key={section.id} section={section} />
      ))}

      {/* FAQ */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h2 className="font-heading font-bold text-base">Frequently Asked Questions</h2>
        </div>
        <div className="p-5 space-y-2">
          {FAQ_ITEMS.map(item => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}