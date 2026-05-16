import pool, { query } from '../config/database';

/**
 * Remove dummy race results and reset scores.
 * Usage: npx ts-node src/scripts/removeDummyResults.ts [race_id]
 * Default: Australian GP 2026 (race_id 57)
 */

async function removeDummyResults() {
  const raceId = process.argv[2] ? parseInt(process.argv[2]) : 57;

  try {
    const raceResult = await query(
      'SELECT id, race_name, race_type FROM races WHERE id = $1',
      [raceId]
    );
    if (raceResult.rows.length === 0) {
      console.error(`Race with id ${raceId} not found`);
      process.exit(1);
    }

    const { race_name, race_type } = raceResult.rows[0];
    const resultsTable = race_type === 'sprint' ? 'sprint_results' : 'race_results';
    const predTable = race_type === 'sprint' ? 'sprint_predictions' : 'predictions';

    console.log(`\nRemoving dummy results for: ${race_name} (id: ${raceId})\n`);

    // Get current points to subtract from user totals
    const predictions = await query(
      `SELECT user_id, points_earned FROM ${predTable} WHERE race_id = $1`,
      [raceId]
    );

    // Subtract points from user totals
    for (const pred of predictions.rows) {
      if (pred.points_earned > 0) {
        await query(
          'UPDATE users SET total_points = GREATEST(0, total_points - $1) WHERE id = $2',
          [pred.points_earned, pred.user_id]
        );
      }
    }

    // Reset prediction scores
    await query(
      `UPDATE ${predTable} SET points_earned = 0, is_locked = FALSE WHERE race_id = $1`,
      [raceId]
    );

    // Delete results
    await query(`DELETE FROM ${resultsTable} WHERE race_id = $1`, [raceId]);

    // Reset race status
    await query(
      "UPDATE races SET status = 'upcoming', provisional_results_sent = FALSE, final_results_processed = FALSE WHERE id = $1",
      [raceId]
    );

    // Show updated state
    const leaderboard = await query(
      'SELECT nickname, total_points FROM users ORDER BY total_points DESC'
    );
    console.log('=== Updated Leaderboard ===');
    console.table(leaderboard.rows);

    console.log('\nDummy results removed and scores reset successfully!');

  } catch (error) {
    console.error('Error removing dummy results:', error);
  } finally {
    await pool.end();
  }
}

removeDummyResults();
