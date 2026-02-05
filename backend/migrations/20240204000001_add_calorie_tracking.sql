-- Add physical stats to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS height_cm DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS current_weight_kg DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'sedentary';

-- Create weight_logs table
CREATE TABLE IF NOT EXISTS weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    weight_kg DOUBLE PRECISION NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create nutrition_logs table
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    calories_in INTEGER NOT NULL,
    protein_g INTEGER,
    carbs_g INTEGER,
    fats_g INTEGER,
    UNIQUE(user_id, log_date)
);

-- Add calories_burned to workouts
ALTER TABLE workouts
ADD COLUMN IF NOT EXISTS calories_burned INTEGER;
