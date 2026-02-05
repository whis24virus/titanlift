-- Clear existing exercises to avoid duplicates/conflicts and clean slate
DELETE FROM sets; -- Delete dependent sets first
DELETE FROM template_exercises; -- Delete dependent rows first
DELETE FROM exercises;

INSERT INTO exercises (name, muscle_group, equipment, animation_url, description) VALUES
-- Chest
('Barbell Bench Press', 'Chest', 'Barbell', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gifs', 'Lie on a flat bench and press a weighted barbell up.'),
('Incline Dumbbell Press', 'Chest', 'Dumbbell', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/l41Yy4J96X8fuM/giphy.gif', 'Press dumbbells on an inclined bench to target upper chest.'),
('Push Up', 'Chest', 'None', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'Classic bodyweight push movement.'),

-- Back
('Pull Up', 'Back', 'Pull-up Bar', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'Pull your body up until your chin clears the bar.'),
('Barbell Row', 'Back', 'Barbell', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'Bend over and row the barbell to your lower chest.'),
('Lat Pulldown', 'Back', 'Cable', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'Pull the bar down to your chest while seated.'),

-- Legs
('Barbell Squat', 'Legs', 'Barbell', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'The king of leg exercises. Squat down and stand back up.'),
('Deadlift', 'Legs', 'Barbell', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'Lift a loaded barbell off the ground to the hips.'),
('Leg Press', 'Legs', 'Machine', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'Push the weight away using your legs on a machine.'),
('Romanian Deadlift', 'Legs', 'Barbell', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'Hinge at the hips to lower the bar, targeting hamstrings.'),

-- Shoulders
('Overhead Press', 'Shoulders', 'Barbell', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'Press the barbell overhead from a standing position.'),
('Lateral Raise', 'Shoulders', 'Dumbbell', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'Raise dumbbells to the side to target side delts.'),

-- Arms
('Bicep Curl', 'Arms', 'Dumbbell', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'Curl the weight up towards your shoulders.'),
('Tricep Pushdown', 'Arms', 'Cable', 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm11ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmx5ZmEzYmw/3o7TQAHzC4xH7WlWxy/giphy.gif', 'Push the cable attachment down to extend arms.');
