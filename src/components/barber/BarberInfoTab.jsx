import {
  CheckCircle2, AlertCircle, Clock, ShieldCheck, DollarSign,
  Zap, BookOpen, Star, HelpCircle, ChevronDown, ChevronUp,
  Scissors, Camera, Calendar, TrendingUp, Award, UserCheck
} from "lucide-react";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// SECTION CONTENT — edit this object to update the guide
// ─────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "welcome",
    icon: Zap,
    iconColor: "text-primary bg-primary/10",
    title: "Welcome to NextCut",
    content: [
      {
        type: "p",
        text: "NextCut is a platform built for licensed barbers who want to get discovered, booked, and paid — without the hassle of managing everything themselves. Whether you're an independent barber, a shop owner, or a mobile barber, NextCut gives you a professional presence online and connects you directly with clients in your area.",
      },
      {
        type: "p",
        text: "This guide is your built-in handbook. It covers everything from how approval works, to how to price your services, to how commissions and payouts are handled. Read through it when you're getting started, and come back whenever you have questions.",
      },
      {
        type: "highlight",
        color: "primary",
        items: [
          "Only approved barbers appear publicly on the marketplace",
          "Keeping your profile, services, and portfolio updated helps increase bookings",
          "Your dashboard tracks bookings, earnings, and payout readiness in one place",
        ],
      },
    ],
  },
  {
    id: "how-it-works",
    icon: BookOpen,
    iconColor: "text-blue-600 bg-blue-100",
    title: "How NextCut Works",
    content: [
      {
        type: "p",
        text: "NextCut works as a two-sided marketplace. Clients discover and book barbers. Barbers manage their profiles, services, and bookings from a central dashboard.",
      },
      {
        type: "numbered",
        items: [
          "Clients browse the marketplace and discover approved barbers based on location, services, portfolio, ratings, and availability.",
          "Clients view your profile — including your services, prices, portfolio photos, and open time slots.",
          "Clients book directly through NextCut. No back-and-forth messages needed.",
          "The booking instantly appears in your dashboard and My Bookings page.",
          "The platform tracks your bookings, revenue, and payout readiness automatically.",
        ],
      },
      {
        type: "p",
        text: "The cleaner and more complete your profile is, the better you perform in discovery. Barbers with photos, strong bios, clear services, and good portfolios consistently book more than those with incomplete profiles.",
      },
    ],
  },
  {
    id: "approval",
    icon: ShieldCheck,
    iconColor: "text-emerald-600 bg-emerald-100",
    title: "How Barber Approval Works",
    content: [
      {
        type: "p",
        text: "Every barber on NextCut goes through an admin approval process before appearing publicly on the marketplace. This keeps the platform high-quality for clients and protects the reputation of barbers who do things the right way.",
      },
      {
        type: "numbered",
        items: [
          "Complete your profile — bio, photo, city, specialties, and years of experience",
          "Add your services and pricing to the Services tab",
          "Upload your barber license or verification document in your profile",
          "Submit your application (this happens automatically once your profile is complete)",
          "Admin reviews your application and approves or requests changes",
          "Once approved, you go live on the marketplace and clients can discover and book you",
        ],
      },
      {
        type: "subheading",
        text: "Account Statuses Explained",
      },
      {
        type: "badges",
        items: [
          { label: "Draft", color: "bg-slate-100 text-slate-600", desc: "Your profile was created but hasn't been submitted or fully completed yet." },
          { label: "Pending Review", color: "bg-amber-100 text-amber-700", desc: "Your application has been submitted and is awaiting review by the NextCut admin team." },
          { label: "Approved / Active", color: "bg-emerald-100 text-emerald-700", desc: "You've been approved and are visible on the marketplace. Clients can book you." },
          { label: "Suspended", color: "bg-red-100 text-red-700", desc: "Your account has been suspended. Contact support to understand why and what steps are needed." },
        ],
      },
      {
        type: "note",
        text: "If your application is taking longer than expected, make sure your profile is fully complete — including your license upload. Incomplete profiles are not eligible for approval.",
      },
    ],
  },
  {
    id: "checklist",
    icon: CheckCircle2,
    iconColor: "text-purple-600 bg-purple-100",
    title: "What You Need to Complete",
    content: [
      {
        type: "p",
        text: "Before you're fully live and payout-ready on NextCut, you need to complete every step below. Skipping steps will limit your visibility, your ability to take bookings, or your ability to receive payouts.",
      },
      {
        type: "checklist",
        items: [
          "Create your NextCut account",
          "Complete your profile — bio, photo, city, years of experience, specialties",
          "Add at least one service with accurate pricing",
          "Upload portfolio photos (minimum 3–5 recommended)",
          "Upload your barber license or verification document",
          "Submit your application for admin review",
          "Connect your Stripe account for payouts",
          "Complete Stripe onboarding — identity verification and banking setup",
          "Receive admin approval to go live",
        ],
      },
    ],
  },
  {
    id: "pricing",
    icon: DollarSign,
    iconColor: "text-amber-600 bg-amber-100",
    title: "Pricing Guidance",
    content: [
      {
        type: "p",
        text: "You are responsible for setting your own prices inside NextCut. This is one of the most important decisions you'll make as a barber on the platform — and it's worth doing thoughtfully, not just guessing.",
      },
      {
        type: "callout",
        color: "amber",
        title: "Platform fee applies to your service price",
        text: "If you want to take home around $40 on a first-time NextCut booking, you need to price your service higher than $40, because the 20% platform fee is calculated on the service price. For example: pricing at $50 means the platform fee is $10, leaving you with $40. See the Commission section below for full details.",
      },
      {
        type: "subheading",
        text: "Common Services to List",
      },
      {
        type: "bullets",
        items: [
          "Haircut only",
          "Haircut + beard combo",
          "Beard trim only",
          "Kids cut",
          "Lineup / edge-up / cleanup",
          "Specialty or textured cut (e.g. waves, loc maintenance, curly cuts)",
          "Add-ons — hot towel, scalp treatment, etc.",
          "Travel or mobile service fee (if you're a mobile barber)",
        ],
      },
      {
        type: "subheading",
        text: "How to Think About Your Prices",
      },
      {
        type: "bullets",
        items: [
          "How long does this service take you from start to finish?",
          "How much do you want to take home after the platform fee?",
          "What are other barbers in your city charging for the same service?",
          "Are you a mobile barber? Factor in travel time and costs.",
          "What does your portfolio, experience, and reputation justify?",
          "Are you just starting out, or do you have an established clientele?",
        ],
      },
      {
        type: "box",
        title: "Pricing Rules of Thumb",
        items: [
          "Don't underprice just to get bookings. It attracts the wrong expectations and hurts your perceived value — and is very hard to reverse.",
          "Review your prices at least every 3 months. As your rating and reviews grow, your prices should reflect your demand.",
          "Keep service descriptions accurate. Clients should know exactly what they're booking. Surprises lead to bad reviews.",
          "Simple pricing is better than complex pricing. Clients appreciate clarity.",
        ],
      },
    ],
  },
  {
    id: "commission",
    icon: TrendingUp,
    iconColor: "text-emerald-600 bg-emerald-100",
    title: "Commission / Platform Fee",
    content: [
      {
        type: "p",
        text: "NextCut charges a commission on each completed, paid booking. The rate depends on how the client found you — and this is designed to reward you for building your own clientele while still helping you grow through the platform.",
      },
      {
        type: "commission_table",
        rows: [
          {
            rate: "20%",
            label: "New NextCut Client",
            badgeColor: "bg-purple-100 text-purple-700",
            desc: "Client discovered you through the NextCut marketplace, search, or platform promotion. This is a brand-new client the platform brought to you.",
          },
          {
            rate: "15%",
            label: "Repeat Client",
            badgeColor: "bg-blue-100 text-blue-700",
            desc: "The same client books you again through NextCut. Once a client has completed a paid booking with you, future bookings are recognized as repeat.",
          },
          {
            rate: "10%",
            label: "Barber-Direct Client",
            badgeColor: "bg-emerald-100 text-emerald-700",
            desc: "Client came via your personal direct booking link or a referral. This is the lowest fee because you brought the client yourself.",
          },
        ],
      },
      {
        type: "subheading",
        text: "Commission Examples — $50 Service Price",
      },
      {
        type: "example_table",
        rows: [
          { label: "20% — New NextCut client", fee: "$10.00", barber: "$40.00", feeColor: "text-red-500" },
          { label: "15% — Repeat client", fee: "$7.50", barber: "$42.50", feeColor: "text-amber-500" },
          { label: "10% — Direct / referred client", fee: "$5.00", barber: "$45.00", feeColor: "text-emerald-600" },
        ],
      },
      {
        type: "callout",
        color: "emerald",
        title: "Tips are 100% yours",
        text: "Tips are never included in commission calculations. If a client tips $10 on a $50 service, you keep the full $10 tip on top of your service earnings. Tip income is tracked separately in your dashboard.",
      },
      {
        type: "bullets",
        items: [
          "Commission applies only to the service price — not tips",
          "Cancelled and no-show bookings do not generate commission",
          "Only completed, paid bookings count toward revenue tracking",
          "Your commission type is recorded at booking time based on how the client arrived",
        ],
      },
    ],
  },
  {
    id: "bookings",
    icon: Clock,
    iconColor: "text-blue-600 bg-blue-100",
    title: "Bookings and Client Flow",
    content: [
      {
        type: "p",
        text: "Once you're approved, clients can discover you and book directly through NextCut. Bookings appear in your barber dashboard and in the My Bookings page. You should review your bookings regularly.",
      },
      {
        type: "p",
        text: "Keeping your availability accurate is critical. Clients book based on what time slots are shown as open. If you're unavailable, block those times. False availability creates frustrated clients and negative experiences that affect your rating.",
      },
      {
        type: "subheading",
        text: "What Good Barber Behavior Looks Like",
      },
      {
        type: "checklist_items",
        items: [
          "Show up on time — clients scheduled around your listed availability",
          "Honor the listed service at the listed price — no surprises",
          "Keep pricing and service descriptions accurate at all times",
          "Maintain a strong, current portfolio to continue attracting clients",
          "Update availability whenever your schedule changes",
          "Be professional in every client interaction, before and during the appointment",
          "Respond promptly if a client needs to make changes",
        ],
      },
      {
        type: "note",
        text: "Your rating on NextCut is built on real client reviews after completed bookings. The barbers with the highest ratings are consistently the ones who are punctual, professional, and deliver exactly what they advertise.",
      },
    ],
  },
  {
    id: "stripe",
    icon: ShieldCheck,
    iconColor: "text-indigo-600 bg-indigo-100",
    title: "Stripe / Payments / Payouts",
    content: [
      {
        type: "p",
        text: "NextCut uses Stripe to handle online payment processing and to deposit your earnings directly into your bank account. Connecting and completing Stripe onboarding is a required step to becoming fully payout-ready on the platform.",
      },
      {
        type: "p",
        text: "To connect Stripe, go to the Payouts tab in your dashboard and click 'Connect Stripe.' You'll be redirected to Stripe's secure hosted onboarding flow where you'll provide your identity and banking information. This process is handled entirely by Stripe — NextCut never sees your banking details.",
      },
      {
        type: "subheading",
        text: "Stripe Statuses You May See",
      },
      {
        type: "badges",
        items: [
          { label: "Not Connected", color: "bg-slate-100 text-slate-600", desc: "You haven't started Stripe setup yet. Go to the Payouts tab to begin." },
          { label: "Onboarding In Progress", color: "bg-amber-100 text-amber-700", desc: "You've started the Stripe form but haven't finished. Return to the Payouts tab to continue." },
          { label: "Verification Needed", color: "bg-red-100 text-red-700", desc: "Stripe requires additional information from you. Check the Payouts tab for next steps." },
          { label: "Payouts Enabled", color: "bg-emerald-100 text-emerald-700", desc: "Fully verified. Earnings from completed bookings are deposited directly to your bank." },
        ],
      },
      {
        type: "callout",
        color: "blue",
        title: "Payout readiness is separate from profile approval",
        text: "Even if your barber profile is complete and you've been approved by admin, payouts are not enabled until Stripe onboarding is fully complete. Both steps are required. Your dashboard always shows your current status for each.",
      },
      {
        type: "p",
        text: "While your Stripe setup is pending, bookings can still be tracked and in-person payments can be recorded manually. However, online payment collection through NextCut requires a fully connected Stripe account.",
      },
    ],
  },
  {
    id: "profile-tips",
    icon: UserCheck,
    iconColor: "text-amber-600 bg-amber-100",
    title: "Profile Expectations",
    content: [
      {
        type: "p",
        text: "Your profile is the first thing clients see when they discover you on NextCut. A strong profile builds trust instantly and converts browsers into bookings. A low-effort profile — blurry photos, no bio, missing details — will consistently underperform.",
      },
      {
        type: "subheading",
        text: "A Strong Barber Profile Includes",
      },
      {
        type: "checklist_items",
        items: [
          "A clear, professional profile photo — ideally showing your face clearly",
          "A strong bio that explains your background, style, and what clients can expect from you",
          "Specialties listed clearly — for example, fades, textured cuts, beard sculpting, loc maintenance",
          "Accurate years of experience",
          "A complete, well-described service list with accurate pricing",
          "At least 3–5 portfolio photos showing your real work",
          "Correct city and service area listed",
          "Updated availability so clients can book you",
        ],
      },
      {
        type: "note",
        text: "A better profile leads to more trust, more bookings, and better reviews. Think of it as your digital storefront — it should look like you care.",
      },
    ],
  },
  {
    id: "portfolio-tips",
    icon: Camera,
    iconColor: "text-purple-600 bg-purple-100",
    title: "Portfolio Expectations",
    content: [
      {
        type: "p",
        text: "Your portfolio is your visual resume. Clients make booking decisions based on what they see. A strong portfolio with sharp, well-lit photos of your real work will outperform any bio. An empty or weak portfolio is one of the most common reasons barbers underperform on the platform.",
      },
      {
        type: "checklist_items",
        items: [
          "Upload real work only — never use images that aren't yours",
          "Use high-quality, well-lit photos — natural light produces the best results",
          "Show variety — different styles, textures, and cut types you specialize in",
          "Lead with your strongest and most recent work at the top",
          "Keep the portfolio current — remove old, blurry, or weak photos",
          "Avoid dark, grainy, or low-resolution images",
          "Aim for at least 5–10 photos to make a strong first impression",
        ],
      },
      {
        type: "box",
        title: "Tips for Better Portfolio Photos",
        items: [
          "Shoot in front of a plain, clean background whenever possible.",
          "Natural light (near a window) is better than overhead fluorescent lighting.",
          "Show the cut from multiple angles — front, side, and back.",
          "Clean up the chair area before shooting — the environment matters.",
          "Update your portfolio after every great cut. Build the habit.",
        ],
      },
    ],
  },
  {
    id: "availability",
    icon: Calendar,
    iconColor: "text-slate-600 bg-slate-100",
    title: "Availability Expectations",
    content: [
      {
        type: "p",
        text: "You are entirely responsible for keeping your availability accurate. Clients book based on what the platform shows as open — if you're unavailable, those slots need to be blocked.",
      },
      {
        type: "bullets",
        items: [
          "Block dates and times when you're unavailable — vacations, off days, or busy periods",
          "Update availability when your schedule changes, even short notice",
          "False availability creates frustrated clients, wasted time, and bad reviews",
          "Reliable, consistent scheduling builds trust and drives repeat bookings over time",
        ],
      },
      {
        type: "note",
        text: "Barbers with consistent, reliable availability are rewarded with stronger ratings and more repeat clients. Treating your NextCut calendar like a real business calendar is one of the simplest ways to improve your performance.",
      },
    ],
  },
  {
    id: "success",
    icon: Award,
    iconColor: "text-emerald-600 bg-emerald-100",
    title: "Barber Success Tips",
    content: [
      {
        type: "p",
        text: "The barbers who perform best on NextCut aren't necessarily the most talented — they're the most consistent and professional. Here's what top performers do differently:",
      },
      {
        type: "checklist_items",
        items: [
          "Complete every section of your profile before going live — don't cut corners",
          "Upload strong, diverse portfolio photos from day one",
          "Set fair, thoughtful pricing — don't underprice to chase early bookings",
          "Keep availability updated at all times so clients can always find an open slot",
          "Convert first-time NextCut clients into repeat clients through quality and professionalism",
          "Share your direct booking link with your existing client base — it earns you a lower 10% fee",
          "Maintain professionalism in every interaction — your reputation is your business",
          "Raise prices as your rating and demand grow — don't leave money on the table",
          "Respond to bookings promptly and honor every appointment",
          "Collect great reviews by delivering exactly what you advertise — no surprises",
        ],
      },
      {
        type: "callout",
        color: "primary",
        title: "Your direct booking link is underrated",
        text: "When you share your NextCut profile link with your existing clients and they book through it, the commission drops from 20% to 10%. If you regularly send existing clients through that link, you're immediately doubling your margin on those bookings. Find your direct link in the Overview tab of your dashboard.",
      },
    ],
  },
  {
    id: "rules",
    icon: AlertCircle,
    iconColor: "text-red-600 bg-red-100",
    title: "Rules & Standards",
    content: [
      {
        type: "p",
        text: "All barbers on NextCut are expected to operate professionally, honestly, and in line with platform standards. These rules exist to protect clients, other barbers, and the platform's integrity.",
      },
      {
        type: "bullets",
        items: [
          "Be licensed if your city or state requires it — and be able to verify it",
          "Provide accurate and honest profile information at all times",
          "Keep your profile, services, and pricing up to date",
          "Act professionally with all clients before, during, and after appointments",
          "Honor every booked appointment at the listed service and price",
          "Do not mislead clients about what is included in a service",
          "Do not manipulate or inflate reviews",
          "Follow all NextCut platform requirements and terms",
          "Understand that public visibility and approval status depend on compliance with these standards",
        ],
      },
      {
        type: "callout",
        color: "red",
        title: "Violations can result in suspension",
        text: "Barbers who consistently violate platform standards — whether through no-shows, misleading profiles, unprofessional conduct, or dishonest practices — may be suspended or removed from the platform. Your account status is always subject to admin review.",
      },
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: "Why am I not visible publicly yet?",
    a: "Your profile must be approved by the NextCut admin team before you appear on the marketplace. Make sure your profile is fully complete — including your bio, photo, services, and barber license upload. Once submitted, admin will review your application. You'll see your approval status in the dashboard header.",
  },
  {
    q: "Why can't I receive payouts yet?",
    a: "Payouts require a completed Stripe onboarding. Even if your barber profile is approved, payouts won't be enabled until you connect Stripe and complete their verification and banking setup. Go to the Payouts tab in your dashboard to get started.",
  },
  {
    q: "How do I know if I'm approved?",
    a: "Your dashboard status header will show 'Approved & Active' when you're live on the marketplace. If it shows 'Pending Approval,' your application is still under review. Make sure every required step is completed — incomplete profiles delay or block approval.",
  },
  {
    q: "How should I choose my prices?",
    a: "Think about how long each service takes, what you want to take home after the platform fee, and what's competitive in your area. Factor in whether you're a mobile barber (travel time/cost) or shop-based. Don't underprice to get early bookings — it's hard to raise prices later and can hurt your perceived value.",
  },
  {
    q: "Do I keep my tips?",
    a: "Yes — 100%. Tips are never included in platform commission calculations. Every dollar a client tips goes directly to you, on top of your service earnings. Tip income is tracked separately in your earnings dashboard.",
  },
  {
    q: "How does the platform fee work?",
    a: "The platform fee is a percentage of your service price — 20% for new NextCut clients, 15% for repeat clients, and 10% for clients you bring via your direct booking link. Tips are always excluded. Cancelled bookings don't generate a fee — only completed, paid bookings count.",
  },
  {
    q: "What happens if I haven't finished Stripe setup?",
    a: "You can still take in-person payments and track bookings through NextCut. However, online payment collection and automatic payouts through the platform won't be available until you complete Stripe onboarding. Your payout status will show as incomplete until then.",
  },
  {
    q: "How do I improve my chances of getting booked?",
    a: "Complete your profile fully, upload strong portfolio photos, write a clear bio, set accurate and fair service prices, and keep availability updated. Barbers with complete profiles and real portfolio photos consistently get significantly more bookings than those with incomplete or bare-minimum profiles.",
  },
  {
    q: "What is a direct booking link and why does it matter?",
    a: "Your direct booking link is a unique URL to your profile that you can share with existing clients. When clients book through that link, NextCut recognizes them as barber-direct, which means the commission drops from 20% to 10%. It's the fastest way to improve your margins on clients you already have. Find your link in the Overview tab.",
  },
  {
    q: "Can I change my prices after I'm live?",
    a: "Yes — you can update your service prices at any time in the Services tab. Changes apply to new bookings only, not bookings already confirmed at the old price. Review your prices regularly and raise them as your rating and demand justify it.",
  },
];

// ─────────────────────────────────────────────────────────────
// Content renderers
// ─────────────────────────────────────────────────────────────

function renderContent(blocks) {
  return blocks.map((block, i) => {
    switch (block.type) {
      case "p":
        return (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            {block.text}
          </p>
        );

      case "subheading":
        return (
          <p key={i} className="font-semibold text-foreground text-sm pt-1">
            {block.text}
          </p>
        );

      case "bullets":
        return (
          <ul key={i} className="space-y-1.5 ml-1">
            {block.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );

      case "numbered":
        return (
          <ol key={i} className="space-y-2 ml-1">
            {block.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {j + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        );

      case "checklist_items":
        return (
          <ul key={i} className="space-y-1.5 ml-1">
            {block.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );

      case "checklist":
        return (
          <div key={i} className="space-y-2">
            {block.items.map((item, j) => (
              <div key={j} className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {j + 1}
                </span>
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        );

      case "highlight":
        return (
          <ul key={i} className="space-y-1.5 ml-1">
            {block.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );

      case "badges":
        return (
          <div key={i} className="space-y-3">
            {block.items.map(({ label, color, desc }, j) => (
              <div key={j} className="flex items-start gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5 whitespace-nowrap ${color}`}>
                  {label}
                </span>
                <span className="text-sm text-muted-foreground leading-relaxed">{desc}</span>
              </div>
            ))}
          </div>
        );

      case "commission_table":
        return (
          <div key={i} className="space-y-2">
            {block.rows.map(({ rate, label, badgeColor, desc }, j) => (
              <div key={j} className="p-4 bg-secondary rounded-xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badgeColor}`}>
                    {rate} fee
                  </span>
                  <span className="font-semibold text-foreground text-sm">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        );

      case "example_table":
        return (
          <div key={i} className="bg-secondary rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 gap-px bg-border text-xs font-semibold text-muted-foreground px-4 py-2">
              <span>Scenario</span>
              <span className="text-center">Platform Fee</span>
              <span className="text-right">You Earn</span>
            </div>
            {block.rows.map(({ label, fee, barber, feeColor }, j) => (
              <div key={j} className={`grid grid-cols-3 gap-px px-4 py-3 text-sm ${j % 2 === 0 ? "bg-secondary" : "bg-card"}`}>
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className={`text-center font-semibold text-xs ${feeColor}`}>{fee}</span>
                <span className="text-right font-bold text-emerald-600 text-xs">{barber}</span>
              </div>
            ))}
          </div>
        );

      case "callout":
        const calloutStyles = {
          amber: "bg-amber-50 border-amber-200 text-amber-800 [&_.title]:text-amber-900 [&_.body]:text-amber-700",
          emerald: "bg-emerald-50 border-emerald-200 [&_.title]:text-emerald-900 [&_.body]:text-emerald-700",
          blue: "bg-blue-50 border-blue-200 [&_.title]:text-blue-900 [&_.body]:text-blue-700",
          red: "bg-red-50 border-red-200 [&_.title]:text-red-900 [&_.body]:text-red-700",
          primary: "bg-primary/5 border-primary/20 [&_.title]:text-foreground [&_.body]:text-muted-foreground",
        };
        return (
          <div key={i} className={`p-4 rounded-xl border ${calloutStyles[block.color] || calloutStyles.primary}`}>
            <p className="title font-semibold text-sm mb-1">{block.title}</p>
            <p className="body text-xs leading-relaxed">{block.text}</p>
          </div>
        );

      case "note":
        return (
          <div key={i} className="p-3 bg-secondary rounded-xl">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Note: </strong>{block.text}
            </p>
          </div>
        );

      case "box":
        return (
          <div key={i} className="p-4 bg-secondary rounded-xl space-y-2">
            <p className="font-semibold text-foreground text-sm">{block.title}</p>
            {block.items.map((item, j) => (
              <p key={j} className="text-xs text-muted-foreground leading-relaxed">• {item}</p>
            ))}
          </div>
        );

      default:
        return null;
    }
  });
}

// ─────────────────────────────────────────────────────────────
// Section card
// ─────────────────────────────────────────────────────────────

function Section({ section }) {
  const Icon = section.icon;
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${section.iconColor}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <h2 className="font-heading font-bold text-base">{section.title}</h2>
      </div>
      <div className="px-5 py-5 space-y-4">
        {renderContent(section.content)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ accordion item
// ─────────────────────────────────────────────────────────────

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-secondary transition-colors"
      >
        <span className="text-sm font-medium text-foreground pr-4">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 text-sm text-muted-foreground leading-relaxed border-t border-border bg-secondary/30">
          {a}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Personalized status card at top of page
// ─────────────────────────────────────────────────────────────

function BarberStatusSummary({ barber }) {
  if (!barber) return null;

  const profileComplete = !!(barber.bio && barber.profile_photo && barber.display_name);

  const items = [
    {
      label: "Application",
      value: barber.status === "active" ? "Approved" : barber.status === "pending" ? "Pending Review" : barber.status === "suspended" ? "Suspended" : "Draft",
      color: barber.status === "active" ? "text-emerald-600" : barber.status === "suspended" ? "text-red-600" : "text-amber-600",
    },
    {
      label: "Payouts",
      value: barber.payouts_enabled ? "Enabled" : barber.stripe_status === "not_connected" || !barber.stripe_status ? "Not Connected" : barber.stripe_status === "verification_needed" ? "Needs Verification" : "Setup Needed",
      color: barber.payouts_enabled ? "text-emerald-600" : "text-amber-600",
    },
    {
      label: "Profile",
      value: profileComplete ? "Complete" : "Incomplete",
      color: profileComplete ? "text-emerald-600" : "text-amber-600",
    },
  ];

  const nextAction = !profileComplete
    ? "Complete your profile — add a bio and profile photo to improve your chances of approval."
    : barber.status === "suspended"
    ? "Your account is suspended. Please contact NextCut support."
    : barber.status !== "active"
    ? "Your application is under review. Make sure your profile is fully complete and your license is uploaded."
    : !barber.payouts_enabled
    ? "Connect Stripe in the Payouts tab to enable online payments and automated payouts."
    : "You're fully live. Keep your availability accurate and your portfolio updated!";

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-bold text-sm">Your Current Status</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map(({ label, value, color }) => (
          <div key={label} className="p-3 bg-secondary rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-xs font-semibold leading-tight ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2.5 p-3.5 bg-primary/5 border border-primary/15 rounded-xl">
        <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-foreground leading-relaxed">{nextAction}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Table of contents — optional navigation aid
// ─────────────────────────────────────────────────────────────

function TableOfContents() {
  const titles = SECTIONS.map(s => s.title);
  return (
    <div className="bg-secondary rounded-2xl p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">In This Guide</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {titles.map((title, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span>{title}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HelpCircle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          <span>Frequently Asked Questions</span>
        </div>
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
        <h2 className="font-heading font-bold text-2xl">Barber Handbook</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Everything you need to know about how NextCut works — from approval and bookings to commissions, payouts, and how to succeed on the platform.
        </p>
      </div>

      {/* Personalized status summary */}
      <BarberStatusSummary barber={barber} />

      {/* Table of contents */}
      <TableOfContents />

      {/* All guide sections */}
      {SECTIONS.map(section => (
        <Section key={section.id} section={section} />
      ))}

      {/* FAQ section */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base">Frequently Asked Questions</h2>
            <p className="text-xs text-muted-foreground">Common questions from barbers joining the platform</p>
          </div>
        </div>
        <div className="p-5 space-y-2">
          {FAQ_ITEMS.map(item => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center pb-4">
        <p className="text-xs text-muted-foreground">
          This guide is updated periodically as the platform evolves. Check back for the latest information.
        </p>
      </div>
    </div>
  );
}