---
description: Search issues by text query
argument-hint: <query> [--status] [--label] [--assignee]
---

Search issues across title, description, and ID with a simple text query.

**Note:** The `search` command is optimized for quick text searches and uses less context than `list` when accessed via MCP. For advanced filtering options, use `br list`.

## Basic Usage

```bash
br search "authentication bug"
br search login --status open
br search database --label backend
br search "br-5q"  # Search by partial issue ID
```

## How It Works

The search command finds issues where your query appears in **any** of:
- Issue title
- Issue description
- Issue ID (supports partial matching)

Unlike `br list`, which requires you to specify which field to search, `br search` automatically searches all text fields, making it faster and more intuitive for exploratory searches.

## Filters

- **--status, -s**: Filter by status (open, in_progress, blocked, closed)
- **--assignee, -a**: Filter by assignee
- **--type, -t**: Filter by type (bug, feature, task, epic, chore, decision)
- **--label, -l**: Filter by labels (must have ALL specified labels)
- **--label-any**: Filter by labels (must have AT LEAST ONE)
- **--limit, -n**: Limit number of results (default: 50)
- **--sort**: Sort by field: priority, created, updated, closed, status, id, title, type, assignee
- **--reverse, -r**: Reverse sort order
- **--long**: Show detailed multi-line output for each issue
- **--json**: Output results in JSON format

## Examples

### Basic Search
```bash
# Find all issues mentioning "auth" or "authentication"
br search auth

# Search for performance issues
br search performance --status open

# Find database-related bugs
br search database --type bug
```

### Filtered Search
```bash
# Find open backend issues about login
br search login --status open --label backend

# Search Alice's tasks for "refactor"
br search refactor --assignee alice --type task

# Find recent bugs (limited to 10 results)
br search bug --status open --limit 10
```

### Sorted Output
```bash
# Search bugs sorted by priority (P0 first)
br search bug --sort priority

# Search features sorted by most recently updated
br search feature --sort updated

# Search issues sorted by priority, lowest first
br search refactor --sort priority --reverse
```

### JSON Output
```bash
# Get JSON results for programmatic use
br search "api error" --json

# Use with jq for advanced filtering
br search memory --json | jq '.[] | select(.priority <= 1)'
```

## Comparison with br list

| Command | Best For | Default Limit | Context Usage |
|---------|----------|---------------|---------------|
| `br search` | Quick text searches, exploratory queries | 50 | Low (efficient for LLMs) |
| `br list` | Advanced filtering, precise queries | None | High (all results) |

**When to use `br search`:**
- You want to find issues quickly by keyword
- You're exploring the issue database
- You're using an LLM/MCP and want to minimize context usage

**When to use `br list`:**
- You need advanced filters (date ranges, priority ranges, etc.)
- You want all results without a limit
- You need special output formats (digraph, dot)
