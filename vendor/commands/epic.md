---
description: Epic management commands
argument-hint: [command]
---

Manage epics (large features composed of multiple issues).

## Available Commands

- **status**: Show epic completion status
  - Shows progress for each epic
  - Lists child issues and their states
  - Calculates completion percentage

- **close-eligible**: Close epics where all children are complete
  - Automatically closes epics when all child issues are done
  - Useful for bulk epic cleanup

## Epic Workflow

1. Create epic: `br create "Large Feature" -t epic -p 1`
2. Link subtasks: `br dep add br-20 br-10 --type parent-child` (task br-20 is child of epic br-10)
   - Or at creation: `br create "Subtask title" -t task --parent br-10`
3. Track progress: `br epic status`
4. Auto-close when done: `br epic close-eligible`

Epics use parent-child dependencies to track subtasks.
