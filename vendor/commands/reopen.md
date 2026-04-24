---
description: Reopen closed issues
argument-hint: [issue-ids...] [--reason]
---

Reopen one or more closed issues.

Sets status to 'open' and clears the closed_at timestamp. Emits a Reopened event.

## Usage

- **Reopen single**: `br reopen br-42`
- **Reopen multiple**: `br reopen br-42 br-43 br-44`
- **With reason**: `br reopen br-42 --reason "Found regression"`

More explicit than `br update --status open` - specifically designed for reopening workflow.

Common reasons for reopening:
- Regression found
- Requirements changed
- Incomplete implementation
- New information discovered
