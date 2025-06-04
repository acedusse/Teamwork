import cron from 'node-cron';

/**
 * Schedule a report generation function using cron.
 * @param {string} pattern
 * @param {Function} fn
 * @returns {cron.ScheduledTask}
 */
function scheduleReport(pattern, fn) {
    return cron.schedule(pattern, fn, { scheduled: true });
}

export default scheduleReport;
