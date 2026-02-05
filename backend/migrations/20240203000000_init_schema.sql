-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Exercises Table
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    muscle_group TEXT NOT NULL, -- e.g., 'chest', 'back', 'legs'
    equipment TEXT DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Workouts Table (Templates or Logs)
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT, -- Optional name for the workout
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Sets Table
CREATE TABLE IF NOT EXISTS sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workouts(id),
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    weight_kg REAL NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    rpe REAL, -- Rate of Perceived Exertion (1-10)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed some basic exercises
INSERT INTO exercises (name, muscle_group, equipment) VALUES
('Bench Press', 'chest', 'barbell'),
('Squat', 'legs', 'barbell'),
('Deadlift', 'back', 'barbell'),
('Pull Up', 'back', 'bodyweight'),
('Overhead Press', 'shoulders', 'barbell'),
('Dumbbell Curl', 'biceps', 'dumbbell')
ON CONFLICT (name) DO NOTHING;
