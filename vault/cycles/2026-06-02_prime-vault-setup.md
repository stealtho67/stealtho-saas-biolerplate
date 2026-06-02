---
created: 2026-06-02
status: complete
tags: [cycle, prime, vault, infrastructure]
idea: "[[../ideas/nextcut|NextCut]]"
---

# Cycle: PRIME System + Obsidian Vault Setup

> **Objective:** Wire PRIME co-founder intelligence into the repo + build an Obsidian-ready vault for compounding memory
> **Run by:** PRIME
> **Duration:** 1 session

---

## Stages

### ✅ Validate
- PRIME persona validated: Kendall wants a co-founder, not a chatbot
- Vault concept validated: read-first, write-back, compound every cycle
- Reference system: old Claude vault imported frozen as building-block context

### ✅ Name + Brand
- PRIME — the co-founder intelligence
- Factory Loop — the build engine
- The Vault — the compounding brain

### ✅ Build
- `PRIME.md` — master program (persona, factory loop, vault structure, rules)
- `.openhands/StealthO_Directives.md` — rewritten as PRIME operating rules
- `.openhands/StealthO_Context.md` — rewritten with full venture studio context
- `AGENTS.md` — updated for any agent joining fresh
- `vault/` — full Obsidian-ready structure with YAML frontmatter, wikilinks, tags

### ✅ Vault Structure (16 files)

| Module | Files | Purpose |
|--------|-------|---------|
| `.obsidian/` | 5 | Config pre-set (gold theme, wikilinks, plugins) |
| `_dashboard.md` | 1 | Home — active products, cycles, bets |
| `ideas/` | 2 | Template + NextCut seed |
| `cycles/` | 2 | Initial setup + this cycle |
| `learnings/` | 2 | Template + commit-before-stash |
| `bets/` | 2 | Template + AI scheduling bet |
| `metrics/` | 1 | Template (ready for data) |
| `_reference/` | 1 | Import guide for Claude vault |

### ✅ Deploy
- Merged `scaffold-stealtho-boilerplate` into `main` (4b7b193)
- GitHub `main` now shows all 233 files — full app + PRIME + vault
- Ready for Kendall to open `vault/` in Obsidian

### 🔄 Grow
- `_reference/` ready for Claude vault import
- Daily use in Obsidian starts now

### ✅ Measure + Compound
- Vault has compounding structure — every cycle adds depth
- Learnings fold back into boilerplate
- Next cycle will ship faster than this one

---

## Deliverables

| Artifact | Status |
|----------|--------|
| ✅ PRIME.md | Master program written |
| ✅ Directives + Context | Rewritten as PRIME OS |
| ✅ Obsidian vault | 16 files, pre-configured |
| ✅ Main branch | Fully loaded (233 files) |
| 🔄 Claude vault import | Awaiting Kendall's copy into `vault/_reference/` |

## Learnings

- `main` had unrelated history from scaffold branch — needed `--allow-unrelated-histories`
- Obsidian vault config is simple: just `.obsidian/` JSON files + markdown
- Wikilinks should use relative paths (`[[ideas/nextcut]]`) for cross-vault compatibility

## Next Steps

1. Kendall imports Claude vault into `vault/_reference/`
2. Give PRIME a one-line idea to run through the factory
