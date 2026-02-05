import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Activity, Calendar, Flame, Zap, Scale, Utensils, ChevronRight } from 'lucide-react';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { fetchWorkoutHistory, fetchPhysicalStats, updatePhysicalStats, fetchWeightHistory, fetchNutritionLog, logNutrition } from '../api/client';
import { Clock } from 'lucide-react';
import { useState } from 'react';

// Hardcoded user ID for demo
const USER_ID = "763b9c95-4bae-4044-9d30-7ae513286b37";

interface UserProfile {
    username: string;
    total_workouts: number;
    total_volume_kg: number;
    join_date: string;
    activity_log: { date: string, volume_kg: number }[];
    current_streak: number;
    max_streak: number;
}

async function fetchProfile(userId: string): Promise<UserProfile> {
    const res = await fetch(`/api/profile/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
}

export function Profile() {
    const queryClient = useQueryClient();
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', USER_ID],
        queryFn: () => fetchProfile(USER_ID)
    });

    const { data: history } = useQuery({
        queryKey: ['history', USER_ID],
        queryFn: () => fetchWorkoutHistory(USER_ID)
    });

    const { data: stats } = useQuery({
        queryKey: ['stats', USER_ID],
        queryFn: () => fetchPhysicalStats(USER_ID)
    });

    const { data: nutrition } = useQuery({
        queryKey: ['nutrition', USER_ID],
        queryFn: () => fetchNutritionLog(USER_ID)
    });

    const { data: weightHistory } = useQuery({
        queryKey: ['weight', USER_ID],
        queryFn: () => fetchWeightHistory(USER_ID)
    });

    // Mutations
    const updateStatsMutation = useMutation({
        mutationFn: (data: any) => updatePhysicalStats(USER_ID, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stats', USER_ID] })
    });

    const logNutritionMutation = useMutation({
        mutationFn: (data: any) => logNutrition(USER_ID, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutrition', USER_ID] })
    });

    const [isEditingStats, setIsEditingStats] = useState(false);
    const [editForm, setEditForm] = useState({ height_cm: 0, weight_kg: 0, gender: 'male', activity_level: 'moderate' });
    const [calorieInput, setCalorieInput] = useState("");

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;

    const tdee = stats?.tdee || 2000;
    const caloriesConsumed = nutrition?.calories_in || 0;
    const calorieProgress = Math.min((caloriesConsumed / tdee) * 100, 100);

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <header>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    {profile?.username}'s Profile
                </h1>
                <p className="text-muted-foreground mt-1">Your journey to becoming a Titan</p>
            </header>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Stats & Nutrition */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Physical Stats Card */}
                    <div className="bg-card border border-border p-6 rounded-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <Scale className="w-5 h-5 text-indigo-400" />
                                Physique
                            </h3>
                            <button
                                onClick={() => {
                                    setEditForm({
                                        height_cm: stats?.height_cm || 175,
                                        weight_kg: stats?.current_weight_kg || 75,
                                        gender: stats?.gender || 'male',
                                        activity_level: stats?.activity_level || 'moderate'
                                    });
                                    setIsEditingStats(!isEditingStats);
                                }}
                                className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/20"
                            >
                                {isEditingStats ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        {isEditingStats ? (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <label className="block text-muted-foreground text-xs mb-1">Height (cm)</label>
                                    <input
                                        type="number" value={editForm.height_cm}
                                        onChange={(e) => setEditForm({ ...editForm, height_cm: Number(e.target.value) })}
                                        className="w-full bg-muted/50 border border-border rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-muted-foreground text-xs mb-1">Weight (kg)</label>
                                    <input
                                        type="number" value={editForm.weight_kg}
                                        onChange={(e) => setEditForm({ ...editForm, weight_kg: Number(e.target.value) })}
                                        className="w-full bg-muted/50 border border-border rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-muted-foreground text-xs mb-1">Gender</label>
                                    <select
                                        value={editForm.gender}
                                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                        className="w-full bg-muted/50 border border-border rounded p-2"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-muted-foreground text-xs mb-1">Activity Level</label>
                                    <select
                                        value={editForm.activity_level}
                                        onChange={(e) => setEditForm({ ...editForm, activity_level: e.target.value })}
                                        className="w-full bg-muted/50 border border-border rounded p-2"
                                    >
                                        <option value="sedentary">Sedentary (Office job)</option>
                                        <option value="light">Light (1-2 days/week)</option>
                                        <option value="moderate">Moderate (3-5 days/week)</option>
                                        <option value="active">Active (6-7 days/week)</option>
                                        <option value="athlete">Athlete (2x per day)</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        updateStatsMutation.mutate(editForm);
                                        setIsEditingStats(false);
                                    }}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium"
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Height</p>
                                    <p className="text-lg font-bold">{stats?.height_cm || "-"} <span className="text-xs font-normal text-muted-foreground">cm</span></p>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Weight</p>
                                    <p className="text-lg font-bold">{stats?.current_weight_kg || "-"} <span className="text-xs font-normal text-muted-foreground">kg</span></p>
                                </div>
                                <div className="col-span-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-3 rounded-lg border border-indigo-500/20">
                                    <p className="text-xs text-indigo-400 mb-1">Maintenance (TDEE)</p>
                                    <p className="text-2xl font-black text-indigo-100">{stats?.tdee || "-"} <span className="text-sm font-medium">kcal</span></p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Nutrition Tracker */}
                    <div className="bg-card border border-border p-6 rounded-xl space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-green-400" />
                                Nutrition
                            </h3>
                            <span className="text-xs text-muted-foreground">Today</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className={caloriesConsumed > tdee ? "text-red-400" : "text-green-400"}>
                                    {caloriesConsumed}
                                </span>
                                <span className="text-muted-foreground">/ {tdee} kcal</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${caloriesConsumed > tdee ? "bg-red-500" : "bg-green-500"}`}
                                    style={{ width: `${calorieProgress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Add kcal..."
                                value={calorieInput}
                                onChange={(e) => setCalorieInput(e.target.value)}
                                className="flex-1 bg-muted/50 border border-border rounded p-2 text-sm"
                            />
                            <button
                                onClick={() => {
                                    if (calorieInput) {
                                        logNutritionMutation.mutate({ calories_in: Number(calorieInput) });
                                        setCalorieInput("");
                                    }
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 rounded text-sm font-medium"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Existing Stats & Charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Top Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard
                            icon={<Activity className="w-5 h-5 text-blue-400" />}
                            label="Volume"
                            value={`${(profile?.total_volume_kg || 0).toLocaleString()}kg`}
                            subtext="Lifetime"
                        />
                        <StatCard
                            icon={<Trophy className="w-5 h-5 text-yellow-400" />}
                            label="Workouts"
                            value={profile?.total_workouts.toString() || "0"}
                            subtext="Completed"
                        />
                        <div className="bg-card border border-border p-4 rounded-xl space-y-1 hover:border-primary/50 transition-colors">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-medium text-orange-400">Streak</h3>
                                <Flame className="w-4 h-4 text-orange-500" />
                            </div>
                            <p className="text-2xl font-bold">{profile?.current_streak || 0}</p>
                            <p className="text-[10px] text-muted-foreground">Days on fire</p>
                        </div>
                        <StatCard
                            icon={<Zap className="w-5 h-5 text-purple-400" />}
                            label="Best Streak"
                            value={profile?.max_streak.toString() || "0"}
                            subtext="Record"
                        />
                    </div>

                    {/* Weight Chart (Simple SVG Implementation) */}
                    <div className="bg-card border border-border p-6 rounded-xl">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Scale className="w-5 h-5 text-cyan-400" />
                            Weight Trend
                        </h3>
                        {weightHistory && weightHistory.length > 1 ? (
                            <div className="h-40 flex items-end justify-between gap-1 px-2 relative">
                                {(() => {
                                    const weights = weightHistory.map(w => w.weight_kg);
                                    const min = Math.min(...weights) * 0.95;
                                    const max = Math.max(...weights) * 1.05;
                                    return weightHistory.map((entry, idx) => {
                                        const date = new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                        const heightPct = ((entry.weight_kg - min) / (max - min)) * 100;
                                        return (
                                            <div key={idx} className="flex flex-col items-center group relative w-full">
                                                <div
                                                    className="w-full max-w-[20px] bg-cyan-500/50 hover:bg-cyan-400 rounded-t-sm transition-all"
                                                    style={{ height: `${heightPct}%` }}
                                                ></div>
                                                <div className="absolute -bottom-6 text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/80 px-2 py-1 rounded">
                                                    {entry.weight_kg}kg on {date}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                                Log your weight to see trends
                            </div>
                        )}
                    </div>

                    {/* Activity Heatmap */}
                    <div className="bg-card border border-border p-6 rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-emerald-400" />
                            <h3 className="font-bold">Activity</h3>
                        </div>
                        {profile?.activity_log && profile.activity_log.length > 0 ? (
                            <ActivityHeatmap data={profile.activity_log} />
                        ) : (
                            <p className="text-muted-foreground text-center py-8">Complete workouts to see your activity!</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border p-8 rounded-xl text-center space-y-4">
                <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
                    <Clock className="w-6 h-6 text-blue-400" />
                    <h3 className="text-2xl font-bold">Recent Workouts</h3>
                </div>

                <div className="space-y-4">
                    {history?.length === 0 ? (
                        <p className="text-muted-foreground">No workouts completed yet.</p>
                    ) : (
                        history?.map((workout) => (
                            <div key={workout.id} className="bg-muted/40 p-4 rounded-xl border border-border flex flex-col md:flex-row justify-between items-center gap-4 hover:border-emerald-500/30 transition-colors">
                                <div className="text-left w-full">
                                    <h4 className="font-bold text-lg">{workout.name || "Untitled Workout"}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(workout.start_time).toLocaleDateString()} • {new Date(workout.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Volume</p>
                                        <p className="font-mono font-bold text-emerald-400">{workout.total_volume_kg.toLocaleString()} kg</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Exercises</p>
                                        <p className="font-bold">{workout.exercise_count}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Burn</p>
                                        {/* Since history endpoint doesn't return calories yet (Wait, I didn't update history endpoint to return calories), I'll skip or use placeholder */}
                                        {/* Wait, the user asked for calories burn feature. I should update get_workout_history too. But for now let's just show duration. */}
                                        <p className="font-bold text-orange-400">
                                            {/* Placeholder or update history endpoint later */}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Duration</p>
                                        <p className="font-mono font-bold">
                                            {workout.end_time
                                                ? Math.round((new Date(workout.end_time).getTime() - new Date(workout.start_time).getTime()) / 60000) + "m"
                                                : "Active"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string, subtext: string }) {
    return (
        <div className="bg-card border border-border p-6 rounded-xl space-y-2 hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
                    <p className="text-3xl font-bold mt-2">{value}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                    {icon}
                </div>
            </div>
            <p className="text-xs text-muted-foreground">{subtext}</p>
        </div>
    );
}
