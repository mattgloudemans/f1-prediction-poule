import { query } from '../config/database';

/**
 * For users who haven't submitted a prediction for an upcoming race,
 * copy their most recent prediction so they can still earn points.
 */
async function copyMissingPredictions() {
  try {
    console.log('[CRON] Starting missing predictions copy...');
    const season = 2026;

    // Find races that just locked (1-10 minutes after lock time)
    // Lock time is 1 minute before race_date
    const racesResult = await query(
      `SELECT r.id, r.season, r.round, r.race_name, r.race_date, r.race_type
       FROM races r
       WHERE r.season = $1
         AND r.race_date - INTERVAL '1 minute' < NOW()
         AND r.race_date - INTERVAL '1 minute' > NOW() - INTERVAL '10 minutes'
         AND r.status = 'upcoming'
       ORDER BY r.race_date ASC`,
      [season]
    );

    const races = racesResult.rows;

    if (races.length === 0) {
      console.log('[CRON] No races need prediction copying');
      process.exit(0);
      return;
    }

    for (const race of races) {
      const isSprint = race.race_type === 'sprint';
      const predictionTable = isSprint ? 'sprint_predictions' : 'predictions';
      const positionColumns = isSprint ? 8 : 10;
      console.log(`[CRON] Processing missing ${isSprint ? 'sprint ' : ''}predictions for ${race.race_name} (Round ${race.round})...`);

      // Find users who have made predictions before but not for this race
      const usersWithoutPrediction = await query(
        `SELECT DISTINCT u.id, u.nickname, u.email
         FROM users u
         WHERE EXISTS (
           SELECT 1 FROM ${predictionTable} p2 WHERE p2.user_id = u.id
         )
         AND NOT EXISTS (
           SELECT 1 FROM ${predictionTable} p WHERE p.user_id = u.id AND p.race_id = $1
         )`,
        [race.id]
      );

      if (usersWithoutPrediction.rows.length === 0) {
        console.log(`[CRON] All active users have predictions for ${race.race_name}`);
        continue;
      }

      console.log(`[CRON] Found ${usersWithoutPrediction.rows.length} users without predictions`);

      let copiedCount = 0;

      for (const user of usersWithoutPrediction.rows) {
        // Get user's most recent prediction from the appropriate table
        const lastPrediction = await query(
          `SELECT p.*
           FROM ${predictionTable} p
           JOIN races r ON p.race_id = r.id
           WHERE p.user_id = $1
           ORDER BY r.race_date DESC
           LIMIT 1`,
          [user.id]
        );

        if (lastPrediction.rows.length === 0) {
          continue;
        }

        const pred = lastPrediction.rows[0];

        // Copy the prediction to the new race (different columns for sprint vs main)
        if (isSprint) {
          await query(
            `INSERT INTO sprint_predictions
              (user_id, race_id, position_1, position_2, position_3, position_4,
               position_5, position_6, position_7, position_8, is_locked)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)`,
            [
              user.id,
              race.id,
              pred.position_1,
              pred.position_2,
              pred.position_3,
              pred.position_4,
              pred.position_5,
              pred.position_6,
              pred.position_7,
              pred.position_8
            ]
          );
        } else {
          await query(
            `INSERT INTO predictions
              (user_id, race_id, position_1, position_2, position_3, position_4, position_5,
               position_6, position_7, position_8, position_9, position_10, is_locked)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)`,
            [
              user.id,
              race.id,
              pred.position_1,
              pred.position_2,
              pred.position_3,
              pred.position_4,
              pred.position_5,
              pred.position_6,
              pred.position_7,
              pred.position_8,
              pred.position_9,
              pred.position_10
            ]
          );
        }

        copiedCount++;
        console.log(`[CRON]   Copied ${isSprint ? 'sprint ' : ''}prediction for ${user.nickname}`);
      }

      console.log(`[CRON] ✓ Copied ${copiedCount} predictions for ${race.race_name}`);
    }

    console.log('[CRON] Missing predictions copy completed');
    process.exit(0);
  } catch (error) {
    console.error('[CRON] Error copying missing predictions:', error);
    process.exit(1);
  }
}

copyMissingPredictions();
