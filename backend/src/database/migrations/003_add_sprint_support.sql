-- Migration: Add sprint race support
-- This migration adds support for F1 sprint races

-- 1. Add race_type column to races table
ALTER TABLE races ADD COLUMN IF NOT EXISTS race_type VARCHAR(20) DEFAULT 'main';

-- 2. Drop the existing unique constraint and add new one that includes race_type
ALTER TABLE races DROP CONSTRAINT IF EXISTS races_season_round_key;
ALTER TABLE races ADD CONSTRAINT races_season_round_type_key UNIQUE(season, round, race_type);

-- 3. Create sprint_predictions table (8 positions instead of 10)
CREATE TABLE IF NOT EXISTS sprint_predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  position_1 INTEGER REFERENCES drivers(id),
  position_2 INTEGER REFERENCES drivers(id),
  position_3 INTEGER REFERENCES drivers(id),
  position_4 INTEGER REFERENCES drivers(id),
  position_5 INTEGER REFERENCES drivers(id),
  position_6 INTEGER REFERENCES drivers(id),
  position_7 INTEGER REFERENCES drivers(id),
  position_8 INTEGER REFERENCES drivers(id),
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, race_id)
);

-- 4. Add indexes for sprint_predictions
CREATE INDEX IF NOT EXISTS idx_sprint_predictions_user ON sprint_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_sprint_predictions_race ON sprint_predictions(race_id);
CREATE INDEX IF NOT EXISTS idx_sprint_predictions_user_race ON sprint_predictions(user_id, race_id);

-- 5. Add index for race_type queries
CREATE INDEX IF NOT EXISTS idx_races_type ON races(race_type);

-- 6. Add trigger for sprint_predictions updated_at
CREATE TRIGGER update_sprint_predictions_updated_at BEFORE UPDATE ON sprint_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
