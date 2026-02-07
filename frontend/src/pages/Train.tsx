import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchExercises, createWorkout, logSet, listTemplates, getTemplate, finishWorkoutApi, updateTemplateExercises } from '../api/client';
import { useWorkoutStore } from '../hooks/useWorkoutStore';
import { Play, Plus, GripVertical, Info, Dumbbell, Trophy, Medal, Crown, ListChecks } from 'lucide-react';
import { cn } from '../lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseSelector } from '../components/ExerciseSelector';
import type { Exercise } from '../api/types';

// Hardcoded user ID for demo
const DEMO_USER_ID = "763b9c95-4bae-4044-9d30-7ae513286b37";

interface QueuedExercise extends Exercise {
    queueId: string; // Unique ID for DnD
}

// Fallback images (Anime Style) - Local Assets
const START_IMAGES: Record<string, string> = {
    "Barbell Bench Press": "/images/bench.png",
    "Barbell Squat": "/images/squat.png",
    "Deadlift": "/images/deadlift.png",
    "Overhead Press": "/images/bench.png", // Reusing bench as placeholder
    "Barbell Row": "/images/deadlift.png", // Reusing deadlift as placeholder
    "Pull Up": "/images/deadlift.png",
    "Dumbbell Curl": "/images/bench.png",
};

const BADGE_DESCRIPTIONS: Record<string, string> = {
    "Titan Volume": "Lifted over 10,000kg in a single session!",
    "Heavy Lifter": "Lifted over 5,000kg in a single session!",
    "Marathoner": "Trained for over 90 minutes!",
    "Speed Demon": "High volume in under 30 minutes!",
    "Volume Warrior": "Completed 20+ sets!"
};

// Helper to get image
const getExerciseImage = (ex: any) => {
    if (!ex) return null;
    if (START_IMAGES[ex.name]) return START_IMAGES[ex.name];
    if (ex.animation_url && ex.animation_url.includes('giphy')) return START_IMAGES["Barbell Bench Press"];
    return ex.animation_url;
};

function RewardToast({ message, subtext, onClose }: { message: string, subtext?: string, onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000); // Auto-dismiss
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 border-2 border-yellow-200">
                <Crown className="w-6 h-6 animate-bounce" />
                <div>
                    <h4 className="font-black text-lg uppercase tracking-wider">{message}</h4>
                    {subtext && <p className="text-xs text-yellow-100 font-medium">{subtext}</p>}
                </div>
            </div>
        </div>
    );
}

function BadgeModal({ badges, onClose }: { badges: string[], onClose: () => void }) {
    if (badges.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card w-full max-w-md mx-4 rounded-xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center">
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-black text-white mb-2">Session Complete!</h2>
                    <p className="text-indigo-100">You earned {badges.length} new badges!</p>
                </div>
                <div className="p-6 space-y-4">
                    {badges.map(badge => (
                        <div key={badge} className="flex items-center gap-4 p-4 bg-muted/40 rounded-lg border border-border hover:border-indigo-500/50 transition-colors">
                            <div className="p-3 bg-indigo-500/10 rounded-full">
                                <Medal className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">{badge}</h4>
                                <p className="text-xs text-muted-foreground">{BADGE_DESCRIPTIONS[badge] || "Great Achievement!"}</p>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={onClose}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold"
                    >
                        Awesome!
                    </button>
                </div>
            </div>
        </div>
    );
}

function WorkoutTimer({ startTime }: { startTime: string }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const start = new Date(startTime).getTime();
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return <span className="font-mono text-emerald-400 text-xl font-bold">{formatTime(elapsed)}</span>;
}

export function Train() {
    const { activeWorkout, sets, startWorkout, addSet, finishWorkout, setSets } = useWorkoutStore();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [exerciseQueue, setExerciseQueue] = useState<QueuedExercise[]>([]);
    const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    // Routine Update Modal State
    const [showUpdateRoutine, setShowUpdateRoutine] = useState(false);

    // Reward State
    const [reward, setReward] = useState<{ message: string, subtext: string } | null>(null);
    const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

    // Set input state
    const [weight, setWeight] = useState<number>(0);
    const [reps, setReps] = useState<number>(0);

    const { data: exercises } = useQuery({ queryKey: ['exercises'], queryFn: fetchExercises });
    const { data: templates } = useQuery({ queryKey: ['templates'], queryFn: listTemplates });

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const startMutation = useMutation({
        mutationFn: createWorkout,
        onSuccess: async (workout) => {
            startWorkout(workout);
            // If template selected, load exercises
            if (selectedTemplateId) {
                const tmpl = await getTemplate(selectedTemplateId);
                const queued = tmpl.exercises.map((te, idx) => {
                    const ex = exercises?.find(e => e.id === te.exercise_id);
                    if (!ex) return null;
                    return { ...ex, queueId: `${ex.id}-${Date.now()}-${idx}` };
                }).filter(Boolean) as QueuedExercise[];
                setExerciseQueue(queued);
                if (queued.length > 0) setActiveQueueId(queued[0].queueId);
            }
        }
    });

    const setMutation = useMutation({
        mutationFn: logSet,
        onSuccess: (data) => {
            addSet({ ...data.set, is_new_1rm: data.is_new_1rm, is_vol_pr: data.is_vol_pr });
            if (data.is_new_1rm) {
                setReward({ message: "New 1RM!", subtext: `Heaviest lift for this exercise!` });
            } else if (data.is_vol_pr) {
                setReward({ message: "Rep PR!", subtext: "Most reps at this weight!" });
            }
        }
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setExerciseQueue((items) => {
                const oldIndex = items.findIndex(i => i.queueId === active.id);
                const newIndex = items.findIndex(i => i.queueId === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleLogSet = () => {
        if (!activeWorkout || !activeQueueId) return;
        const currentEx = exerciseQueue.find(q => q.queueId === activeQueueId);
        if (!currentEx) return;

        setMutation.mutate({
            workout_id: activeWorkout.id,
            exercise_id: currentEx.id,
            weight_kg: weight,
            reps: reps
        });
    };

    // Initial check on finish
    const handleFinish = async () => {
        if (!activeWorkout) return;

        // If this workout came from a template, ask to update it
        if (activeWorkout.template_id) {
            setShowUpdateRoutine(true);
            return;
        }

        await completeWorkout();
    };

    const completeWorkout = async () => {
        if (!activeWorkout) return;
        try {
            const res = await finishWorkoutApi(activeWorkout.id);
            finishWorkout(); // Clears activeWorkout from store
            setExerciseQueue([]);
            setSets([]);

            // Show badges if any
            if (res.badges && res.badges.length > 0) {
                setEarnedBadges(res.badges);
            } else {
                if (window.innerWidth < 1024) {
                    // Mobile: go to profile
                    window.location.href = '/profile';
                } else {
                    // Laptop: stay here, show success
                    setReward({ message: "Workout Complete!", subtext: "Great job!" });
                }
            }
        } catch (error) {
            console.error("Failed to finish workout", error);
            alert("Finish failed: " + (error as Error).message);
        }
    };

    const handleUpdateRoutine = async (shouldUpdate: boolean) => {
        if (!shouldUpdate) {
            await completeWorkout();
            setShowUpdateRoutine(false);
            return;
        }

        if (!activeWorkout || !activeWorkout.template_id) return;

        // Smart Inference: Create new template exercises based on what we just did
        const newTemplateExercises = exerciseQueue.map((ex, index) => {
            const exSets = sets.filter(s => s.exercise_id === ex.id);
            const set_count = exSets.length || 3; // Default to 3 if no sets done

            // Average reps (round to nearest integer)
            const avg_reps = exSets.length > 0
                ? Math.round(exSets.reduce((sum, s) => sum + s.reps, 0) / exSets.length)
                : 10;

            // Max weight used
            const max_weight = exSets.length > 0
                ? Math.max(...exSets.map(s => s.weight_kg))
                : 0;

            return {
                exercise_id: ex.id,
                order_index: index,
                target_sets: set_count,
                target_reps: avg_reps,
                target_weight_kg: max_weight > 0 ? max_weight : undefined
            };
        });

        try {
            await updateTemplateExercises(activeWorkout.template_id, newTemplateExercises);
            setReward({ message: "Routine Updated!", subtext: "Your split is now optimized." });
        } catch (err) {
            console.error("Failed to update routine", err);
            alert("Failed to update routine: " + (err as Error).message);
        }

        await completeWorkout();
        setShowUpdateRoutine(false);
    };

    // Derived active exercise
    const currentExercise = exerciseQueue.find(q => q.queueId === activeQueueId);

    if (!activeWorkout) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 p-4">
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-emerald-400 text-transparent bg-clip-text">
                        Ready to Lift?
                    </h2>
                    <p className="text-muted-foreground">Select a split or start fresh.</p>
                </div>

                <div className="w-full max-w-xs space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-sm font-medium text-muted-foreground">Workout Split</label>
                        <Link to="/splits" className="text-xs text-emerald-400 font-bold hover:underline">
                            Manage Splits
                        </Link>
                    </div>
                    <select
                        className="w-full bg-card border border-input rounded-lg px-4 py-3 shadow-sm"
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                    >
                        <option value="">Empty Workout</option>
                        {templates?.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => startMutation.mutate({
                            user_id: DEMO_USER_ID,
                            name: selectedTemplateId ? templates?.find(t => t.id === selectedTemplateId)?.name : "Freestyle Workout",
                            start_time: new Date().toISOString(),
                            template_id: selectedTemplateId || undefined
                        })}
                        disabled={startMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Play fill="currentColor" /> Start
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto h-[calc(100dvh-90px)] lg:h-[calc(100vh-100px)] overflow-hidden">
            {reward && <RewardToast message={reward.message} subtext={reward.subtext} onClose={() => setReward(null)} />}

            {/* Routine Update Modal */}
            {showUpdateRoutine && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card w-full max-w-md mx-4 rounded-xl border border-border shadow-2xl p-6 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                                <Info className="w-6 h-6 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Update Routine?</h3>
                            <p className="text-muted-foreground">
                                You modified this workout. Do you want to update the original routine to match what you just did?
                            </p>
                            <p className="text-xs text-muted-foreground italic">
                                (Updates default sets, reps, and weight)
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleUpdateRoutine(false)}
                                className="px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground font-medium"
                            >
                                No, Keep Original
                            </button>
                            <button
                                onClick={() => handleUpdateRoutine(true)}
                                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20"
                            >
                                Yes, Update Routine
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Left Col: Queue / Selection */}
            <div className={cn(
                "lg:col-span-1 flex flex-col bg-card border border-border rounded-xl eval transition-all duration-300",
                currentExercise ? "hidden lg:flex overflow-hidden" : "h-full overflow-hidden"
            )}>
                <div className="p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-emerald-400" /> Workout Queue
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={exerciseQueue.map(e => e.queueId)}
                            strategy={verticalListSortingStrategy}
                        >
                            {exerciseQueue.map((ex) => (
                                <SortableQueueItem
                                    key={ex.queueId}
                                    exercise={ex}
                                    isActive={ex.queueId === activeQueueId}
                                    onClick={() => setActiveQueueId(ex.queueId)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    <button
                        className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-emerald-500 hover:text-emerald-500 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                        onClick={() => setIsSelectorOpen(true)}
                    >
                        <Plus className="w-4 h-4" /> Add Exercise
                    </button>
                    {isSelectorOpen && (
                        <ExerciseSelector
                            exercises={exercises || []}
                            onClose={() => setIsSelectorOpen(false)}
                            onSelect={(ex) => {
                                const newQ = { ...ex, queueId: `${ex.id}-${Date.now()}` };
                                setExerciseQueue([...exerciseQueue, newQ]);
                                if (!activeQueueId) setActiveQueueId(newQ.queueId);
                                setIsSelectorOpen(false);
                            }}
                        />
                    )}
                    {exerciseQueue.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-4">
                            Queue is empty. Add exercises or start from a split.
                        </p>
                    )}
                </div>
            </div>

            {/* Middle Col: Active Exercise & Logger */}
            <div className="lg:col-span-2 flex flex-col space-y-4 lg:space-y-6 h-full overflow-y-auto pb-40 md:pb-20 custom-scrollbar">

                {/* Mobile Queue Toggle / Header */}
                <header className="flex justify-between items-center bg-card p-4 rounded-xl border border-border sticky top-0 z-10 shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Show back to queue on mobile if active */}
                        {currentExercise && (
                            <button
                                onClick={() => setActiveQueueId(null)}
                                className="lg:hidden p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground"
                            >
                                <GripVertical className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-bold truncate max-w-[150px] md:max-w-[200px]">{activeWorkout.name}</h2>
                            <div className="text-sm text-emerald-400 font-mono">
                                <WorkoutTimer startTime={activeWorkout.start_time || new Date().toISOString()} />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleFinish}
                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-medium hover:bg-red-500/20 whitespace-nowrap"
                    >
                        Finish
                    </button>
                </header>

                {currentExercise ? (
                    <>
                        <div className="group relative bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl transition-all duration-500 hover:bg-card/60 shrink-0 mb-8 z-0">
                            {/* Animated Glow Effect */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 opacity-30 blur-2xl group-hover:opacity-50 transition duration-1000 rounded-3xl"></div>

                            <div className="relative z-10 rounded-3xl overflow-hidden">
                                {/* Compact Banner */}
                                <div className="relative h-24 md:h-64 bg-black/60 overflow-hidden flex items-center justify-center shrink-0">
                                    {getExerciseImage(currentExercise) ? (
                                        <img
                                            src={getExerciseImage(currentExercise)!}
                                            alt={currentExercise.name}
                                            className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                                            <Dumbbell className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                                    <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                        <div>
                                            <h3 className="text-lg md:text-3xl font-black tracking-tight text-white drop-shadow-md line-clamp-1">
                                                {currentExercise.name}
                                            </h3>
                                            <p className="text-emerald-400 font-medium text-[10px] md:text-xs flex items-center gap-2">
                                                <Info className="w-3 h-3" /> {currentExercise.muscle_group}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 md:p-8 flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1 text-center relative group/input">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover/input:text-emerald-400 transition-colors">Weight</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-black/20 border-b-2 border-white/10 rounded-t-lg px-2 py-3 text-2xl font-mono font-bold text-center text-white focus:outline-none focus:border-emerald-500 focus:bg-emerald-500/10 transition-all placeholder:text-white/10"
                                                        value={weight || ''}
                                                        onChange={(e) => setWeight(Number(e.target.value))}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="space-y-1 text-center relative group/input">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover/input:text-emerald-400 transition-colors">Reps</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-black/20 border-b-2 border-white/10 rounded-t-lg px-2 py-3 text-2xl font-mono font-bold text-center text-white focus:outline-none focus:border-emerald-500 focus:bg-emerald-500/10 transition-all placeholder:text-white/10"
                                                        value={reps || ''}
                                                        onChange={(e) => setReps(Number(e.target.value))}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleLogSet}
                                                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black py-3 md:py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base md:text-lg uppercase tracking-wide"
                                            >
                                                <Plus className="w-5 h-5" /> Log
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* History List */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards shrink-0 z-0 relative">
                            <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-emerald-400" />
                                    Sets History
                                </h3>
                                <span className="text-xs text-muted-foreground font-mono">
                                    {sets.filter(s => s.exercise_id === currentExercise.id).length} Sets
                                </span>
                            </div>
                            <div className="divide-y divide-border">
                                {sets.filter(s => s.exercise_id === currentExercise.id).length === 0 ? (
                                    <div className="p-8 text-center space-y-2">
                                        <p className="text-muted-foreground text-sm">No sets logged yet.</p>
                                        <p className="text-xs text-muted-foreground/50">Crush your limits!</p>
                                    </div>
                                ) : (
                                    sets.filter(s => s.exercise_id === currentExercise.id)
                                        .slice().reverse() // Show newest first
                                        .map((set, idx, arr) => (
                                            <div key={set.id || idx} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs font-mono">
                                                        {arr.length - idx}
                                                    </div>
                                                    <div>
                                                        <p className="font-mono font-bold text-xl">
                                                            {set.weight_kg}<span className="text-sm text-muted-foreground ml-1">kg</span>
                                                            <span className="mx-2 text-muted-foreground">×</span>
                                                            {set.reps}<span className="text-sm text-muted-foreground ml-1">reps</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Future: Delete button */}
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4 p-8 border border-dashed border-border rounded-xl">
                        <Dumbbell className="w-16 h-16 opacity-20" />
                        <p className="text-center">Select an exercise from the {window.innerWidth < 1024 ? "queue button above" : "queue on the left"} to start lifting.</p>
                        {/* Mobile: Show button to clear selection if stuck */}
                        <button
                            onClick={() => setActiveQueueId(null)}
                            className="lg:hidden text-emerald-400 hover:underline"
                        >
                            View Queue
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
}

function SortableQueueItem(props: { exercise: QueuedExercise, isActive: boolean, onClick: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: props.exercise.queueId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none",
                props.isActive
                    ? "bg-emerald-500/10 border-emerald-500"
                    : "bg-card border-border hover:border-emerald-500/30"
            )}
            onClick={props.onClick}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div
                    {...attributes}
                    {...listeners}
                    className="touch-none bg-muted hover:bg-muted-foreground/20 p-1 rounded cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()} // Prevent selecting when just grabbing
                >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="truncate">
                    <p className={cn("font-medium truncate", props.isActive && "text-emerald-400")}>
                        {props.exercise.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{props.exercise.muscle_group}</p>
                </div>
            </div>
        </div>
    );
}
