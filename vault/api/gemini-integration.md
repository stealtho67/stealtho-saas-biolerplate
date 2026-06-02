---
created: 2026-06-02
status: active
tags: [gemini, ai, lead-gen, automation]
---

# Gemini AI Agent — Integration

> Gemini is now a StealthO agent for lead research, verification, and content generation.

## How It Works

```
You say: "Find me plumbers in Austin without websites"

PRIME runs: python3 gemini-tool.py pipeline --city "Austin" --type "plumbers" --output leads.csv

Gemini does:
  1. Searches the web for real plumbers in Austin
  2. Verifies each one: website, GBP, rating, reviews
  3. Scores them by likelihood to buy (1-10)
  4. Writes a specific pitch angle for each
  5. Exports to CSV ready for calling
```

## Commands

```bash
# Full pipeline (find + verify + score + export)
python3 gemini-tool.py pipeline --city "Austin" --type "plumbers" --output leads.csv

# Check one business before calling
python3 gemini-tool.py verify --business "Ace Plumbing" --city "Austin"

# Generate GBP content 
python3 gemini-tool.py content --task weekly-posts --business "Austin Barbershop"

# Daily automated (rotates niches)
bash daily-leads.sh "Austin" "plumbers"
bash daily-leads.sh "Austin"              # auto-rotates niche by day of week
```

## Daily Niche Rotation

| Day | Niche | 
|-----|-------|
| Monday | Barbers |
| Tuesday | Plumbers |
| Wednesday | Electricians |
| Thursday | Dentists |
| Friday | Chiropractors |
| Saturday | Auto mechanics |
| Sunday | Restaurants |

## Example Output

```
1. [HIGH] [NO WEBSITE] Plumb Papi
   Score: 9/10 | Rating: 3.9 | 4 reviews
   Pitch: Your 3.9 rating with only 4 reviews and Facebook-only 
   presence means you're losing customers. We can fix that.

2. [HIGH] [NO WEBSITE] Confidence Plumbing
   Score: 9/10 | Rating: ? | New business
   Pitch: Operating since 2004 but invisible on Google. 
   Let's get you found.
```

## Files

| File | Purpose |
|------|---------|
| `gemini-tool.py` | Main Gemini agent CLI tool |
| `daily-leads.sh` | Daily autonomous lead gen runner |
| `.env` | Your Gemini API key (gitignored) |
| `leads/` | Daily lead CSV outputs (gitignored) |
| `.agents/skills/gemini-lead-agent/SKILL.md` | Agent skill definition |
