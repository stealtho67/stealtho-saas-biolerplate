#!/usr/bin/env python3
"""
StealthO Gemini Agent — Lead Research & Verification System

Usage:
  export GEMINI_API_KEY="your-key"

  # Find leads in a city
  python gemini-tool.py leads --city "Austin" --type "plumbers"

  # Verify a specific business
  python gemini-tool.py verify --business "Ace Plumbing" --city "Austin"

  # Score a lead list from CSV
  python gemini-tool.py score --file leads.csv

  # Generate GBP content
  python gemini-tool.py content --task weekly-posts --business "Austin Barbershop"

  # Full pipeline: research → verify → score
  python gemini-tool.py pipeline --city "Austin" --type "plumbers" --output leads.csv
"""

import os, sys, json, csv, time, argparse
from datetime import datetime

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
    """Extract JSON from Gemini response (it loves markdown fences)."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        text = text.rsplit("```", 1)[0]
    if text.startswith("json"):
        text = text[4:].strip()
    return json.loads(text)


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


def cmd_pipeline(city, biz_type, output=None):
    """Full pipeline: research → verify → score → save."""
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
    p_pipe = sub.add_parser("pipeline", help="Full research → verify → score pipeline")
    p_pipe.add_argument("--city", required=True)
    p_pipe.add_argument("--type", required=True)
    p_pipe.add_argument("--output", help="Save results to CSV")
    
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
        cmd_pipeline(args.city, args.type, args.output)


if __name__ == "__main__":
    main()
