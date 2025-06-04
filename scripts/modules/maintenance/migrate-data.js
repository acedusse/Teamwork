import { migrateProject } from '../task-manager/migrate.js';

/**
 * Run data migration using existing migrateProject logic.
 * @param {Object} options - Migration options
 * @returns {Promise<void>}
 */
export async function migrateData(options = {}) {
    await migrateProject(options);
}
