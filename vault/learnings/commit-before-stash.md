---
created: 2026-06-01
status: active
tags: [learning, git, workflow]
source: "[[../cycles/2026-06-01_nextcut-initial-setup|Initial Setup Cycle]]"
---

# Commit Before Stash

## What Happened

During the initial setup, I stashed changes to switch branches, but the stash operation lost untracked NextCut files (the entire `src/` directory with all components, pages, and config files). Had to re-copy from the source.

## Root Cause

`git stash -u` includes untracked files, but when popping the stash onto a different branch where some files already exist with the same name, git can't restore them cleanly. The stash kept the changes but the untracked files were silently dropped.

## The Fix

1. Always commit before switching branches — never rely on stash for moving code between branches
2. When moving code between repos/branches: commit first, then cherry-pick or merge
3. If you must stash, verify files were restored immediately after pop

## Folded Into

- [x] Updated directives: added "commit before branch switch"
- [ ] Updated boilerplate
- [x] Updated vault: this entry
- [ ] New automation
