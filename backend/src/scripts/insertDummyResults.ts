import pool, { query } from '../config/database';
import { calculateRacePoints } from '../controllers/leaderboardController';

/**
 * Insert dummy race results for testing purposes.
 * Usage: npx ts-node src/scripts/insertDummyResults.ts [race_id]
 * Default: first upcoming 2026 main race with predictions
 */

// Realistic dummy result order (driver IDs from 2026 season)
// Norris, Verstappen, Leclerc, Piastri, Hamilton, Russell, Antonelli, Sainz, Albon, Gasly
const DUMMY_TOP_10_DRIVER_IDS = [21, 22, 25, 23, 26, 24, 27, 29, 28, 38];

const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

async function insertDummyResults() {
  const raceIdArg = process.argv[2] ? parseInt(process.argv[2]) : null;

  try {
    let raceId: number;
    let raceName: string;
    let raceType: string;

    if (raceIdArg) {
      const raceResult = await query(
        'SELECT id, race_name, race_type, status FROM races WHERE id = $1',
        [raceIdArg]
      );
      if (raceResult.rows.length === 0) {
        console.error(`Race with id ${raceIdArg} not found`);
        process.exit(1);
      }
      raceId = raceResult.rows[0].id;
      raceName = raceResult.rows[0].race_name;
      raceType = raceResult.rows[0].race_type;
    } else {
      // Find the first upcoming race with predictions
      const raceResult = await query(`
        SELECT r.id, r.race_name, r.race_type, r.status
        FROM races r
        JOIN predictions p ON p.race_id = r.id
        WHERE r.season = 2026 AND r.status = 'upcoming' AND r.race_type = 'main'
        GROUP BY r.id
        ORDER BY r.race_date ASC
        LIMIT 1
      `);
      if (raceResult.rows.length === 0) {
        console.error('No upcoming 2026 races with predictions found');
        process.exit(1);
      }
      raceId = raceResult.rows[0].id;
      raceName = raceResult.rows[0].race_name;
      raceType = raceResult.rows[0].race_type;
    }

    console.log(`\nInserting dummy results for: ${raceName} (id: ${raceId}, type: ${raceType})\n`);

    // Clear any existing results for this race
    const resultsTable = raceType === 'sprint' ? 'sprint_results' : 'race_results';
    await query(`DELETE FROM ${resultsTable} WHERE race_id = $1`, [raceId]);

    // Insert dummy results
    const topN = raceType === 'sprint' ? 8 : 10;
    const driverIds = DUMMY_TOP_10_DRIVER_IDS.slice(0, topN);

    for (let i = 0; i < topN; i++) {
      const position = i + 1;
      const driverId = driverIds[i];
      const points = F1_POINTS[i] || 0;

      await query(
        `INSERT INTO ${resultsTable} (race_id, driver_id, position, points, status)
         VALUES ($1, $2, $3, $4, 'finished')`,
        [raceId, driverId, position, points]
      );
    }

    // Also add remaining drivers as non-scoring finishers
    const remainingDrivers = await query(
      'SELECT id FROM drivers WHERE season = 2026 AND id != ALL($1) ORDER BY id',
      [driverIds]
    );

    let pos = topN + 1;
    for (const driver of remainingDrivers.rows) {
      await query(
        `INSERT INTO ${resultsTable} (race_id, driver_id, position, points, status)
         VALUES ($1, $2, $3, 0, 'finished')`,
        [raceId, driver.id, pos]
      );
      pos++;
    }

    console.log(`Inserted ${pos - 1} results into ${resultsTable}`);

    // Print the dummy results
    const results = await query(
      `SELECT rr.position, d.name, rr.points, rr.status
       FROM ${resultsTable} rr
       JOIN drivers d ON rr.driver_id = d.id
       WHERE rr.race_id = $1
       ORDER BY rr.position`,
      [raceId]
    );
    console.log('\n=== Dummy Race Results ===');
    console.table(results.rows.slice(0, topN));

    // Update race status
    await query(
      "UPDATE races SET status = 'completed' WHERE id = $1",
      [raceId]
    );
    console.log(`\nRace status updated to 'completed'`);

    // Calculate points
    console.log('\nCalculating prediction points...');
    await calculateRacePoints(raceId);

    // Show scored predictions
    const predTable = raceType === 'sprint' ? 'sprint_predictions' : 'predictions';
    const scored = await query(
      `SELECT u.nickname, p.points_earned
       FROM ${predTable} p
       JOIN users u ON p.user_id = u.id
       WHERE p.race_id = $1
       ORDER BY p.points_earned DESC`,
      [raceId]
    );
    console.log('\n=== Prediction Scores ===');
    console.table(scored.rows);

    // Show updated leaderboard
    const leaderboard = await query(
      `SELECT nickname, total_points FROM users ORDER BY total_points DESC`
    );
    console.log('\n=== Updated Leaderboard ===');
    console.table(leaderboard.rows);

    console.log('\nDummy results inserted and scored successfully!');
    console.log('To undo: run the removeDummyResults script or manually reset.');

  } catch (error) {
    console.error('Error inserting dummy results:', error);
  } finally {
    await pool.end();
  }
}

insertDummyResults();
