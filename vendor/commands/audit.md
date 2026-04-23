---
description: Log and label agent interactions (append-only JSONL)
argument-hint: record|label
---

Append-only audit logging for agent interactions (prompts, responses, tool calls) in `.beads/interactions.jsonl`.

Each line is one event. Labeling is done by appending a new `"label"` event referencing a previous entry.

## Usage

- **Record an interaction**:
  - `br audit record --kind llm_call --model "claude-3-5-haiku" --prompt "..." --response "..."`
  - `br audit record --kind tool_call --tool-name "go test" --exit-code 1 --error "..." --issue-id br-42`

- **Pipe JSON via stdin**:
  - `cat event.json | br audit record`

- **Label an entry**:
  - `br audit label int-a1b2 --label good --reason "Worked perfectly"`
  - `br audit label int-a1b2 --label bad --reason "Hallucinated a file path"`

## Notes

- Audit entries are **append-only** (no in-place edits).
- `.beads/interactions.jsonl` is included when you run `br sync --flush-only` and commit `.beads/`.


