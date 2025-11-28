import { Request, Response } from 'express';
import * as jolpiService from '../services/jolpiService';
import { query } from '../config/database';

// Get practice session results for a race
export const getPracticeResults = async (req: Request, res: Response) => {
  try {
    const { round, session } = req.params;
    const season = parseInt(req.query.season as string) || 2025;
    const sessionNum = parseInt(session) as 1 | 2 | 3;

    if (![1, 2, 3].includes(sessionNum)) {
      return res.status(400).json({ error: 'Session must be 1, 2, or 3' });
    }

    const results = await jolpiService.getPracticeResults(season, parseInt(round), sessionNum);

    const formattedResults = results.map((r: any, index: number) => ({
      position: parseInt(r.position) || index + 1,
      driverNumber: r.number,
      driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
      driverCode: r.Driver.code,
      team: r.Constructor?.name || 'Unknown',
      time: r.Time?.time || 'No time',
      laps: parseInt(r.laps) || 0
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Get practice results error:', error);
    res.status(500).json({ error: 'Failed to get practice results' });
  }
};

// Get qualifying results for a race
export const getQualifyingResults = async (req: Request, res: Response) => {
  try {
    const { round } = req.params;
    const season = parseInt(req.query.season as string) || 2025;

    const results = await jolpiService.getQualifyingResults(season, parseInt(round));

    const formattedResults = results.map((r: any) => ({
      position: parseInt(r.position),
      driverNumber: r.number,
      driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
      driverCode: r.Driver.code,
      team: r.Constructor?.name || 'Unknown',
      q1: r.Q1 || null,
      q2: r.Q2 || null,
      q3: r.Q3 || null
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Get qualifying results error:', error);
    res.status(500).json({ error: 'Failed to get qualifying results' });
  }
};

// Get race results for a race
export const getRaceResultsFromApi = async (req: Request, res: Response) => {
  try {
    const { round } = req.params;
    const season = parseInt(req.query.season as string) || 2025;

    const results = await jolpiService.getRaceResults(season, parseInt(round));

    const formattedResults = results.map((r: any) => ({
      position: parseInt(r.position),
      driverNumber: r.number,
      driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
      driverCode: r.Driver.code,
      team: r.Constructor?.name || 'Unknown',
      points: parseFloat(r.points),
      status: r.status,
      time: r.Time?.time || null,
      fastestLap: r.FastestLap?.Time?.time || null,
      fastestLapRank: r.FastestLap?.rank ? parseInt(r.FastestLap.rank) : null
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Get race results error:', error);
    res.status(500).json({ error: 'Failed to get race results' });
  }
};

// Get sprint results for a race
export const getSprintResultsFromApi = async (req: Request, res: Response) => {
  try {
    const { round } = req.params;
    const season = parseInt(req.query.season as string) || 2025;

    const results = await jolpiService.getSprintResults(season, parseInt(round));

    const formattedResults = results.map((r: any) => ({
      position: parseInt(r.position),
      driverNumber: r.number,
      driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
      driverCode: r.Driver.code,
      team: r.Constructor?.name || 'Unknown',
      points: parseFloat(r.points),
      status: r.status,
      time: r.Time?.time || null
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Get sprint results error:', error);
    res.status(500).json({ error: 'Failed to get sprint results' });
  }
};

// Get all completed races with basic info
export const getCompletedRaces = async (req: Request, res: Response) => {
  try {
    const season = parseInt(req.query.season as string) || 2025;

    const result = await query(
      `SELECT id, round, race_name, circuit_name, country, race_date, race_type, status
       FROM races
       WHERE season = $1 AND status IN ('completed', 'provisional')
       ORDER BY round ASC, race_type DESC`,
      [season]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get completed races error:', error);
    res.status(500).json({ error: 'Failed to get completed races' });
  }
};

// Get season statistics summary
export const getSeasonStats = async (req: Request, res: Response) => {
  try {
    const season = parseInt(req.query.season as string) || 2025;

    // Get race counts
    const racesResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('completed', 'provisional') AND race_type = 'main') as completed_races,
         COUNT(*) FILTER (WHERE status = 'upcoming' AND race_type = 'main') as upcoming_races,
         COUNT(*) FILTER (WHERE status IN ('completed', 'provisional') AND race_type = 'sprint') as completed_sprints,
         COUNT(*) FILTER (WHERE status = 'upcoming' AND race_type = 'sprint') as upcoming_sprints
       FROM races WHERE season = $1`,
      [season]
    );

    // Get top prediction scorers
    const topScorersResult = await query(
      `SELECT u.nickname, u.total_points
       FROM users u
       WHERE u.total_points > 0
       ORDER BY u.total_points DESC
       LIMIT 5`
    );

    // Get total predictions made
    const predictionsResult = await query(
      `SELECT
         (SELECT COUNT(*) FROM predictions) as main_predictions,
         (SELECT COUNT(*) FROM sprint_predictions) as sprint_predictions`
    );

    res.json({
      races: racesResult.rows[0],
      topScorers: topScorersResult.rows,
      predictions: predictionsResult.rows[0]
    });
  } catch (error) {
    console.error('Get season stats error:', error);
    res.status(500).json({ error: 'Failed to get season stats' });
  }
};
