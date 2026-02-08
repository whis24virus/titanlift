-- Seed demo user
INSERT INTO users (id, username, password_hash, created_at, bio, instagram_handle, twitter_handle)
VALUES (
    '763b9c95-4bae-4044-9d30-7ae513286b37',
    'DemoUser',
    'hashed_password', -- In real app use correct hash
    NOW(),
    'Your journey to becoming a Titan',
    'titanlift_official',
    'titanlift'
) ON CONFLICT DO NOTHING;
