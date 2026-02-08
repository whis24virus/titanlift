import type { Exercise, CreateWorkoutRequest, Workout, LogSetRequest, Set, CreateTemplateRequest, WorkoutTemplate, AddTemplateExerciseRequest, TemplateExercise, TemplateWithExercises, PhysicalStats, UpdateStatsRequest, WeightHistoryEntry, NutritionLog, LogNutritionRequest, FinishWorkoutResponse, LogSetResponse, UserBadge } from "./types";

const API_BASE = "/api";

export async function fetchExercises(): Promise<Exercise[]> {
    const res = await fetch(`${API_BASE}/exercises`);
    if (!res.ok) throw new Error("Failed to fetch exercises");
    return res.json();
}

export async function createWorkout(data: CreateWorkoutRequest): Promise<Workout> {
    const res = await fetch(`${API_BASE}/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create workout");
    return res.json();
}



export async function logSet(data: LogSetRequest): Promise<LogSetResponse> {
    const res = await fetch(`${API_BASE}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to log set");
    return res.json();
}

export async function fetchAllSets(): Promise<Set[]> {
    const res = await fetch(`${API_BASE}/sets`);
    if (!res.ok) throw new Error("Failed to fetch sets");
    return res.json();
}



export async function createTemplate(data: CreateTemplateRequest): Promise<WorkoutTemplate> {
    const res = await fetch(`${API_BASE}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create template");
    return res.json();
}

export async function listTemplates(): Promise<WorkoutTemplate[]> {
    const res = await fetch(`${API_BASE}/templates`);
    if (!res.ok) throw new Error("Failed to list templates");
    return res.json();
}

export async function addTemplateExercise(templateId: string, data: AddTemplateExerciseRequest): Promise<TemplateExercise> {
    const res = await fetch(`${API_BASE}/templates/${templateId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add exercise to template");
    return res.json();
}

export async function updateTemplateExercises(templateId: string, exercises: AddTemplateExerciseRequest[]): Promise<TemplateExercise[]> {
    const res = await fetch(`${API_BASE}/templates/${templateId}/exercises`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercises }),
    });
    if (!res.ok) throw new Error("Failed to update template exercises");
    return res.json();
}



export async function getTemplate(id: string): Promise<TemplateWithExercises> {
    const res = await fetch(`${API_BASE}/templates/${id}`);
    if (!res.ok) throw new Error("Failed to fetch template");
    return res.json();
}


export interface WorkoutHistoryEntry {
    id: string;
    name: string | null;
    start_time: string;
    end_time: string | null;
    total_volume_kg: number;
    exercise_count: number;
}

export async function fetchWorkoutHistory(userId: string): Promise<WorkoutHistoryEntry[]> {
    const res = await fetch(`${API_BASE}/profile/${userId}/history`);
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
}

export async function finishWorkoutApi(workoutId: string): Promise<FinishWorkoutResponse> {
    const res = await fetch(`${API_BASE}/workouts/${workoutId}/finish`, {
        method: "POST"
    });
    if (!res.ok) throw new Error("Failed to finish workout");
    return res.json();
}



export async function fetchPhysicalStats(userId: string): Promise<PhysicalStats> {
    const res = await fetch(`${API_BASE}/profile/${userId}/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
}

export async function updatePhysicalStats(userId: string, data: UpdateStatsRequest): Promise<PhysicalStats> {
    const res = await fetch(`${API_BASE}/profile/${userId}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update stats");
    return res.json();
}

export async function fetchWeightHistory(userId: string): Promise<WeightHistoryEntry[]> {
    const res = await fetch(`${API_BASE}/profile/${userId}/weight`);
    if (!res.ok) throw new Error("Failed to fetch weight history");
    return res.json();
}

export async function fetchNutritionLog(userId: string): Promise<NutritionLog | null> {
    const res = await fetch(`${API_BASE}/profile/${userId}/nutrition`);
    if (!res.ok) throw new Error("Failed to fetch nutrition log");
    return res.json();
}

export async function logNutrition(userId: string, data: LogNutritionRequest): Promise<NutritionLog> {
    const res = await fetch(`${API_BASE}/profile/${userId}/nutrition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to log nutrition");
    return res.json();
}

export async function fetchUserBadges(userId: string): Promise<UserBadge[]> {
    const res = await fetch(`${API_BASE}/profile/${userId}/badges`);
    if (!res.ok) throw new Error("Failed to fetch badges");
    return res.json();
}

export const getSocialProfile = async (targetId: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/social/profile/${targetId}`);
    if (!response.ok) throw new Error('Failed to fetch social profile');
    return response.json();
};

export const updateSocialProfile = async (data: { bio?: string, instagram?: string, twitter?: string }) => {
    const response = await fetch(`${API_BASE}/social/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response;
};

export const searchUsers = async (query: string) => {
    const response = await fetch(`${API_BASE}/social/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
};

export const followUser = async (targetId: string) => {
    const response = await fetch(`${API_BASE}/social/follow/${targetId}`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to follow user');
    return response;
};

export const unfollowUser = async (targetId: string) => {
    const response = await fetch(`${API_BASE}/social/follow/${targetId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to unfollow user');
    return response;
};
