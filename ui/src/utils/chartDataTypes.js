/**
 * Type definitions for chart data structures
 * 
 * This module provides JSDoc type definitions for chart data structures
 * to ensure type safety throughout the application.
 */

/**
 * @typedef {Object} DateRange
 * @property {string} startDate - Start date in YYYY-MM-DD format
 * @property {string} endDate - End date in YYYY-MM-DD format
 */

/**
 * @typedef {Object} DailyStatistic
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {number} completed - Number of completed tasks
 * @property {number} inProgress - Number of in-progress tasks
 * @property {number} pending - Number of pending tasks
 * @property {number} total - Total number of tasks
 */

/**
 * @typedef {Object} DailyStatsApiResponse
 * @property {DateRange} dateRange - Date range information
 * @property {DailyStatistic[]} statistics - Array of daily statistics
 */

/**
 * @typedef {Object} ChartDataPoint
 * @property {string} name - Display name for the data point (formatted date)
 * @property {string} date - Original date in YYYY-MM-DD format
 * @property {number} completed - Number of completed tasks
 * @property {number} inProgress - Number of in-progress tasks
 * @property {number} pending - Number of pending tasks
 * @property {number} [total] - Total number of tasks (optional)
 */

/**
 * @typedef {Object} DailyMetrics
 * @property {number} totalCompleted - Total completed tasks across all days
 * @property {number} totalInProgress - Total in-progress tasks across all days
 * @property {number} totalPending - Total pending tasks across all days
 * @property {number} averageDaily - Average tasks per day
 * @property {number} completionRate - Completion rate as percentage
 * @property {'increasing'|'decreasing'|'stable'} trend - Trend direction
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the validation passed
 * @property {string[]} errors - Array of validation error messages
 */

/**
 * @typedef {Object} TransformOptions
 * @property {string} [dateFormat='short'] - Date format: 'short' | 'medium' | 'long'
 * @property {boolean} [includeTotal=true] - Whether to include total field
 */

/**
 * @typedef {Object} DateFormatOptions
 * @property {boolean} [includeYear=false] - Whether to include year in the format
 * @property {string} [format='short'] - Format type: 'short' | 'medium' | 'long'
 */

/**
 * @typedef {'daily'|'weekly'|'monthly'} TimePeriod
 */

// Export type definitions for use in other modules
export const ChartDataTypes = {
  // This is a placeholder export to make the module importable
  // The actual types are defined via JSDoc comments above
}; 