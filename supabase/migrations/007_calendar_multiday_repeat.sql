-- Add end_date and repeat columns to calendar_events
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS end_date TEXT,
  ADD COLUMN IF NOT EXISTS repeat TEXT DEFAULT 'none';

-- Back-fill end_date for existing events (single-day = same as date)
UPDATE calendar_events SET end_date = date WHERE end_date IS NULL;
UPDATE calendar_events SET repeat = 'none' WHERE repeat IS NULL;
