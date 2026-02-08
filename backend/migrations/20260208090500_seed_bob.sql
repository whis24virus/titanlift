-- Seed Bob user
INSERT INTO users (id, username, password_hash, created_at, bio)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'BobLifter',
    'hashed_password', 
    NOW(),
    'Squatting daily'
) ON CONFLICT DO NOTHING;
