---
created: 2026-06-02
status: active
tags: [idea, local-seo, gbp, websites, agency]
aliases: [Local Presence Agency, StealthO Local]
---

# Local Presence Agency

> *"Turn local businesses into the top result on Google — websites, GBP rankings, content, done."*

---

## One-Line Idea

Monthly subscription agency: build websites + manage Google Business Profiles + content/social media for local businesses that need to show up on Google but don't have the time or skills.

## Validation

| Dimension | Assessment |
|-----------|-----------|
| Who is it for | Local small businesses — restaurants, barbers, contractors, dentists, vets, auto shops, plumbers |
| What pain | 1) No website or terrible site 2) Don't show up on Google Maps 3) No time for content/social 4) Losing customers to competitors who rank higher |
| How it earns | Recurring monthly subscriptions ($197-$997/mo per client) |
| Lead-gen method | Gemini + Google Places API + scrapers to find: businesses without websites, low-ranking GBP, active/open businesses needing optimization |
| Free-stack feasible | ✅ Google Places API (free tier), Gemini API, simple landing page builder, Canva for content |
| Competitors | Traditional SEO agencies ($2k+/mo — overpriced for small biz), Fiverr freelancers (inconsistent), DIY (businesses don't do it) |
| **Viability (1-10)** | **9** — huge market, recurring revenue, low delivery cost, perfect for solo founder |
| **Real reason** | Every local business NEEDS this. Most don't know how. The ones who try give up. Recurring revenue compounds. |

## Verdict

**GO** — Start calling tomorrow. Land 5 clients in first month = $2k-$5k MRR.

---

## Target Market

### Tier 1 (Easiest to Close)
- Businesses with **no website** (or "website" = Facebook page)
- Active Google Business Profile but **low ranking** (page 2+)
- Service area: your local city + surrounding 30 min drive

### Tier 2 (Higher Ticket)
- Businesses with a website but **no GBP optimization**
- Not posting photos/reviews on GBP (most don't)
- Losing to competitors who rank above them

### Best Niches to Start
| Niche | Why |
|-------|-----|
| Barbershops | Already know this market, quick close |
| Restaurants | High need for GBP + photos |
| Auto shops/mechanics | Great margins, terrible online presence |
| Dentists/dental | High value clients, willing to pay |
| Plumbers/HVAC/Contractors | Always need leads, no time for online |
| Chiropractors | High recurring need for content |

---

## Lead Gen System

### Tool Stack
| Tool | Purpose | Cost |
|------|---------|------|
| **Google Places API** | Search businesses by keyword, location, filters | Free tier ($200/mo credit) |
| **Gemini API (with Plus)** | Analyze GBP data, identify weak profiles, generate outreach | Included |
| **Google Maps scraper** | Export business name, phone, address, rating, website status | Free |
| **Apollo.io / LinkedIn** | Find decision-maker contact info | Free tier |
| **Clay.com** | Enrich leads at scale | Paid (when scaling) |

### Daily Lead Gen Workflow (15 min)

```
1. Search: "plumbers in [city]" + filter: no website, 3-4 star rating
2. Export: name, phone, address, rating, review count, website status
3. Score: Priority score based on:
   - No website = HIGH priority
   - 3-4 stars with <50 reviews = MEDIUM (easy to move up)
   - Low ranking keywords = HIGH priority
4. Enrich: Find owner name + phone if missing
5. Call: Work through priority list
```

### Gemini Prompt for Lead Scoring

```
You are a lead-scoring assistant. Analyze this Google Business Profile data:

Business: [name]
Category: [niche]
Rating: [X stars]
Review count: [X]
Has website: [yes/no]
Approx rank for "[keyword] in [city]": [position]

Score 1-10 on likelihood they'd buy GBP management + website services.
Give a one-sentence pitch angle for this specific business.
```

---

## Service Tiers & Pricing

### Bronze — GBP Booster ($197/mo)
12-month minimum commitment.

| What they get | Details |
|---------------|---------|
| GBP profile audit & optimization | Category, services, hours, description, Q&A |
| 4 photo/video posts per week | You send 4 pics or 15-sec videos of their work |
| Review generation system | Template texts to ask every customer for a review |
| Monthly progress report | Screenshot of GBP insights (views, searches, direction requests) |
| Monthly check-in call | 15-min phone to review results, get content |

**Delivery time:** 30 min/week per client

### Silver — Website + GBP ($497/mo)
12-month minimum. Includes Bronze.

| What they get | Details |
|---------------|---------|
| Custom 5-page website | Built on simple stack (Next.js or Carrda/Webflow), mobile-first |
| Hosting & domain included | You handle it, zero work for them |
| Unlimited minor edits | Text changes, hours, menu updates (under 30 min) |
| Google Analytics set up | Show them traffic data |
| Everything in Bronze | GBP management + weekly content |

**Delivery time:** 3-5 hrs setup, then 1 hr/week maintenance

### Gold — Full Presence ($997/mo)
12-month minimum. Includes Silver + Bronze.

| What they get | Details |
|---------------|---------|
| Everything in Silver + Bronze | |
| 2 social media posts/week | Instagram/Facebook — photos, captions, hashtags |
| 1 blog post/month | SEO-optimized for local keywords |
| Google Ads setup & mgmt | $200 ad budget extra, you manage the campaign |
| Monthly content calendar | Planned out 30 days ahead |
| Monthly strategy call | 30-min video call to review analytics, plan next month |

**Delivery time:** 5-8 hrs setup, then 3-5 hrs/week

---

## Sales Scripts

### Cold Call Script (Under 90 Seconds)

```
"Hi [name], this is Kendall. I'm not trying to sell you anything over the phone.

Quick question — when someone searches '[service] in [city]' on Google, 
does your business show up on the first page?"

[If no or unsure:]

"That's exactly why I'm calling. I help local businesses like yours 
get to the top of Google Maps and search results — with a website, 
Google profile management, and weekly content that actually brings in customers.

I'm taking on [number] new clients this month. If I can get you 
showing up on page one within 60 days, would that be worth a 10-minute 
coffee to talk about it?"

[Yes] → "Great, I'll send you a text right now with my calendar link."
[No/Not interested] → "No problem. Can I send you a free report 
showing exactly where your business ranks right now?"
```

### Voicemail Script

```
"Hey [name], Kendall here. I help local businesses in [city] 
show up on the first page of Google — websites, Google Maps ranking, 
the whole thing. 

I'm working with a few [niche] businesses right now and had a specific 
idea for yours. Give me 10 minutes this week and I'll show you 
exactly where you're losing customers to competitors online.

My number is [your number]. I'll send you a text too so you have it. 
Talk soon."
```

### Common Objection Rebuttals

| Objection | Rebuttal |
|-----------|----------|
| "I don't have time" | "That's exactly why I'm calling. You run the business, I handle everything online. It's zero work for you." |
| "I already show up on Google" | "Let me pull up your profile right now. [Check]. I can see you're ranking #[X] for [keyword]. Your competitor [name] is above you. I can fix that." |
| "How much?" | "It depends on what you need. Some businesses just need their Google profile managed, that's $197/mo. Others want a full website + everything, that's $497. Let me show you what would make the biggest difference for YOUR business." |
| "I'll think about it" | "Totally fair. Let me send you a free ranking report for your business right now. If you see an opportunity, you know how to reach me." |
| "Can't I just do it myself?" | "You could. But my clients tell me the same thing — they start, then get busy running their business, and it falls off after 2 weeks. I do it consistently every week so you actually get results." |
| "That's expensive" | "Compare it to what a single customer is worth to you. If I bring you 2-3 extra customers per month from Google, the service pays for itself 10x over. What's one customer worth to your business?" |

---

## Client Onboarding Checklist

### Day 1 (Sale Closed)
- [ ] Send welcome email + contract (Docusign or simple PDF)
- [ ] Collect payment method (Stripe subscription)
- [ ] Get GBP access (or guide them to add you as manager)
- [ ] Get social media access (if Gold tier)
- [ ] Gather business info: hours, services, photos, description

### Week 1 (Setup)
- [ ] Optimize GBP: category, services, description, hours, photos
- [ ] Post first 4 photos/videos
- [ ] Draft first review request text for them to send
- [ ] If Silver/Gold: Start website build
- [ ] If Gold: Create first social posts + content calendar

### Week 2-4 (Consistency)
- [ ] Post 4x/week on GBP
- [ ] Website live (if Silver/Gold)
- [ ] Review check: reply to all existing reviews
- [ ] Send first monthly report

### Monthly Recurring
- [ ] Week 1: 4 GBP posts, check reviews
- [ ] Week 2: 4 GBP posts, minor website edits
- [ ] Week 3: 4 GBP posts, social posts (Gold)
- [ ] Week 4: Monthly report + check-in call

---

## Deliverable Templates

### Weekly GBP Content (4 posts)
| Day | Type | Example |
|-----|------|---------|
| Monday | Photo of recent work | "Before/after of today's haircut at [shop]" |
| Wednesday | Short video | 15-sec pan of the shop, "Come see us this week" |
| Friday | Customer moment | "Happy customer just left with a smile" |
| Saturday | Promo/offer | "Book now for [service] — limited spots this week" |

### Monthly Report Template
```
Subject: Your GBP Results — [Month] [Year]

Key Metrics:
- Google Searches: [X] (up/down from last month)
- Profile Views: [X]
- Direction Requests: [X]
- New Reviews: [X] (average rating: X.X)
- Website Clicks: [X]

Content Posted: [X] photos, [X] videos

Top Search Terms:
1. [keyword] — ranked #[position]
2. [keyword] — ranked #[position]
3. [keyword] — ranked #[position]

Next Month's Focus: [specific action item]
```

---

## Revenue Projection

| Clients | Bronze ($197) | Silver ($497) | Gold ($997) | Monthly Revenue |
|---------|--------------|--------------|-------------|-----------------|
| 5 | 3 | 1 | 1 | $591 + $497 + $997 = $2,085 |
| 10 | 5 | 3 | 2 | $985 + $1,491 + $1,994 = $4,470 |
| 20 | 10 | 6 | 4 | $1,970 + $2,982 + $3,988 = $8,940 |
| 30 | 15 | 10 | 5 | $2,955 + $4,970 + $4,985 = $12,910 |

---

## Website Build Spec (Silver Tier)

### Stack Options
| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| **Next.js + Tailwind** | Full control, fast, templates ready | More build time | Higher ticket |
| **Carrda** | Drag-and-drop, fast delivery | Monthly fee, less custom | Quick launches |
| **Webflow** | Professional output, CMS | Learning curve, export limits | Design-heavy sites |

### 5-Page Structure
1. **Home** — Hero, USP, CTA, social proof
2. **Services** — What they offer, pricing
3. **About** — Story, team, photos
4. **Gallery/Portfolio** — Photos of their work
5. **Contact/Book** — Phone, form, booking link, map

### SEO Basics (Built Into Every Site)
- Google Business Profile link
- Schema markup (LocalBusiness)
- Google Analytics
- Mobile-first responsive
- Page speed optimized
- Meta titles/descriptions per page

---

## Next Actions (Your Tomorrow)

| Time | Action |
|------|--------|
| 9 AM | Download list of 50 businesses in your city using scraper |
| 10 AM | Score + prioritize list (no website = call first) |
| 10:30 AM | Start calling. Goal: 20 calls. |
| 1 PM | Follow up with any callbacks |
| 2 PM | If no meetings booked, switch to texting |
| 3 PM | Close at least 1 discovery call |
| 5 PM | Send free ranking reports to all no's |

### Minimum Viable Goal
- 20 calls/day = 100 calls/week
- 10% pick up = 10 conversations
- 3/10 interested = 3 discovery calls
- 1/3 closes = 1 new client/week
- = 4 clients/month = $1,500-$3,000/mo MRR in 30 days

---

*Built by PRIME for Kendall — ready to start calling June 3, 2026.*
