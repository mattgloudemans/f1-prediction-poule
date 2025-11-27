import { Request, Response } from 'express';
import { query } from '../config/database';
import * as jolpiService from '../services/jolpiService';
import { calculateRacePoints } from './leaderboardController';

// Store last run info in memory (persists until server restart)
const cronJobStatus: {
  [key: string]: {
    lastRun: Date | null;
    lastStatus: 'success' | 'error' | 'running' | null;
    lastMessage: string | null;
    isRunning: boolean;
  };
} = {
  syncDriverStandings: { lastRun: null, lastStatus: null, lastMessage: null, isRunning: false },
  syncRaceResults: { lastRun: null, lastStatus: null, lastMessage: null, isRunning: false },
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, nickname, email, avatar_url, total_points, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Delete user (cascade will handle related records)
    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user.id,
        nickname: user.nickname,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get cronjob status and configuration
export const getCronJobs = async (req: Request, res: Response) => {
  try {
    // Get last sync times from database
    const driverLastUpdate = await query(
      'SELECT MAX(updated_at) as last_updated FROM drivers WHERE season = 2025'
    );
    const raceLastUpdate = await query(
      'SELECT MAX(updated_at) as last_updated FROM races WHERE season = 2025'
    );

    // Get count of completed races and pending races
    const raceStats = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'completed') as completed_races,
        COUNT(*) FILTER (WHERE status = 'upcoming' AND race_date < NOW()) as pending_races,
        COUNT(*) FILTER (WHERE status = 'upcoming' AND race_date > NOW()) as upcoming_races
       FROM races WHERE season = 2025`
    );

    const cronJobs = [
      {
        id: 'syncDriverStandings',
        name: 'Sync Driver Standings',
        description: 'Updates F1 championship points from Jolpi Ergast API',
        schedule: '0 9 * * 1,4',
        scheduleHuman: 'Monday & Thursday at 09:00 UTC',
        lastDataUpdate: driverLastUpdate.rows[0]?.last_updated || null,
        ...cronJobStatus.syncDriverStandings
      },
      {
        id: 'syncRaceResults',
        name: 'Sync Race Results',
        description: 'Imports race results and calculates prediction points',
        schedule: '15 9 * * 1,4',
        scheduleHuman: 'Monday & Thursday at 09:15 UTC',
        lastDataUpdate: raceLastUpdate.rows[0]?.last_updated || null,
        pendingRaces: parseInt(raceStats.rows[0]?.pending_races || '0'),
        ...cronJobStatus.syncRaceResults
      }
    ];

    res.json({
      cronJobs,
      stats: {
        completedRaces: parseInt(raceStats.rows[0]?.completed_races || '0'),
        pendingRaces: parseInt(raceStats.rows[0]?.pending_races || '0'),
        upcomingRaces: parseInt(raceStats.rows[0]?.upcoming_races || '0')
      }
    });
  } catch (error) {
    console.error('Get cron jobs error:', error);
    res.status(500).json({ error: 'Failed to get cron job status' });
  }
};

// Manually trigger driver standings sync
export const triggerDriverStandingsSync = async (req: Request, res: Response) => {
  if (cronJobStatus.syncDriverStandings.isRunning) {
    return res.status(409).json({ error: 'Sync is already running' });
  }

  cronJobStatus.syncDriverStandings.isRunning = true;
  cronJobStatus.syncDriverStandings.lastStatus = 'running';

  // Run async but respond immediately
  res.json({ message: 'Driver standings sync started', status: 'running' });

  try {
    const season = 2025;
    const standings = await jolpiService.getDriverStandings(season);

    // Fetch all existing drivers for this season
    const existingDrivers = await query(
      'SELECT id, driver_number, UPPER(name) as name_upper FROM drivers WHERE season = $1',
      [season]
    );
    const driverByNumber = new Map(existingDrivers.rows.map((d: any) => [d.driver_number, d.id]));
    const driverByName = new Map(existingDrivers.rows.map((d: any) => [d.name_upper, d.id]));

    const updates: { id: number; points: number; nationality: string }[] = [];
    let notFound = 0;

    for (const standing of standings) {
      const driverNumber = parseInt(standing.Driver.permanentNumber);
      const points = parseInt(standing.points);
      const driverName = `${standing.Driver.givenName} ${standing.Driver.familyName}`;
      const nationality = standing.Driver.nationality;

      let driverId = driverByNumber.get(driverNumber);
      if (!driverId) {
        driverId = driverByName.get(driverName.toUpperCase());
      }

      if (driverId) {
        updates.push({ id: driverId, points, nationality });
      } else {
        notFound++;
      }
    }

    // Batch update
    if (updates.length > 0) {
      const ids = updates.map(u => u.id);
      const pointsCases = updates.map(u => `WHEN ${u.id} THEN ${u.points}`).join(' ');
      const nationalityCases = updates.map(u => `WHEN ${u.id} THEN '${u.nationality.replace(/'/g, "''")}'`).join(' ');

      await query(
        `UPDATE drivers
         SET total_points = CASE id ${pointsCases} END,
             nationality = CASE id ${nationalityCases} END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1)`,
        [ids]
      );
    }

    cronJobStatus.syncDriverStandings.lastRun = new Date();
    cronJobStatus.syncDriverStandings.lastStatus = 'success';
    cronJobStatus.syncDriverStandings.lastMessage = `Updated ${updates.length} drivers, ${notFound} not found`;
    cronJobStatus.syncDriverStandings.isRunning = false;

    console.log(`[ADMIN] Driver standings sync completed: ${updates.length} updated, ${notFound} not found`);
  } catch (error: any) {
    cronJobStatus.syncDriverStandings.lastRun = new Date();
    cronJobStatus.syncDriverStandings.lastStatus = 'error';
    cronJobStatus.syncDriverStandings.lastMessage = error.message || 'Unknown error';
    cronJobStatus.syncDriverStandings.isRunning = false;

    console.error('[ADMIN] Driver standings sync error:', error);
  }
};

// Manually trigger race results sync
export const triggerRaceResultsSync = async (req: Request, res: Response) => {
  if (cronJobStatus.syncRaceResults.isRunning) {
    return res.status(409).json({ error: 'Sync is already running' });
  }

  cronJobStatus.syncRaceResults.isRunning = true;
  cronJobStatus.syncRaceResults.lastStatus = 'running';

  // Run async but respond immediately
  res.json({ message: 'Race results sync started', status: 'running' });

  try {
    const season = 2025;

    // Find races that have passed but don't have results yet
    const racesResult = await query(
      `SELECT r.id, r.season, r.round, r.race_name, r.race_date
       FROM races r
       WHERE r.season = $1
         AND r.race_date < NOW()
         AND (r.status = 'upcoming' OR NOT EXISTS (
           SELECT 1 FROM race_results WHERE race_id = r.id
         ))
       ORDER BY r.race_date DESC`,
      [season]
    );

    const races = racesResult.rows;

    if (races.length === 0) {
      cronJobStatus.syncRaceResults.lastRun = new Date();
      cronJobStatus.syncRaceResults.lastStatus = 'success';
      cronJobStatus.syncRaceResults.lastMessage = 'No races need syncing';
      cronJobStatus.syncRaceResults.isRunning = false;
      return;
    }

    let totalInserted = 0;
    let racesProcessed = 0;

    for (const race of races) {
      try {
        const jolpiResults = await jolpiService.getRaceResults(race.season, race.round);

        if (jolpiResults.length === 0) continue;

        // Clear existing results
        await query('DELETE FROM race_results WHERE race_id = $1', [race.id]);

        // Batch fetch drivers
        const driverNumbers = jolpiResults.map((r: any) => parseInt(r.number));
        const driversResult = await query(
          'SELECT id, driver_number FROM drivers WHERE driver_number = ANY($1) AND season = $2',
          [driverNumbers, race.season]
        );
        const driverMap = new Map(driversResult.rows.map((d: any) => [d.driver_number, d.id]));

        // Batch insert
        const insertValues: string[] = [];
        const insertParams: any[] = [];
        let paramIndex = 1;

        for (const result of jolpiResults) {
          const driverId = driverMap.get(parseInt(result.number));
          if (driverId) {
            insertValues.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`);
            insertParams.push(race.id, driverId, parseInt(result.position), parseFloat(result.points), result.status);
            paramIndex += 5;
          }
        }

        if (insertValues.length > 0) {
          await query(
            `INSERT INTO race_results (race_id, driver_id, position, points, status)
             VALUES ${insertValues.join(', ')}`,
            insertParams
          );
          totalInserted += insertValues.length;
        }

        // Update race status
        await query('UPDATE races SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['completed', race.id]);

        // Calculate points
        await calculateRacePoints(race.id);
        racesProcessed++;

      } catch (error) {
        console.error(`[ADMIN] Error syncing race ${race.race_name}:`, error);
      }
    }

    cronJobStatus.syncRaceResults.lastRun = new Date();
    cronJobStatus.syncRaceResults.lastStatus = 'success';
    cronJobStatus.syncRaceResults.lastMessage = `Processed ${racesProcessed} race(s), inserted ${totalInserted} results`;
    cronJobStatus.syncRaceResults.isRunning = false;

    console.log(`[ADMIN] Race results sync completed: ${racesProcessed} races, ${totalInserted} results`);
  } catch (error: any) {
    cronJobStatus.syncRaceResults.lastRun = new Date();
    cronJobStatus.syncRaceResults.lastStatus = 'error';
    cronJobStatus.syncRaceResults.lastMessage = error.message || 'Unknown error';
    cronJobStatus.syncRaceResults.isRunning = false;

    console.error('[ADMIN] Race results sync error:', error);
  }
};
