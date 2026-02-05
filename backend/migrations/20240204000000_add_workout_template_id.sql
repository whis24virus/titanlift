-- Add template_id to workouts table to track source template
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES workout_templates(id);
