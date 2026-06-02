---
created: 2026-06-01
status: reference
tags: [reference, import, claude, knowledge-base]
---

# Reference — Historical Knowledge Base

> **Purpose:** This directory holds imported knowledge from previous systems — read for context, not actively edited.
> **Source:** Kendall's Claude vault (previous AI conversations, system designs, prompts, learnings)

## What Goes Here

This is a **read-only knowledge base**. It contains the historical brain of StealthO — all the conversations, prompts, system designs, and learnings that led to this point.

## How to Use

- **PRIME reads this** for context before making major decisions
- **Do NOT edit** these files — they're frozen reference
- **If something is useful**, fold it into an active vault file (`learnings/`, `directives/`, etc.) and link back using `[[_reference/source-file]]`

## Importing

Drop your Claude vault files into this directory:

```
vault/_reference/
├── README.md               ← You are here
├── system-prompts/         ← Claude system prompts & personas
├── project-plans/          ← Past project architecture & specs
├── conversations/          ← Key conversation exports
├── learnings/              ← Historical lessons & patterns
└── archive/                ← Everything else
```

## Index of Imported Reference

| File | Source | Date | Summary |
|------|--------|------|---------|
| *(add files here as imported)* | | | |

---

*This directory is excluded from the active factory loop. It exists for context and compounding only.*
