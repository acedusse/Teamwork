# Task Master File Formats

This document describes the structure of the core files used by Task Master. It is intended for developers who need to read or generate these files programmatically.

## tasks.json

`tasks.json` is the primary database for all tasks. The file contains a single object with a `tasks` array. Each task has at minimum the following fields:

- `id` *(number)* – unique numeric identifier
- `title` *(string)* – short description
- `description` *(string)* – detailed explanation of the task
- `status` *(string)* – current status (`pending`, `in-progress`, `done`, etc.)
- `priority` *(string)* – priority level
- `dependencies` *(number[])* – list of IDs this task depends on
- `details` *(string, optional)* – implementation notes
- `testStrategy` *(string, optional)* – how the task is verified
- `subtasks` *(array, optional)* – nested subtask objects

Extra fields are allowed to maintain compatibility with older formats.

## config.json

Configuration options are stored in `.taskmaster/config.json`. The file contains objects describing model settings and global preferences. Task Master validates that the `models` and `global` keys exist but otherwise preserves unknown fields for forward compatibility.

## Legacy Support

Task Master will automatically look for legacy locations such as `tasks/tasks.json` and `.taskmasterconfig`. When these files are found, a deprecation warning is emitted but the data is still loaded to ensure older projects continue to work. The migration guide provides instructions for moving to the `.taskmaster/` layout.
