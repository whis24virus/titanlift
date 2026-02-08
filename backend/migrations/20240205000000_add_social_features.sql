-- Create follows table
CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Create posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL, -- Optional link to a workout
    content TEXT,
    media_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add social fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
