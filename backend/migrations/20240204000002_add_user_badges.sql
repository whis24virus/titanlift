-- Create user_badges table
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    workout_id UUID REFERENCES workouts(id), -- Optional link to the workout where it was earned
    badge_name VARCHAR(255) NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_badge_per_workout UNIQUE (user_id, badge_name, workout_id)
);

-- Index for fast lookup by user
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
