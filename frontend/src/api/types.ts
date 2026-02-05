export interface Exercise {
    id: string;
    name: string;
    muscle_group: string;
    equipment: string | null;
    animation_url: string | null;
    description: string | null;
}

export interface Workout {
    id: string;
    user_id: string;
    name: string | null;
    start_time: string | null;
    end_time: string | null;
    notes: string | null;
    template_id?: string;
}

export interface Set {
    id: string;
    workout_id: string;
    exercise_id: string;
    weight_kg: number;
    reps: number;
    rpe: number | null;
    is_new_1rm?: boolean;
    is_vol_pr?: boolean;
}

export interface CreateWorkoutRequest {
    user_id: string;
    name?: string;
    start_time?: string; // ISO string
    template_id?: string;
}

export interface LogSetRequest {
    workout_id: string;
    exercise_id: string;
    weight_kg: number;
    reps: number;
    rpe?: number;
}

export interface LogSetResponse {
    set: Set;
    is_new_1rm: boolean;
    is_vol_pr: boolean;
}

export interface FinishWorkoutResponse {
    id: string;
    end_time: string;
    badges: string[];
}

export interface WorkoutTemplate {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    created_at: string;
}

export interface TemplateExercise {
    id: string;
    template_id: string;
    exercise_id: string;
    order_index: number;
    target_sets: number;
    target_reps: number;
    target_weight_kg: number | null;
}

export interface CreateTemplateRequest {
    user_id: string;
    name: string;
    description?: string;
}

export interface AddTemplateExerciseRequest {
    exercise_id: string;
    order_index: number;
    target_sets: number;
    target_reps: number;
    target_weight_kg?: number;
}

export interface TemplateWithExercises {
    template: WorkoutTemplate;
    exercises: (TemplateExercise & { exercise_name: string })[];
}

export interface PhysicalStats {
    height_cm: number | null;
    current_weight_kg: number | null;
    gender: string | null;
    date_of_birth: string | null;
    activity_level: string | null;
    bmr: number | null;
    tdee: number | null;
}

export interface UpdateStatsRequest {
    height_cm?: number;
    weight_kg?: number;
    gender?: string;
    date_of_birth?: string;
    activity_level?: string;
}

export interface WeightHistoryEntry {
    date: string;
    weight_kg: number;
}

export interface NutritionLog {
    id: string;
    log_date: string;
    calories_in: number;
    protein_g: number | null;
    carbs_g: number | null;
    fats_g: number | null;
}

export interface LogNutritionRequest {
    calories_in: number;
    protein_g?: number;
    carbs_g?: number;
    fats_g?: number;
}

export interface UserBadge {
    id: string;
    user_id: string;
    workout_id?: string;
    badge_name: string;
    earned_at: string;
}
