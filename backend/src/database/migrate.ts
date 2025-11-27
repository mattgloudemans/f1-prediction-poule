import fs from 'fs';
import path from 'path';
import { query } from '../config/database';

const runMigration = async () => {
  try {
    console.log('Running database migrations...');

    // Try to find schema.sql in either src or dist directory
    let schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      // If running from dist, go back to src
      schemaPath = path.join(__dirname, '../../src/database/schema.sql');
    }
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await query(schema);

    console.log('Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
