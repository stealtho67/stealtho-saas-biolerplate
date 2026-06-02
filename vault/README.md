# StealthO Vault -- The Compounding Brain

**This is the second brain of StealthO.** Every idea, every factory run, every lesson learned, every bet made -- it all lives here. PRIME reads this first every session and writes back every meaningful change.

New ideas spark implementations, which spark more ideas, which build off each other and compound.

The vault is designed for **daily use in Obsidian**. Open it every morning. Read the dashboard. See what's active. Then give PRIME your next one-liner.

---

## Structure (28 files across 10 modules)

```
vault/                              <- OPEN THIS IN OBSIDIAN
├── _dashboard.md                   <- HOME - active products, cycles, vault state
├── README.md                       <- You are here
│
├── ideas/                          # Every idea (active, completed, killed)
│   ├── _template.md                #   Use this for every new idea
│   └── nextcut.md                  #   NextCut - full spec, brand, validation
│
├── cycles/                         # Every factory run, timestamped
│   ├── 2026-06-01_nextcut-init     #   Initial setup: merge, config, skills
│   └── 2026-06-02_prime-vault      #   PRIME system + vault buildout
│
├── learnings/                      # Patterns that compound
│   ├── _template.md
│   ├── commit-before-stash.md      #   Git workflow lesson
│   └── documentation-compounds.md  #   Vault must have substance day 1
│
├── bets/                           # Trend bets - logged, tracked, learned
│   ├── _template.md
│   └── ai-scheduling.md            #   AI replaces booking software (12mo)
│
├── metrics/                        # North star metrics per product
│   ├── _template.md
│   └── nextcut.md                  #   Full framework: north star, leading, lagging
│
├── _reference/                     # Historical knowledge (Claude vault import)
│   └── README.md                   #   Import guide
│
│=== CODABASE KNOWLEDGE ===         # Auto-generated codebase documentation
│
├── architecture/
│   └── overview.md                 #   System layers, route structure, data flow
│
├── src/
│   ├── pages/pages-index.md        #   All 20+ pages documented
│   ├── components/components-index.md  # 30+ components organized by domain
│   ├── lib/lib-index.md            #   Core libraries with code patterns
│   ├── hooks/hooks-index.md        #   Custom hooks
│   └── conventions.md              #   Naming, imports, state, error patterns
│
├── base44/
│   └── overview.md                 #   Entities, functions, agents, relationships
│
├── database/
│   └── schema.md                   #   Tables, RLS policies, indexes, query patterns
│
├── api/
│   └── overview.md                 #   Netlify functions, Stripe, webhooks
│
├── ui/
│   └── component-library.md        #   50+ shadcn/ui components organized by type
│
└── operations/
    └── guide.md                    #   Dev, build, deploy, CI/CD, env vars
```

## How the Vault Compounds

```
DAY 1:  Kendall says "build me X"
        -> PRIME validates, brands, builds, deploys, logs -> vault/cycles/
        -> Folds learnings into vault/learnings/ and the boilerplate

DAY 2:  vault/learnings/ makes the next build faster
        -> vault/ideas/ seeds new ideas that build off previous ones
        -> vault/bets/ tracks where the market is going

DAY 30: The vault is 30+ entries deep
        -> Patterns emerge across cycles
        -> The boilerplate has compound improvements from every cycle
        -> PRIME references vault/_reference/ for historical context
```

## Rules

1. **Read the vault first.** Every session starts here. Check what's already been tried.
2. **Write back everything.** Every factory run, every decision, every failure.
3. **Compound.** If a lesson repeats, it becomes a directive. If a pattern works, it becomes part of the boilerplate.
4. **Truth only.** No fake metrics, no inflated numbers. Real data or nothing.
5. **Link everything.** Every PR, every deployment, every bet -- link back to its vault entry.
6. **Reference is frozen.** The `_reference/` directory is historical context only -- never edited.
