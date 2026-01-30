import { query } from '../config/database';

/**
 * Reset all user points to 0 at the start of each new season.
 * Runs annually on January 1st via cron.
 */
async function resetYearlyPoints() {
  try {
    const currentYear = new Date().getFullYear();
    console.log(`[CRON] Resetting user points for ${currentYear} season...`);

    // Reset all user points to 0
    const result = await query('UPDATE users SET total_points = 0');

    console.log(`[CRON] ✓ Reset points for ${result.rowCount} users`);
    console.log(`[CRON] Happy New Year! ${currentYear} F1 season points reset complete.`);

    process.exit(0);
  } catch (error) {
    console.error('[CRON] Error resetting yearly points:', error);
    process.exit(1);
  }
}

resetYearlyPoints();
