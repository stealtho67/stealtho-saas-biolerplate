# StealthO Vault — The Compounding Brain

**This is the second brain of StealthO.** Every idea, every factory run, every lesson learned, every bet made — it all lives here. PRIME reads this first every session and writes back every meaningful change.

> 🔥 **New ideas → implementations → more ideas → build offs → compound.**

The vault is designed for **daily use in Obsidian**. Open it every morning. Read the dashboard. See what's active. Then give PRIME your next one-liner.

---

## Structure

```
vault/                              ← 📂 OPEN THIS IN OBSIDIAN
├── _dashboard.md                   ← 🏠 HOME — active products, cycles, bets
├── README.md                       ← You are here
│
├── ideas/                          # 💡 Every idea (active, completed, killed)
│   ├── _template.md                #    Use this for every new idea
│   └── nextcut.md                  #    Seed entry: NextCut
│
├── cycles/                         # 🔧 Every factory run, timestamped
│   └── YYYY-MM-DD_{idea}.md        #    Full lifecycle: verdict → build → deploy
│
├── learnings/                      # 📚 Patterns that compound
│   ├── _template.md
│   └── commit-before-stash.md      #    Seed entry
│
├── bets/                           # 🎯 Trend bets — logged, tracked, learned from
│   ├── _template.md
│   └── ai-scheduling.md            #    Seed entry
│
├── metrics/                        # 📊 North star metrics per product
│   └── _template.md                #    (populate when product launches)
│
└── _reference/                     # 📖 Historical knowledge (Claude vault import)
    └── README.md                   #    Import guide — dump your Claude vault here
```

## How the Vault Compounds

```
DAY 1:  Kendall says "build me X"
        → PRIME validates, brands, builds, deploys, logs → vault/cycles/
        → Folds learnings into vault/learnings/ and the boilerplate

DAY 2:  vault/learnings/ makes the next build faster
        → vault/ideas/ seeds new ideas that build off previous ones
        → vault/bets/ tracks where the market is going

DAY 30: The vault is 30+ entries deep
        → Patterns emerge across cycles
        → The boilerplate has compound improvements from every cycle
        → PRIME references vault/_reference/ for historical context
```

## Rules

1. **Read the vault first.** Every session starts here. Check what's already been tried.
2. **Write back everything.** Every factory run, every decision, every failure.
3. **Compound.** If a lesson repeats, it becomes a directive. If a pattern works, it becomes part of the boilerplate.
4. **Truth only.** No fake metrics, no inflated numbers. Real data or nothing.
5. **Link everything.** Every PR, every deployment, every bet — link back to its vault entry.
6. **Reference is frozen.** The `_reference/` directory is historical context only — never edited.
