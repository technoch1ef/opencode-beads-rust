---
description: Export issues to JSONL — must be followed by manual git commit
argument-hint: [--flush-only]
---

`br sync --flush-only` exports issues from the SQLite database to `.beads/` JSONL files.

**Note:** `br` is non-invasive and never executes git commands. After `br sync --flush-only`, you must manually run `git add .beads/ && git commit`.

## Usage

```bash
br sync --flush-only
git add .beads/
git commit -m "sync beads"
```

## Why `--flush-only`

The `--flush-only` flag exports the database to JSONL without launching a background daemon or running git. This is the correct mode for agent and CI workflows.

## Session Close Protocol

Run this before ending any session:

```bash
git status
git add <files>
br sync --flush-only
git add .beads/
git commit -m "sync beads"
```
