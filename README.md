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

## Attribution

Forked from [`opencode-beads`](https://github.com/joshuadavidthomas/opencode-beads) (MIT, by Josh Thomas). This fork swaps the `bd` Python CLI for `br` (beads_rust).

## License

MIT
