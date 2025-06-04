# Migration Guide: CLI to UI Integration

This guide walks through migrating an existing Task Master project that uses only the CLI into the included web UI. The UI lets you visualize tasks, run commands and collaborate more easily while keeping the same underlying workflow.

## Migration Steps

1. **Prepare the environment**
   - Ensure Node.js is installed for both the root project and the `ui/` package.
   - Install UI dependencies:
     ```bash
     cd ui && npm install
     ```
2. **Backup existing data**
   - Copy your `.taskmaster/` folder and any `.env` files to a safe location:
     ```bash
     cp -r .taskmaster backups/taskmaster-$(date +%Y%m%d)
     cp .env backups/env-$(date +%Y%m%d)
     ```
   - Verify the backups contain your `tasks.json`, task files and configuration.
3. **Start the UI server**
   - From the `ui/` directory run:
     ```bash
     npm run dev   # or `npm start` for production
     ```
   - Open `http://localhost:3000` to view the dashboard.
4. **Connect CLI operations**
   - Use the CLI as before while the UI is running. Task updates will automatically appear in the dashboard when files change.
5. **Verify data integrity**
   - Create and complete a test task through the UI.
   - Run `task-master list` in the CLI and confirm the changes match.

## Data Backup Procedures

- Always back up `.taskmaster/` before starting the migration.
- Optionally export your tasks list to JSON for additional safety:
  ```bash
  task-master list --json > backups/tasks-$(date +%Y%m%d).json
  ```
- Store these backups in version control or another secure location.

## Rollback Instructions

If you encounter issues after enabling the UI:

1. Stop the UI server (`Ctrl+C`).
2. Restore your backup:
   ```bash
   rm -rf .taskmaster
   cp -r backups/taskmaster-* .taskmaster
   cp backups/env-* .env
   ```
3. Continue working with the CLI as before.

## Testing Migration Scenarios

- Test creating, updating and completing tasks in the UI and confirm they reflect in the CLI.
- Run unit tests to ensure core functionality still works:
  ```bash
  npm test
  ```
- Try running the UI in a separate branch to experiment before merging into main.

## Validation Checklist

- [ ] `.taskmaster/` directory backed up
- [ ] `.env` file backed up
- [ ] UI dependencies installed with `npm install`
- [ ] UI server starts successfully
- [ ] Tasks sync correctly between UI and CLI
- [ ] Unit tests pass after migration

---

Following this guide will help you safely adopt the Task Master UI while keeping the option to roll back if needed.
