---
description: Import issues from JSONL format (removed)
argument-hint: (removed)
---

`br import` has been **removed**.

## Migration

If you need to import issues from a JSONL file, use `br init` with the `--from-jsonl` flag:

```bash
br init <prefix> --from-jsonl issues.jsonl
```

## Note

SQLite is the primary storage backend. Manual JSONL import is no longer supported as a standalone command.
