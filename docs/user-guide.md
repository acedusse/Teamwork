# Task Master User Guide

Welcome to the Task Master user guide. This document provides a concise overview of how to get started, explore core features, and resolve common issues.

## Getting Started

1. **Install Task Master** using npm or MCP:
   ```bash
   npm install -g task-master-ai
   ```
   Or set up the MCP server as described in the [README](../README.md) to work directly from your editor.
2. **Add your API keys** in `.env` (CLI) or `.mcp.json` (MCP). Use `task-master models` to verify configuration.
3. **Initialize your project** and parse your PRD:
   ```bash
   task-master init
   task-master parse-prd .taskmaster/docs/prd.txt
   ```
4. Use `task-master next` to view the next task and `task-master show <id>` for details.

For a detailed walkthrough see the [tutorial](tutorial.md).

## Feature Tutorials

Below are quick links to common workflows:

- **Parsing requirements**: `task-master parse-prd ./docs/prd.txt`
- **Listing tasks**: `task-master list`
- **Completing a task**: `task-master set-status --id=<id> --status=done`
- **Expanding tasks**: `task-master expand --id=<id>` or `--all`
- **Analyzing complexity**: `task-master analyze-complexity`

These examples build on the basics shown in the [tutorial](tutorial.md).

## Troubleshooting

- **Missing API keys** – Check `.env` or `.mcp.json` and run `task-master models` to verify configuration.
- **MCP connection issues** – Ensure your MCP settings match the example in the README and that Node.js is installed.
- **Task file sync problems** – Run `task-master generate` and `task-master fix-dependencies`.
- **Unexpected errors** – Re-run commands with the `--debug` flag to view detailed logs.

## Video Demonstrations

Video demos of Task Master features are available in the [dashboard demo](dashboard/index.html) or on our [YouTube channel](https://www.youtube.com/@taskmasterai). These videos showcase typical workflows from setup to task completion.

## FAQ

**Q: Do I need API keys for every provider?**

A: No. You can use a single provider, but adding keys for multiple providers lets you switch models easily.

**Q: How do I update my configuration?**

A: Run `task-master models --setup` to interactively modify `.taskmaster/config.json`.

**Q: Can I use Task Master without MCP?**

A: Yes. All commands are available through the CLI after installation.

For additional questions, visit the [GitHub issues page](https://github.com/eyaltoledano/claude-task-master/issues).
