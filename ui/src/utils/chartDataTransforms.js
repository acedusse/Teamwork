/**
 * Chart Data Transformation Utilities
 * 
 * This module provides utility functions to transform API response data
 * into formats required by various chart components in the application.
 */

import './chartDataTypes.js'; // Import type definitions

/**
 * Formats a date string into a human-readable format for chart display
 * @param {string} dateString - ISO date string (YYYY-MM-DD)
 * @param {DateFormatOptions} [options={}] - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (dateString, options = {}) => {
  const { includeYear = false, format = 'short' } = options;
  
  if (!dateString) {
    return '';
  }
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string provided: ${dateString}`);
      return dateString; // Return original string if invalid
    }
    
    switch (format) {
      case 'short':
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = date.toLocaleDateString('en-US', { 
          month: 'numeric', 
          day: 'numeric',
          ...(includeYear && { year: 'numeric' })
        });
        return `${dayName} ${monthDay}`;
        
      case 'medium':
        return date.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'short', 
          day: 'numeric',
          ...(includeYear && { year: 'numeric' })
        });
        
      case 'long':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric',
          ...(includeYear && { year: 'numeric' })
        });
        
      default:
        return dateString;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Transforms daily statistics API response into format expected by TaskOverviewChart
 * @param {DailyStatsApiResponse} apiResponse - API response from /tasks/statistics/daily
 * @param {TransformOptions} [options={}] - Transformation options
 * @returns {ChartDataPoint[]} Transformed data array for chart consumption
 */
export const transformDailyStatsForChart = (apiResponse, options = {}) => {
  const { dateFormat = 'short', includeTotal = true } = options;
  
  if (!apiResponse || !apiResponse.statistics || !Array.isArray(apiResponse.statistics)) {
    console.warn('Invalid API response structure for daily statistics');
    return [];
  }

  return apiResponse.statistics.map(stat => {
    // Validate required fields
    if (!stat.date) {
      console.warn('Missing date field in statistics entry:', stat);
      return null;
    }

    // Ensure numeric fields are numbers and provide defaults
    const completed = Number(stat.completed) || 0;
    const inProgress = Number(stat.inProgress) || 0;
    const pending = Number(stat.pending) || 0;
    const total = includeTotal ? (Number(stat.total) || (completed + inProgress + pending)) : undefined;

    const transformedEntry = {
      name: formatDateForDisplay(stat.date, { format: dateFormat }),
      date: stat.date,
      completed,
      inProgress,
      pending,
    };

    if (includeTotal) {
      transformedEntry.total = total;
    }

    return transformedEntry;
  }).filter(Boolean); // Remove any null entries from validation failures
};

/**
 * Calculates additional metrics from daily statistics
 * @param {ChartDataPoint[]} dailyStats - Array of daily statistics
 * @returns {DailyMetrics} Calculated metrics
 */
export const calculateDailyMetrics = (dailyStats) => {
  if (!Array.isArray(dailyStats) || dailyStats.length === 0) {
    return {
      totalCompleted: 0,
      totalInProgress: 0,
      totalPending: 0,
      averageDaily: 0,
      completionRate: 0,
      trend: 'stable'
    };
  }

  const totals = dailyStats.reduce((acc, day) => {
    acc.completed += day.completed || 0;
    acc.inProgress += day.inProgress || 0;
    acc.pending += day.pending || 0;
    return acc;
  }, { completed: 0, inProgress: 0, pending: 0 });

  const totalTasks = totals.completed + totals.inProgress + totals.pending;
  const averageDaily = totalTasks / dailyStats.length;
  const completionRate = totalTasks > 0 ? (totals.completed / totalTasks) * 100 : 0;

  // Calculate trend (comparing first half vs second half of the period)
  const midPoint = Math.floor(dailyStats.length / 2);
  const firstHalf = dailyStats.slice(0, midPoint);
  const secondHalf = dailyStats.slice(midPoint);

  const firstHalfAvg = firstHalf.length > 0 
    ? firstHalf.reduce((sum, day) => sum + (day.completed || 0), 0) / firstHalf.length 
    : 0;
  const secondHalfAvg = secondHalf.length > 0 
    ? secondHalf.reduce((sum, day) => sum + (day.completed || 0), 0) / secondHalf.length 
    : 0;

  let trend = 'stable';
  if (secondHalfAvg > firstHalfAvg * 1.1) {
    trend = 'increasing';
  } else if (secondHalfAvg < firstHalfAvg * 0.9) {
    trend = 'decreasing';
  }

  return {
    totalCompleted: totals.completed,
    totalInProgress: totals.inProgress,
    totalPending: totals.pending,
    averageDaily: Math.round(averageDaily * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
    trend
  };
};

/**
 * Transforms API response for different time period views
 * @param {DailyStatsApiResponse} apiResponse - API response from statistics endpoint
 * @param {TimePeriod} [timePeriod='daily'] - Time period for aggregation
 * @returns {ChartDataPoint[]} Transformed data for the specified time period
 */
export const transformForTimePeriod = (apiResponse, timePeriod = 'daily') => {
  if (!apiResponse || !apiResponse.statistics) {
    return [];
  }

  const stats = apiResponse.statistics;

  switch (timePeriod) {
    case 'weekly':
      return aggregateByWeek(stats);
    case 'monthly':
      return aggregateByMonth(stats);
    case 'daily':
    default:
      return transformDailyStatsForChart(apiResponse);
  }
};

/**
 * Aggregates daily statistics into weekly buckets
 * @param {DailyStatistic[]} dailyStats - Array of daily statistics
 * @returns {ChartDataPoint[]} Weekly aggregated data
 */
const aggregateByWeek = (dailyStats) => {
  const weeklyData = {};

  dailyStats.forEach(stat => {
    const date = new Date(stat.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        date: weekKey,
        completed: 0,
        inProgress: 0,
        pending: 0,
        total: 0
      };
    }

    weeklyData[weekKey].completed += stat.completed || 0;
    weeklyData[weekKey].inProgress += stat.inProgress || 0;
    weeklyData[weekKey].pending += stat.pending || 0;
    weeklyData[weekKey].total += stat.total || 0;
  });

  return Object.values(weeklyData).map(week => ({
    ...week,
    name: formatDateForDisplay(week.date, { format: 'medium' })
  }));
};

/**
 * Aggregates daily statistics into monthly buckets
 * @param {DailyStatistic[]} dailyStats - Array of daily statistics
 * @returns {ChartDataPoint[]} Monthly aggregated data
 */
const aggregateByMonth = (dailyStats) => {
  const monthlyData = {};

  dailyStats.forEach(stat => {
    const date = new Date(stat.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        date: monthKey,
        completed: 0,
        inProgress: 0,
        pending: 0,
        total: 0
      };
    }

    monthlyData[monthKey].completed += stat.completed || 0;
    monthlyData[monthKey].inProgress += stat.inProgress || 0;
    monthlyData[monthKey].pending += stat.pending || 0;
    monthlyData[monthKey].total += stat.total || 0;
  });

  return Object.values(monthlyData).map(month => ({
    ...month,
    name: formatDateForDisplay(month.date, { format: 'long', includeYear: true })
  }));
};

/**
 * Validates API response structure for daily statistics
 * @param {any} apiResponse - API response to validate
 * @returns {ValidationResult} Validation result with isValid flag and errors array
 */
export const validateDailyStatsResponse = (apiResponse) => {
  const errors = [];

  if (!apiResponse) {
    errors.push('API response is null or undefined');
    return { isValid: false, errors };
  }

  if (!apiResponse.statistics) {
    errors.push('Missing statistics field in API response');
  } else if (!Array.isArray(apiResponse.statistics)) {
    errors.push('Statistics field must be an array');
  } else {
    // Validate each statistics entry
    apiResponse.statistics.forEach((stat, index) => {
      if (!stat.date) {
        errors.push(`Missing date field in statistics entry ${index}`);
      }
      if (typeof stat.completed !== 'number' && stat.completed !== undefined) {
        errors.push(`Invalid completed field type in statistics entry ${index}`);
      }
      if (typeof stat.inProgress !== 'number' && stat.inProgress !== undefined) {
        errors.push(`Invalid inProgress field type in statistics entry ${index}`);
      }
      if (typeof stat.pending !== 'number' && stat.pending !== undefined) {
        errors.push(`Invalid pending field type in statistics entry ${index}`);
      }
    });
  }

  if (!apiResponse.dateRange) {
    errors.push('Missing dateRange field in API response');
  } else {
    if (!apiResponse.dateRange.startDate) {
      errors.push('Missing startDate in dateRange');
    }
    if (!apiResponse.dateRange.endDate) {
      errors.push('Missing endDate in dateRange');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 