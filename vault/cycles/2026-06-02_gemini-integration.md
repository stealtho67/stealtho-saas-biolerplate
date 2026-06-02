---
created: 2026-06-02
status: complete
tags: [cycle, gemini, ai, lead-gen, integration]
idea: "[[../ideas/local-presence-agency|Local Presence Agency]]"
---

# Cycle: Gemini AI Agent Integration

> **Objective:** Wire Gemini API into StealthO as a lead research and verification agent
> **Run by:** PRIME
> **Duration:** 1 session
> **Outcome:** Gemini can find real businesses, verify websites, score leads, and export calling lists

---

## Stages

### ✅ Validate
- Gemini API key provided by Kendall (Plus plan, $10 credit)
- Need: verify businesses BEFORE calling — never call someone with a website
- Need: scored lead lists with specific pitch angles
- **Verdict: GO — build full agent system**

### ✅ Build

| Component | What It Does |
|-----------|-------------|
| `gemini-tool.py` | CLI tool: leads, verify, score, content, pipeline |
| `daily-leads.sh` | Daily autonomous runner with niche rotation |
| `.agents/skills/gemini-lead-agent/SKILL.md` | Agent skill definition |
| `.env` | API key storage (gitignored) |
| `vault/api/gemini-integration.md` | Full documentation |

### ✅ Tested (Live)
- `verify` command: searches web for business, returns website/GBP status
- `pipeline` command: finds 10 leads, verifies in batches, scores, exports CSV
- Found 2 high-priority leads in Austin without websites
- Generated specific pitch angles for each

### 🔄 Deploy
- Tool lives in repo root — available to PRIME every session
- Daily leads script ready — run `bash daily-leads.sh` each morning
- Leads export to `leads/` folder (gitignored)

### 🔄 Grow
- Next: integrate Google Places API for even more accurate lead finding
- Next: auto-generate GBP content for new clients
- Next: auto-follow-up emails for leads that said "think about it"

---

## Deliverables

| Artifact | Status |
|----------|--------|
| ✅ `gemini-tool.py` | Full CLI tool with 5 commands |
| ✅ `daily-leads.sh` | Autonomous daily runner |
| ✅ Gemini agent skill | Registered in StealthO |
| ✅ Documentation | Vault entry + skill definition |
| ✅ Tested with real data | Found real leads in Austin |

## What Gemini Can Do Now

| Task | Command | Real-time? |
|------|---------|-----------|
| Research leads in any city | `pipeline --city X --type Y` | ✅ Web search |
| Verify one business | `verify --business X --city X` | ✅ Web search |
| Score leads | `score --file leads.csv` | ✅ AI analysis |
| Write GBP posts | `content --task weekly-posts` | ✅ AI generation |
| Write website copy | `content --task website-homepage` | ✅ AI generation |
| Daily rotation | `bash daily-leads.sh` | ✅ Auto-rotates niche |

## API Key Stored In
- `.env` file (gitignored — safe)
- Export `GEMINI_API_KEY` env var for PRIME sessions

## Learnings
- `gemini-2.0-flash` is deprecated — use `gemini-2.5-flash`
- Batch verification (5 businesses per call) is 5x faster than one-by-one
- Finding businesses WITHOUT websites requires specific prompting — Gemini naturally finds established businesses first
- Scoring step sometimes fails under high demand — retry logic added

## Next Steps
1. Kendall runs `bash daily-leads.sh` tomorrow morning
2. Starts calling from the scored list
3. Logs results back to vault
4. After 10+ clients: upgrade to Google Places API for precision lead finding
