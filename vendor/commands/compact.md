---
description: Compact old closed issues using semantic summarization
argument-hint: [--all] [--id issue-id] [--dry-run]
---

Reduce database size by summarizing closed issues no longer actively referenced.

## Compaction Tiers

- **Tier 1**: Semantic compression (30+ days closed, ~70% size reduction)
- **Tier 2**: Ultra compression (90+ days closed, ~95% size reduction)

## Usage

- **Preview candidates**: `br admin compact --dry-run`
- **Compact all eligible**: `br admin compact --all`
- **Compact specific issue**: `br admin compact --id br-42`
- **Force compact**: `br admin compact --id br-42 --force` (bypass age checks)
- **View statistics**: `br admin compact --stats`

## Options

- **--tier**: Choose compaction tier (1 or 2, default: 1)
- **--workers**: Parallel workers (default: 5)
- **--batch-size**: Issues per batch (default: 10)

## Important

This is **permanent graceful decay** - original content is discarded. Use `br restore <id>` to view full history from git if needed.

Useful for long-running projects to keep database size manageable.
