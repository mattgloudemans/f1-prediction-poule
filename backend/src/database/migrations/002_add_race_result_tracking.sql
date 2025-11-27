-- Migration: Add provisional/final result tracking to races table
-- Run this migration to enable two-stage race results processing

-- Add columns to track provisional and final results processing
ALTER TABLE races
ADD COLUMN IF NOT EXISTS provisional_results_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS final_results_processed BOOLEAN DEFAULT FALSE;

-- Update existing completed races to mark them as fully processed
UPDATE races
SET provisional_results_sent = TRUE,
    final_results_processed = TRUE
WHERE status = 'completed';
