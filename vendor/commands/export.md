---
description: Export issues to JSONL format
argument-hint: [-o output-file]
---

Export all issues to JSON Lines format (one JSON object per line).

## Usage

- **To stdout**: `br export`
- **To file**: `br export -o issues.jsonl`
- **Filter by status**: `br export --status open`

Issues are sorted by ID for consistent diffs, making git diffs readable.

## When to Use

SQLite is the primary storage backend, so manual export is rarely needed. Use `br export` when you need:
- A JSONL snapshot for backup
- Data migration to another system
- Sharing issues outside the Dolt workflow
