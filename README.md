# opencode-beads-rust

OpenCode plugin for beads issue tracking via the `br` (beads_rust) CLI.

## Requirements

- [`br` (beads_rust)](https://github.com/Dicklesworthstone/beads_rust#installation) binary on `PATH`
- Node >= 20

## Install

```bash
npm i -D @technoch1ef/opencode-beads-rust
```

Then add to your `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["@technoch1ef/opencode-beads-rust"]
}
```

Restart OpenCode and you're ready to go.

## Features

- **Context injection** — Automatically runs `br prime` on session start and after compaction, keeping your agent aware of current issues
- **Commands** — All beads operations available as `/beads:*` slash commands
- **Task agent** — Autonomous issue completion via the `beads-task-agent` subagent

## Options

Pass options using the tuple form of the plugin entry:

```json
{
  "plugin": [
    ["@technoch1ef/opencode-beads-rust", { "inject": ["mayor", "worker", "guard", "inspector", "envoy"] }]
  ]
}
```

### `inject`

Controls which agents receive beads context injection (`br prime` output + CLI
guidance) at session start and after compaction:

- `"primary"` (default) — inject for all primary/all-mode agents; subagents
  (`explore`, `general`, ...) are always skipped
- `"none"` — never inject
- `string[]` — inject **only** for the listed agent names; all other agents
  (including primary ones like `build` and `plan`) stay beads-unaware

The plugin's own `beads-task-agent` always receives context. Slash commands and
the task agent are registered regardless of this option.

Use the allowlist form when beads should be scoped to a dedicated set of agents
(e.g. the [opencode-village](https://github.com/technoch1ef/opencode-village)
roles) while keeping general-purpose agents free of issue-tracker context.

## Attribution

Forked from [`opencode-beads`](https://github.com/joshuadavidthomas/opencode-beads) (MIT, by Josh Thomas). This fork swaps the `bd` Python CLI for `br` (beads_rust).

## License

MIT
