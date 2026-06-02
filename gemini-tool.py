#!/usr/bin/env python3
"""
StealthO Gemini Agent — Lead Research & Verification System

ATTACKS THE CORE: Finds businesses by their specific SITUATION that causes
poor online presence — home-based businesses, no website, low ratings, etc.

Usage:
  export GEMINI_API_KEY="your-key"

  # Find home-based businesses (CPAs, contractors, cleaners operating from home)
  python gemini-tool.py situation --city "Austin" --type "cpa-tax-preparers" --situation "home-based" --output leads.csv

  # Find businesses with no website at all
  python gemini-tool.py situation --city "Austin" --type "contractors" --situation "no-website" --output leads.csv

  # Find service-area businesses (no storefront)
  python gemini-tool.py situation --city "Austin" --type "plumbers" --situation "service-area" --output leads.csv

  # Same via pipeline with --situation flag
  python gemini-tool.py pipeline --city "Austin" --type "barbers" --situation "home-based" --output leads.csv

  # Standard pipeline (no situation filter)
  python gemini-tool.py pipeline --city "Austin" --type "plumbers" --output leads.csv

  # Verify a specific business before calling
  python gemini-tool.py verify --business "Ace Plumbing" --city "Austin"

  # Generate GBP content
  python gemini-tool.py content --task weekly-posts --business "Austin Barbershop"

  # Daily auto-run
  bash daily-leads.sh "Austin"

Situations available:
  home-based       - Businesses operating from home/residential address
  service-area     - Service-area businesses with no physical storefront
  no-website       - Businesses with NO website (Facebook only or nothing)
  low-rating       - Low Google rating (under 4.0) or few reviews (under 20)
  fb-only          - Only have a Facebook page (no GBP, no website)
  inconsistent-hours - Incomplete/missing GBP info (hours, services, photos)
"""

import os, sys, json, csv, time, argparse
from datetime import datetime

# ─── Leads Database ──────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from leads_db import LeadsDB
leads_db = LeadsDB()

# ─── Gemini SDK ──────────────────────────────────────────────────────────────
from google import genai
from google.genai import types

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("ERROR: Set GEMINI_API_KEY environment variable")
    sys.exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"  # Fast + cheap for research with search grounding

# ─── HELPERS ─────────────────────────────────────────────────────────────────

def call_gemini(prompt, use_search=True, max_retries=3):
    """Call Gemini with retry logic and optional Google Search grounding."""
    config = types.GenerateContentConfig(
        temperature=0.2,
    )
    if use_search:
        config.tools = [types.Tool(google_search=types.GoogleSearch())]

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=config,
            )
            return response.text.strip()
        except Exception as e:
            if attempt < max_retries - 1:
                wait = (attempt + 1) * 3
                print(f"      ⏳ Gemini busy, retrying in {wait}s... ({attempt+1}/{max_retries})")
                time.sleep(wait)
            else:
                return f"ERROR: {e}"


def parse_json(text):
    """Extract JSON from Gemini response (it loves markdown fences and extra text)."""
    text = text.strip()
    # Try to find a JSON array or object between backtick fences
    if "```" in text:
        # Extract content from the first code block
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("[") or part.startswith("{"):
                try:
                    return json.loads(part)
                except json.JSONDecodeError:
                    continue
    # Try direct parse
    if text.startswith("[") or text.startswith("{"):
        return json.loads(text)
    # Try to find JSON by scanning for [ or { 
    for start_char, end_char in [("[", "]"), ("{", "}")]:
        start = text.find(start_char)
        if start >= 0:
            # Find matching end
            depth = 0
            for i in range(start, len(text)):
                if text[i] == start_char:
                    depth += 1
                elif text[i] == end_char:
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(text[start:i+1])
                        except json.JSONDecodeError:
                            continue
    raise json.JSONDecodeError("No JSON found in response", text, 0)


# ─── COMMANDS ────────────────────────────────────────────────────────────────

def cmd_leads(city, biz_type):
    """Research mode: find real businesses in a city using Gemini with search."""
    print(f"\n🔍 Researching {biz_type} in {city}...\n")

    prompt = f"""Search the web and find 15 real, active {biz_type} businesses in {city}.

For EACH business, return a JSON array with:
- name: business name
- address: full street address
- phone: phone number (if found)
- website_status: "has_website" or "no_website_found" or "unconfirmed"
- google_rating: estimated rating (if found)
- review_count: approximate review count (if found)
- notes: any other relevant details

Be honest — if you can't confirm a website exists, mark it as "no_website_found".
Only return real businesses you can verify exist.

Return ONLY valid JSON, no other text."""
    
    result = call_gemini(prompt, use_search=True)
    
    try:
        data = parse_json(result)
        print(f"✅ Found {len(data)} leads\n")
        for i, b in enumerate(data, 1):
            ws = "❌ NO WEBSITE" if b.get("website_status") == "no_website_found" else "✅ has website"
            rating = f"⭐ {b.get('google_rating', '?')} ({b.get('review_count', '?')} reviews)"
            print(f"  {i}. {b['name']} — {ws}")
            print(f"     {rating}")
            print(f"     {b.get('address', '')}")
            if b.get('phone'):
                print(f"     📞 {b['phone']}")
            print()
        return data
    except json.JSONDecodeError:
        print("Raw response:")
        print(result)
        return None


def cmd_verify(business, city):
    """Verify a specific business: website status, GBP ranking, rating."""
    print(f"\n🔎 Verifying: {business} in {city}...\n")

    prompt = f"""Research this business: "{business}" in {city}.

I need to know BEFORE I call them. Be accurate.

Return a JSON object with these fields:
- business_name: full name
- address: full address
- phone: phone number (if found)
- has_website: true/false (be honest — if they don't have one, say false)
- website_url: the URL if they have one, or null
- google_rating: their Google rating (if found) or null
- review_count: number of Google reviews (if found) or 0
- has_google_business_profile: true/false
- approximately_rank: what position they appear for "[their service] in [city]" (if you can estimate)
- top_competitors: names of 2-3 competitors that rank above them
- summary: one-sentence assessment of their online presence
- call_angle: one-sentence pitch angle specific to this business
- confidence: "high", "medium", or "low" — how sure you are about this data

Use Google Search to verify everything. Return ONLY valid JSON."""
    
    result = call_gemini(prompt, use_search=True)
    
    try:
        data = parse_json(result)
        print(f"  Business:     {data.get('business_name', business)}")
        print(f"  Address:      {data.get('address', 'N/A')}")
        print(f"  Phone:        {data.get('phone', 'N/A')}")
        
        ws = "❌ NO WEBSITE" if not data.get('has_website') else f"✅ {data.get('website_url', 'Has website')}"
        print(f"  Website:      {ws}")
        
        gbp = "✅ Has GBP" if data.get('has_google_business_profile') else "❌ NO GBP"
        print(f"  GBP:          {gbp}")
        
        if data.get('google_rating'):
            print(f"  Rating:       ⭐ {data['google_rating']} ({data.get('review_count', '?')} reviews)")
        
        if data.get('approximately_rank'):
            print(f"  Est. Rank:    #{data['approximately_rank']}")
        
        if data.get('top_competitors'):
            print(f"  Competitors:  {', '.join(data['top_competitors'])}")
        
        print(f"\n  📋 {data.get('summary', '')}")
        print(f"  🎯 Angle: {data.get('call_angle', '')}")
        print(f"  Confidence: {data.get('confidence', 'medium')}\n")
        
        return data
    except json.JSONDecodeError:
        print("Raw response:")
        print(result)
        return None


def cmd_score(leads):
    """Score a list of leads (dicts) with priority."""
    print(f"\n📊 Scoring {len(leads)} leads...\n")
    
    prompt = f"""You are a lead-scoring AI for a local SEO agency.

Score each business below on a scale of 1-10 for LIKELIHOOD TO BUY 
monthly Google Business Profile management + website services.

Scoring rules:
- 9-10: No website, low rating (<4.0), few reviews (<20) — DESPERATE for help
- 7-8: No website OR weak GBP presence — clear need
- 5-6: Has website but poor GBP — could be convinced
- 3-4: Solid presence — harder sell
- 1-2: Strong online presence — pass

Return a JSON array with objects containing:
- name: business name
- score: 1-10
- priority: "high" (call first), "medium", "low" (call last)
- pitch_angle: one-sentence pitch specific to this business
- reason: why this score

Leads to score:
{json.dumps(leads, indent=2)}

Return ONLY valid JSON array."""
    
    result = call_gemini(prompt, use_search=False)
    
    try:
        data = parse_json(result)
        # Sort by score descending
        data.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        print(f"{'PRIORITY':<10} {'SCORE':<6} {'BUSINESS':<30} {'ANGLE'}")
        print("-" * 80)
        for b in data:
            pri = b.get('priority', 'medium').upper()
            score = b.get('score', 5)
            name = b.get('name', '?')[:28]
            angle = b.get('pitch_angle', '')[:50]
            print(f"{pri:<10} {score:<6} {name:<30} {angle}")
        
        print(f"\n📌 High priority: {sum(1 for b in data if b.get('priority') == 'high')}")
        print(f"📌 Medium priority: {sum(1 for b in data if b.get('priority') == 'medium')}")
        print(f"📌 Low priority: {sum(1 for b in data if b.get('priority') == 'low')}")
        
        return data
    except json.JSONDecodeError:
        print("Raw response:")
        print(result)
        return None


def cmd_content(task, business, city=None, count=4):
    """Generate GBP or website content."""
    templates = {
        "weekly-posts": f"""Create {count} Google Business Profile posts for {business}{f' in {city}' if city else ''}.

Each post must be:
- A photo caption (imagine the photo is of their recent work)
- Engaging and local
- 1-3 hashtags
- A call-to-action

Return JSON array:
[{{"day": "Monday", "title": "...", "caption": "...", "hashtags": ["...", "..."], "cta": "..."}}]""",
        
        "website-homepage": f"""Write homepage copy for a {business} website.

Return JSON:
{{"headline": "...", "subheadline": "...", "hero_cta": "...", "value_props": ["...", "...", "..."], "about_section": "..."}}""",
        
        "review-request": f"""Write a text message template for {business} to send customers asking for a Google Review.

Return JSON:
{{"sms_template": "...", "whatsapp_template": "...", "best_timing": "..."}}""",
    }
    
    prompt = templates.get(task, task)
    print(f"\n✍️ Generating {task} for {business}...\n")
    
    result = call_gemini(prompt, use_search=False)
    
    try:
        data = parse_json(result)
        print(json.dumps(data, indent=2))
        return data
    except json.JSONDecodeError:
        print(result)
        return None


SITUATIONS = {
    "home-based": {
        "label": "Home-based businesses",
        "prompt_extra": "that OPERATE FROM A HOME ADDRESS or residential area",
        "description": "They use their home as their business address on Google — looks unprofessional, limits visibility"
    },
    "service-area": {
        "label": "Service-area businesses",
        "prompt_extra": "that are SERVICE-AREA businesses (they serve customers at their locations, no storefront)",
        "description": "No physical location shown on GBP — missing customers who want to see a real place"
    },
    "no-website": {
        "label": "No website at all",
        "prompt_extra": "that have NO WEBSITE at all (only Facebook or Yelp)",
        "description": "No website means no control over their online presence — completely dependent on Google"
    },
    "low-rating": {
        "label": "Low rating / few reviews",
        "prompt_extra": "with a LOW RATING (under 4.0) or FEW REVIEWS (under 20)",
        "description": "Bad reviews or no reviews = customers choose competitors"
    },
    "fb-only": {
        "label": "Facebook-only presence",
        "prompt_extra": "that ONLY have a Facebook page as their online presence",
        "description": "Facebook page is not a business presence — no GBP, no website, no control"
    },
    "inconsistent-hours": {
        "label": "Inconsistent or missing info",
        "prompt_extra": "with INCOMPLETE Google Business Profiles (missing hours, services, photos, or description)",
        "description": "Incomplete profile = Google doesn't trust them, ranks them lower"
    },
}


def cmd_situation(city, biz_type, situation_key, output=None):
    """Find leads based on a specific 'situation' that causes poor online presence."""
    sit = SITUATIONS.get(situation_key, {})
    if not sit:
        print(f"Unknown situation: {situation_key}")
        print(f"Available: {', '.join(SITUATIONS.keys())}")
        return

    print(f"\n{'='*60}")
    print(f"  SITUATION LEAD FINDER")
    print(f"  {biz_type.title()} in {city}")
    print(f"  Situation: {sit['label']}")
    print(f"{'='*60}\n")
    print(f"  🎯 {sit['description']}\n")

    # Step 1: Find leads matching this situation
    print(f"📡 PHASE 1: Finding {sit['label']}...")
    prompt = f"""Search the web and find 10 {biz_type} businesses in {city} {sit['prompt_extra']}.

These should be REAL, active businesses that are currently operating.
Focus on INDEPENDENT / small operators — not big chains.

For EACH business, return a JSON object with:
- name: business name
- address: full street address
- phone: phone number
- google_rating: their rating (if found)
- review_count: number of Google reviews (if found)
- website_status: "no_website_found" or "facebook_only" or "has_website" or "has_basic_site"
- address_type: "residential" or "commercial" or "unknown" — is their address in a residential area?
- has_google_business_profile: true or false
- situation_match: explain briefly why this business fits the situation
- notes: why they likely need online presence help

Return ONLY a valid JSON array. Only include real businesses you can verify."""

    result = call_gemini(prompt, use_search=True)
    try:
        leads = parse_json(result)
    except json.JSONDecodeError:
        print("Failed to parse leads. Raw:")
        print(result)
        return

    print(f"   Found {len(leads)} leads matching this situation\n")
    time.sleep(1)

    # Step 2: Verify & enrich each lead
    print("📡 PHASE 2: Deep verification (batch)...")
    batch_size = 5
    verified = []

    for batch_start in range(0, len(leads), batch_size):
        batch = leads[batch_start:batch_start + batch_size]
        names = [b.get('name', '?') for b in batch]
        print(f"   Batch {batch_start//batch_size + 1}: {', '.join(names[:3])}... ({len(batch)})")

        v_prompt = f"""Deep-research these {biz_type} businesses in {city}.

For EACH business, I need to know:
1. Do they have a website? What URL?
2. What is their Google rating and review count?
3. Do they have a Google Business Profile?
4. Is their listed address a RESIDENTIAL address (house, apartment, condo) or COMMERCIAL (office, retail)?
5. Do they look like a home-based business?
6. What would help them most — a website, GBP optimization, or both?

Businesses:
{json.dumps(batch, indent=2)}

Return a JSON array where each object has:
- name: business name (exact match)
- has_website: true or false
- website_url: the URL or null
- google_rating: number or null
- review_count: number
- has_google_business_profile: true or false
- address_is_residential: true or false (is the address a home?)
- situation_verified: does this business TRULY match the situation we're looking for? true/false
- biggest_gap: "website" or "gbp" or "both" — what do they need most?
- summary: one-line assessment
- call_angle: one-sentence pitch specific to this business's situation"""

        v_result = call_gemini(v_prompt, use_search=True)
        try:
            v_data = parse_json(v_result)
            for v in v_data:
                for lead in batch:
                    if lead.get('name', '').lower() == v.get('name', '').lower():
                        lead.update(v)
                        break
            verified.extend(batch)
            home_count = sum(1 for l in batch if l.get('address_is_residential'))
            no_site = sum(1 for l in batch if not l.get('has_website'))
            print(f"      ✅ Residential: {home_count} | No website: {no_site}")
        except json.JSONDecodeError:
            print(f"      ⚠️ Parse error, appending raw")
            verified.extend(batch)

        time.sleep(0.5)

    print()

    # Step 3: Score
    print("📡 PHASE 3: Scoring leads...")
    score_prompt = f"""Score these {biz_type} leads 1-10 for likelihood to buy monthly Google Business Profile management + website services.

PRIORITIZE leads that:
- Have RESIDENTIAL addresses (home-based businesses need professional presence most)
- Have NO WEBSITE
- Have LOW RATINGS (under 4.0) or FEW REVIEWS (under 20)
- Are service-area businesses with no physical location

Return JSON array sorted by score descending: [{{"name", "score", "priority": "high/medium/low", "pitch_angle", "reason"}}]

Leads:
{json.dumps(verified, indent=2)}"""

    s_result = call_gemini(score_prompt, use_search=False)
    try:
        scored = parse_json(s_result)
        scored.sort(key=lambda x: x.get('score', 0), reverse=True)
    except json.JSONDecodeError:
        print("   Scoring failed, using verified list")
        scored = verified

    # Step 4: Display
    print(f"\n{'='*60}")
    print(f"  RESULTS — {sit['label']}")
    print(f"  {biz_type.title()} in {city}")
    print(f"{'='*60}\n")

    for i, lead in enumerate(scored, 1):
        name = lead.get('name', '?')
        score = lead.get('score', '?')
        priority = lead.get('priority', 'medium').upper()
        ws = "❌" if not lead.get('has_website') else "✅"
        home = "🏠 HOME" if lead.get('address_is_residential') else "🏢 COMM"
        rating = lead.get('google_rating', '?')
        gap = lead.get('biggest_gap', '?')

        print(f"  {i}. [{priority}] [{ws}] [{home}] {name}")
        print(f"     Score: {score}/10 | Rating: {rating} | Gap: {gap}")
        if lead.get('phone'):
            print(f"     Call: {lead['phone']}")
        if lead.get('call_angle'):
            print(f"     Pitch: {lead['call_angle']}")
        print()

    # Step 5: Save
    if output:
        with open(output, 'w') as f:
            writer = csv.writer(f)
            writer.writerow(["priority", "score", "name", "has_website", "address_type", "rating", "phone", "address", "biggest_gap", "pitch_angle", "situation"])
            for lead in scored:
                addr_type = "residential" if lead.get('address_is_residential') else "commercial"
                writer.writerow([
                    lead.get('priority', 'medium'),
                    lead.get('score', ''),
                    lead.get('name', ''),
                    "no" if not lead.get('has_website') else "yes",
                    addr_type,
                    lead.get('google_rating', ''),
                    lead.get('phone', ''),
                    lead.get('address', ''),
                    lead.get('biggest_gap', ''),
                    lead.get('pitch_angle', lead.get('call_angle', '')),
                    situation_key,
                ])
        print(f"💾 Saved to {output}\n")

    # Store in database (auto-deduplicates)
    run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    new_count = leads_db.store_leads(scored, niche=biz_type, city=city, situation=situation_key, run_id=run_id)
    print(f"📀 Database: {new_count} new leads stored (deduplicated from {len(scored)} found)\n")

    # Summary
    high = sum(1 for l in scored if l.get('priority') == 'high')
    no_site = sum(1 for l in scored if not l.get('has_website'))
    home_biz = sum(1 for l in scored if l.get('address_is_residential'))
    print(f"📊 SUMMARY: {len(scored)} leads | {high} high priority | {no_site} no website | {home_biz} home-based")
    print(f"   Estimated calls: {len(scored)} | Pickups: ~{max(1, len(scored)//5)} | Closes: ~{max(1, len(scored)//50)}")

    return scored


def cmd_pipeline(city, biz_type, output=None, situation_key=None):
    """Full pipeline: research -> verify -> score -> save."""
    
    # If a situation is specified, use the situation command
    if situation_key:
        return cmd_situation(city, biz_type, situation_key, output)
    
    print(f"\n{'='*60}")
    print(f"  STEALTHO LEAD PIPELINE")
    print(f"  {biz_type.title()} in {city}")
    print(f"{'='*60}\n")
    
    # Step 1: Research — find businesses that NEED help
    print("📡 PHASE 1: Finding leads without websites...")
    prompt = f"""Search the web and find 10 {biz_type} businesses in {city} that:
1. Are real, active businesses (still open)
2. Do NOT have a proper website (or only have a Facebook page)
3. Have a Google Business Profile with reviews

Focus on finding SMALL businesses — not the big chains or established companies.
Look for the mom-and-pop shops, independent operators, smaller teams.

For each business, return:
- name: business name
- address: full street address  
- phone: phone number
- google_rating: their rating (if found)
- review_count: number of reviews
- website_status: "no_website_found" or "facebook_only" or "has_website"
- notes: why this business likely needs online presence help

Return ONLY a JSON array. Only include real businesses you can verify."""
    
    
    result = call_gemini(prompt, use_search=True)
    try:
        leads = parse_json(result)
    except json.JSONDecodeError:
        print("Failed to parse leads. Raw:")
        print(result)
        return
    
    print(f"   Found {len(leads)} leads\n")
    time.sleep(1)
    
    # Step 2: Verify each lead (batched for speed)
    print("📡 PHASE 2: Verifying websites & GBP status (batch)...")
    
    # Batch into groups of 5
    batch_size = 5
    verified = []
    
    for batch_start in range(0, len(leads), batch_size):
        batch = leads[batch_start:batch_start + batch_size]
        names = [b.get('name', '?') for b in batch]
        
        print(f"   Batch {batch_start//batch_size + 1}: {', '.join(names[:3])}... ({len(batch)} businesses)")
        
        v_prompt = f"""Research these {len(batch)} businesses in {city}.
For EACH business, tell me: do they have a website? What's their Google rating?
Return a JSON array. One object per business.

Businesses to research:
{json.dumps(batch, indent=2)}

Return ONLY a JSON array where each object has:
- name: business name (exact match)
- has_website: true or false
- website_url: the URL or null
- google_rating: number or null
- review_count: number
- has_google_business_profile: true or false
- summary: one-line assessment"""
        
        v_result = call_gemini(v_prompt, use_search=True)
        try:
            v_data = parse_json(v_result)
            # Merge verification data back into leads
            for v in v_data:
                for lead in batch:
                    if lead.get('name', '').lower() == v.get('name', '').lower():
                        lead.update(v)
                        break
            verified.extend(batch)
            ws_count = sum(1 for l in batch if not l.get('has_website'))
            print(f"      ✅ Done — {ws_count} without websites")
        except json.JSONDecodeError:
            print(f"      ⚠️ Parse error on batch, appending raw")
            verified.extend(batch)
        
        time.sleep(0.5)  # Rate limit breathing room
    
    print()
    
    # Step 3: Score
    print("📡 PHASE 3: Scoring leads...")
    score_prompt = f"""Score these leads 1-10 for likelihood to buy GBP management.
9-10 = no website, low rating. Return JSON array: [{{"name": "...", "score": N, "priority": "high/medium/low", "pitch_angle": "..."}}]

Leads: {json.dumps(verified, indent=2)}"""
    
    s_result = call_gemini(score_prompt, use_search=False)
    try:
        scored = parse_json(s_result)
        scored.sort(key=lambda x: x.get('score', 0), reverse=True)
    except:
        scored = verified
        print("   Scoring failed, using raw list")
    
    # Step 4: Display results
    print(f"\n{'='*60}")
    print(f"  FINAL LEAD LIST — CALL ORDER")
    print(f"{'='*60}\n")
    
    for i, lead in enumerate(scored, 1):
        name = lead.get('name', '?')
        score = lead.get('score', '?')
        priority = lead.get('priority', 'medium').upper()
        ws = "❌" if not lead.get('has_website') else "✅"
        rating = lead.get('google_rating', '?')
        
        print(f"  {i}. [{priority}] [{ws}] {name}")
        print(f"     Score: {score}/10 | Rating: {rating} | {lead.get('address', '')}")
        if lead.get('phone'):
            print(f"     Call: {lead['phone']}")
        if lead.get('pitch_angle'):
            print(f"     Pitch: {lead['pitch_angle']}")
        print()
    
    # Step 5: Save
    if output:
        with open(output, 'w') as f:
            writer = csv.writer(f)
            writer.writerow(["priority", "score", "name", "has_website", "rating", "phone", "address", "pitch_angle"])
            for lead in scored:
                writer.writerow([
                    lead.get('priority', 'medium'),
                    lead.get('score', ''),
                    lead.get('name', ''),
                    "no" if not lead.get('has_website') else "yes",
                    lead.get('google_rating', ''),
                    lead.get('phone', ''),
                    lead.get('address', ''),
                    lead.get('pitch_angle', ''),
                ])
        print(f"💾 Saved to {output}\n")
    
    # Store in database (auto-deduplicates)
    run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    new_count = leads_db.store_leads(scored, niche=biz_type, city=city, run_id=run_id)
    print(f"📀 Database: {new_count} new leads stored (deduplicated from {len(scored)} found)\n")
    
    # Summary
    high = sum(1 for l in scored if l.get('priority') == 'high')
    no_site = sum(1 for l in scored if not l.get('has_website'))
    print(f"📊 SUMMARY: {len(scored)} leads | {high} high priority | {no_site} without websites")
    print(f"   Estimated calls needed: {len(scored)}")
    print(f"   Estimated pickups (20%): {max(1, len(scored)//5)}")
    print(f"   Estimated closes (10% of pickups): {max(1, len(scored)//50)}")
    
    return scored


# ─── CLI ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="StealthO Gemini Agent")
    sub = parser.add_subparsers(dest="command")
    
    # leads
    p_leads = sub.add_parser("leads", help="Find leads in a city")
    p_leads.add_argument("--city", required=True)
    p_leads.add_argument("--type", required=True, help="Business type (plumbers, barbers, etc)")
    
    # verify
    p_verify = sub.add_parser("verify", help="Verify a specific business")
    p_verify.add_argument("--business", required=True)
    p_verify.add_argument("--city", required=True)
    
    # score
    p_score = sub.add_parser("score", help="Score leads from JSON or CSV")
    p_score.add_argument("--file", help="CSV/JSON file with leads")
    p_score.add_argument("--json", help="Inline JSON array of leads")
    
    # content
    p_content = sub.add_parser("content", help="Generate content")
    p_content.add_argument("--task", required=True, choices=["weekly-posts", "website-homepage", "review-request"])
    p_content.add_argument("--business", required=True)
    p_content.add_argument("--city")
    p_content.add_argument("--count", type=int, default=4)
    
    # pipeline
    p_pipe = sub.add_parser("pipeline", help="Full research -> verify -> score pipeline")
    p_pipe.add_argument("--city", required=True)
    p_pipe.add_argument("--type", required=True)
    p_pipe.add_argument("--output", help="Save results to CSV")
    p_pipe.add_argument("--situation", help=f"Lead situation to target: {', '.join(SITUATIONS.keys())}")
    
    # situation
    p_sit = sub.add_parser("situation", help="Find leads by specific situation (home-based, no website, etc)")
    p_sit.add_argument("--city", required=True)
    p_sit.add_argument("--type", required=True)
    p_sit.add_argument("--situation", required=True, choices=list(SITUATIONS.keys()),
                       help=f"One of: {', '.join(SITUATIONS.keys())}")
    p_sit.add_argument("--output", help="Save results to CSV")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        print("\nExample:")
        print('  python gemini-tool.py pipeline --city "Austin" --type "plumbers" --output leads.csv')
        print('  python gemini-tool.py verify --business "Ace Plumbing" --city "Austin"')
        print('  export GEMINI_API_KEY="your-key"')
        return
    
    if args.command == "leads":
        cmd_leads(args.city, args.type)
    elif args.command == "verify":
        cmd_verify(args.business, args.city)
    elif args.command == "score":
        if args.file:
            with open(args.file) as f:
                if args.file.endswith(".json"):
                    leads = json.load(f)
                else:
                    leads = list(csv.DictReader(f))
            cmd_score(leads)
        elif args.json:
            cmd_score(json.loads(args.json))
        else:
            print("Provide --file or --json")
    elif args.command == "content":
        cmd_content(args.task, args.business, args.city, args.count)
    elif args.command == "pipeline":
        cmd_pipeline(args.city, args.type, args.output, args.situation)
    elif args.command == "situation":
        cmd_situation(args.city, args.type, args.situation, args.output)


if __name__ == "__main__":
    main()
