import { query } from '../config/database';
import * as jolpiService from '../services/jolpiService';
import * as openF1Service from '../services/openF1Service';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Seed races
    console.log('📅 Seeding races from Jolpi API...');
    const jolpiRaces = await jolpiService.getRaces(2025);

    for (const race of jolpiRaces) {
      const raceDate = new Date(`${race.date}T${race.time || '00:00:00'}`);

      await query(
        `INSERT INTO races (season, round, race_name, circuit_name, country, race_date, race_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (season, round) DO UPDATE SET
           race_name = EXCLUDED.race_name,
           circuit_name = EXCLUDED.circuit_name,
           country = EXCLUDED.country,
           race_date = EXCLUDED.race_date,
           race_time = EXCLUDED.race_time`,
        [
          parseInt(race.season),
          parseInt(race.round),
          race.raceName,
          race.Circuit.circuitName,
          race.Circuit.Location.country,
          raceDate,
          race.time,
          new Date() > raceDate ? 'completed' : 'upcoming'
        ]
      );
    }

    console.log(`✅ Seeded ${jolpiRaces.length} races`);

    // Seed drivers
    console.log('🏎️  Seeding drivers...');
    let drivers;

    try {
      // Try OpenF1 first
      const openF1Drivers = await openF1Service.getLatestDrivers();
      drivers = openF1Drivers.map(d => ({
        number: d.driver_number,
        name: d.full_name,
        team: d.team_name,
        nationality: d.country_code,
      }));
    } catch {
      // Fallback to Jolpi
      console.log('⚠️  OpenF1 failed, using Jolpi API for drivers...');
      const jolpiDrivers = await jolpiService.getDrivers(2025);
      drivers = jolpiDrivers.map(d => ({
        number: parseInt(d.permanentNumber),
        name: `${d.givenName} ${d.familyName}`,
        team: 'Unknown',
        nationality: d.nationality,
      }));
    }

    for (const driver of drivers) {
      await query(
        `INSERT INTO drivers (driver_number, name, team, nationality, season)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (driver_number, season) DO UPDATE SET
           name = EXCLUDED.name,
           team = EXCLUDED.team,
           nationality = EXCLUDED.nationality`,
        [driver.number, driver.name, driver.team, driver.nationality, 2025]
      );
    }

    console.log(`✅ Seeded ${drivers.length} drivers`);

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
