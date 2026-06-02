---
created: 2026-06-02
status: active
tags: [idea, local-seo, home-based, service-area, lead-gen]
aliases: [Situation-Based Lead Gen, Core Attack]
---

# Situation-Based Lead Gen — Attacking the Core

> *"Find businesses by their WEAKNESS. Fix the thing that's actually holding them back."*

---

## The Core Insight

Different businesses have different problems. Instead of a generic "do you need a website?" pitch, target the **specific situation** causing their poor online presence:

| Situation | The Problem | The Fix | Best Niches |
|-----------|------------|---------|-------------|
| **Home-based** | Business address is their home — looks unprofessional, limits GBP ranking | Virtual address + professional website + GBP optimization | CPAs, tax preparers, contractors, cleaners, consultants, coaches, notaries, home inspectors, dog walkers, mobile mechanics |
| **Service-area** | No physical location on GBP — customers want to see a real place | Service-area setup + location landing pages + website | Plumbers, electricians, landscapers, painters, movers, cleaners, pest control |
| **No website** | Facebook page or nothing — zero control over online presence | 5-page website + GBP optimization | Any local business |
| **Low rating** | Under 4.0 stars or under 20 reviews — customers choose competitors | Review generation system + reputation management | Restaurants, barbers, dentists, auto shops |
| **Facebook-only** | Only have a Facebook page (no GBP, no website) | Complete GBP setup + website | Older businesses, mom-and-pop shops |
| **Inconsistent info** | Missing hours, services, photos on GBP — Google doesn't trust them | GBP optimization + content calendar | All of the above |

---

## The Lead Gen Approach

Each day, Gemini targets a specific situation + niche combination:

```bash
# Monday: Home-based CPAs in Austin
python gemini-tool.py situation --city "Austin" --type "cpa" --situation "home-based"

# Tuesday: Service-area plumbers in Austin
python gemini-tool.py situation --city "Austin" --type "plumbers" --situation "service-area"

# Wednesday: No-website contractors in Austin
python gemini-tool.py situation --city "Austin" --type "contractors" --situation "no-website"
```

Gemini:
1. Searches the web for businesses matching the situation
2. Verifies their website/GBP/residential address status
3. Determines their BIGGEST GAP (website, GBP, or both)
4. Scores and prioritizes them
5. Writes a situation-specific pitch angle

---

## Daily Rotation

The `daily-leads.sh` script auto-rotates BOTH niches AND situations:

| Day | Niche | Situation | Why |
|-----|-------|-----------|-----|
| Monday | Barbers | Home-based | Barbers sometimes operate from home |
| Tuesday | Plumbers | Service-area | Most plumbers are service-area |
| Wednesday | Electricians | No-website | Electricians often skip websites |
| Thursday | Dentists | Low-rating | Reputation is everything |
| Friday | Chiropractors | FB-only | Older practitioners use FB only |
| Saturday | Auto mechanics | Inconsistent-hours | Always mess up their hours |
| Sunday | Restaurants | Low-rating | Reviews make or break them |

---

## Sales Pitch by Situation

### Home-based Business Pitch
> *"I see your business is home-based — smart way to start. But when someone searches for a CPA in Austin, your home address on Google doesn't look as professional as it should. I can set you up with a proper business address listing, a professional website, and a Google profile that looks like a real firm — without you renting office space."*

### Service-Area Business Pitch
> *"You serve your customers at their locations, which is great. But when people search for a plumber, Google shows businesses with physical locations higher. I can fix your service-area setup, create a website that ranks for every neighborhood you serve, and get you showing up for 'emergency plumber near me' searches."*

### No-Website Pitch
> *"When I searched for your business on Google, you don't have a website — just a Facebook page. A Facebook page isn't a business website. For $497/month I'll build you a 5-page professional site, optimize your Google profile, and start bringing you customers from Google search. Your competitors with websites are getting the calls you should be getting."*

---

*This system is built into gemini-tool.py as the `situation` command.*
