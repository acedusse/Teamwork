# Project Architecture

This document provides a high level overview of how Task Master is organized.

## CLI Entry Point

The `index.js` file at the project root exposes the command line interface. It loads the various commands located under `scripts/` and `bin/`.

## MCP Server

The `mcp-server/` directory contains an optional server that implements the Model Control Protocol (MCP). Editors like Cursor can connect to this server to run Task Master commands without leaving the editor.

## Source Modules

Reusable logic and provider integrations live under `src/`. The `ai-providers/` folder contains modules for the different AI services. Utility helpers are located in `src/utils`.

## Scripts

The `scripts/` directory houses most of the task management logic that powers the CLI and MCP tools. Each CLI command maps to a module in `scripts/modules/`.

## Tests

A full suite of unit and integration tests lives in the `tests/` directory. Running `npm test` executes all tests.

## Assets

The `assets/` folder contains default configuration files and IDE integration assets that are copied when a project is initialised.

