/**
 * Window Helpers
 * 
 * Utility functions for creating prediction windows with proper date ranges
 * for different scopes (daily, weekly, monthly, yearly).
 */

/**
 * Get start and end dates for a monthly window
 * 
 * @param {Date|string} date - Date within the month (defaults to current date)
 * @param {string} timezone - Timezone (defaults to 'Asia/Kolkata')
 * @returns {Object} { start_at: ISO string, end_at: ISO string }
 */
export function getMonthlyWindowDates(date = new Date(), timezone = 'Asia/Kolkata') {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Start of month (00:00:00)
  const startAt = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  
  // End of month (23:59:59.999)
  const endAt = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return {
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString()
  };
}

/**
 * Get start and end dates for a yearly window
 * 
 * IMPORTANT: For yearly windows, we create a rolling year from the given date.
 * If user provides date "2025-12-22", window will be from 2025-12-22 to 2026-12-22.
 * 
 * @param {Date|string|number} dateOrYear - Date within the year or year number (defaults to current date)
 * @param {string} timezone - Timezone (defaults to 'Asia/Kolkata')
 * @returns {Object} { start_at: ISO string, end_at: ISO string }
 */
export function getYearlyWindowDates(dateOrYear = new Date(), timezone = 'Asia/Kolkata') {
  let startDate;
  
  if (typeof dateOrYear === 'number') {
    // If number provided, treat as year and use January 1 of that year
    startDate = new Date(dateOrYear, 0, 1, 0, 0, 0, 0);
  } else {
    // If date provided, use that exact date as start
    const d = typeof dateOrYear === 'string' ? new Date(dateOrYear) : dateOrYear;
    // Use the exact date provided (start of day)
    startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }
  
  // End date is exactly one year later (same date next year, end of day)
  // Example: If start is 2025-12-22 00:00:00, end is 2026-12-21 23:59:59.999
  const endDate = new Date(startDate);
  endDate.setFullYear(startDate.getFullYear() + 1);
  // Set to end of the day before (to make it inclusive of the full year)
  endDate.setDate(endDate.getDate() - 1);
  endDate.setHours(23, 59, 59, 999);
  
  return {
    start_at: startDate.toISOString(),
    end_at: endDate.toISOString()
  };
}

/**
 * Get start and end dates for a daily window
 * 
 * @param {Date|string} date - Date (defaults to current date)
 * @param {string} timezone - Timezone (defaults to 'Asia/Kolkata')
 * @returns {Object} { start_at: ISO string, end_at: ISO string }
 */
export function getDailyWindowDates(date = new Date(), timezone = 'Asia/Kolkata') {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Start of day (00:00:00)
  const startAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  
  // End of day (23:59:59.999)
  const endAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  
  return {
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString()
  };
}

/**
 * Get start and end dates for a weekly window (7 days).
 *
 * @param {Date|string} date - Date within the week (defaults to current date)
 * @param {string} timezone - Timezone (defaults to 'Asia/Kolkata')
 * @returns {Object} { start_at: ISO string, end_at: ISO string }
 */
export function getWeeklyWindowDates(date = new Date(), timezone = 'Asia/Kolkata') {
  const d = typeof date === 'string' ? new Date(date) : date;

  // Start of the given day (00:00:00) as week start.
  // (We keep this simple & deterministic; app can choose which day starts the weekly plan.)
  const startAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

  // End of day after 6 days (inclusive 7-day window)
  const endAt = new Date(startAt);
  endAt.setDate(startAt.getDate() + 6);
  endAt.setHours(23, 59, 59, 999);

  return {
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
  };
}

/**
 * Get window dates based on scope
 * 
 * @param {string} scope - Window scope ('daily', 'weekly', 'monthly', 'yearly')
 * @param {Date|string|number} dateOrYear - Date or year (defaults to current date)
 * @param {string} timezone - Timezone (defaults to 'Asia/Kolkata')
 * @returns {Object} { start_at: ISO string, end_at: ISO string }
 */
export function getWindowDatesForScope(scope, dateOrYear = new Date(), timezone = 'Asia/Kolkata') {
  switch (scope) {
    case 'daily':
      return getDailyWindowDates(dateOrYear, timezone);
    case 'weekly':
      return getWeeklyWindowDates(dateOrYear, timezone);
    case 'monthly':
      return getMonthlyWindowDates(dateOrYear, timezone);
    case 'yearly':
      return getYearlyWindowDates(dateOrYear, timezone);
    default:
      throw new Error(`Unsupported scope: ${scope}. Supported scopes: daily, weekly, monthly, yearly`);
  }
}

