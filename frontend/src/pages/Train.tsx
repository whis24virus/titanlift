import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchExercises, createWorkout, logSet, listTemplates, getTemplate, finishWorkoutApi, updateTemplateExercises } from '../api/client';
import { useWorkoutStore } from '../hooks/useWorkoutStore';
import { Play, Plus, GripVertical, Info, Dumbbell, Trophy, Medal, Crown } from 'lucide-react';
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

const BADGE_DESCRIPTIONS: Record<string, string> = {
    "Titan Volume": "Lifted over 10,000kg in a single session!",
    "Heavy Lifter": "Lifted over 5,000kg in a single session!",
    "Marathoner": "Trained for over 90 minutes!",
    "Speed Demon": "High volume in under 30 minutes!",
    "Volume Warrior": "Completed 20+ sets!"
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
    const { activeWorkout, sets, startWorkout, addSet, finishWorkout } = useWorkoutStore();
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [exerciseQueue, setExerciseQueue] = useState<QueuedExercise[]>([]);
    const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

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

    const handleFinish = async () => {
        try {
            if (!activeWorkout) return;

            // Smart Routine Update Logic
            if (activeWorkout.template_id) {
                const tmpl = await getTemplate(activeWorkout.template_id);

                // Extract IDs from queue (current state)
                const currentIds = exerciseQueue.map(e => e.id);
                // Extract IDs from template
                const templateIds = tmpl.exercises.map(e => e.exercise_id);

                // Simple comparison: checks if list content/order changed
                const isChanged = JSON.stringify(currentIds) !== JSON.stringify(templateIds);

                if (isChanged) {
                    const shouldUpdate = window.confirm(
                        `You've modified this workout. Do you want to update your "${tmpl.template.name}" split with these changes?\n\nClick OK to Update, Cancel to Keep Original.`
                    );

                    if (shouldUpdate) {
                        // Map queue to update request format
                        const updates = exerciseQueue.map((e, idx) => ({
                            exercise_id: e.id,
                            order_index: idx,
                            target_sets: 3, // Defaulting, ideally tracked per exercise
                            target_reps: 10
                        }));
                        await updateTemplateExercises(activeWorkout.template_id, updates);
                    }
                }
            }

            console.log("Finishing workout:", activeWorkout.id);
            const res = await finishWorkoutApi(activeWorkout.id); // Returns response with badges

            if (res.badges && res.badges.length > 0) {
                setEarnedBadges(res.badges);
            } else {
                finishWorkout();
                window.location.href = '/profile';
            }
        } catch (err: any) {
            console.error("Finish workout failed:", err);
            alert("Finish failed: " + err.message);
        }
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto h-[calc(100vh-100px)] overflow-hidden">
            {reward && <RewardToast message={reward.message} subtext={reward.subtext} onClose={() => setReward(null)} />}

            {earnedBadges.length > 0 && (
                <BadgeModal
                    badges={earnedBadges}
                    onClose={() => {
                        finishWorkout();
                        window.location.href = '/profile';
                    }}
                />
            )}

            {/* Left Col: Queue */}
            <div className="lg:col-span-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden h-full">
                <div className="p-4 border-b border-border bg-muted/20">
                    <h3 className="font-bold flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-emerald-400" />
                        Upcoming Exercises
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
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

                    {/* Simplified "Add Exercise" for demo - could be a full searchable list */}
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
            <div className="lg:col-span-2 flex flex-col space-y-6 h-full overflow-y-auto pb-20">
                <header className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
                    <div>
                        <h2 className="text-xl font-bold">{activeWorkout.name}</h2>
                        <div className="text-sm text-emerald-400 font-mono">
                            <WorkoutTimer startTime={activeWorkout.start_time || new Date().toISOString()} />
                        </div>
                    </div>
                    <button
                        onClick={handleFinish}
                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-medium hover:bg-red-500/20"
                    >
                        Finish
                    </button>
                </header>

                {currentExercise ? (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-right-4">
                        <div className="relative h-48 md:h-64 bg-black/50 overflow-hidden flex items-center justify-center">
                            {currentExercise.animation_url ? (
                                <img
                                    src={currentExercise.animation_url}
                                    alt={currentExercise.name}
                                    className="w-full h-full object-cover opacity-80"
                                />
                            ) : (
                                <Dumbbell className="w-24 h-24 text-muted-foreground/30" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                            <div className="absolute bottom-4 left-6">
                                <h3 className="text-3xl font-bold text-white shadow-black drop-shadow-md">{currentExercise.name}</h3>
                                <p className="text-white/80 flex items-center gap-2 text-sm">
                                    <Info className="w-4 h-4" /> {currentExercise.muscle_group}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="p-4 bg-muted/20 rounded-lg border border-border">
                                    <p className="text-sm text-muted-foreground italic">
                                        "{currentExercise.description || "No description available."}"
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Weight (kg)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-background border border-input rounded-md px-3 py-3 text-lg"
                                            value={weight}
                                            onChange={(e) => setWeight(Number(e.target.value))}
                                            placeholder="0"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Reps</label>
                                        <input
                                            type="number"
                                            className="w-full bg-background border border-input rounded-md px-3 py-3 text-lg"
                                            value={reps}
                                            onChange={(e) => setReps(Number(e.target.value))}
                                            placeholder="0"
                                        />
                                    </div>
                                    <button
                                        onClick={handleLogSet}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                                    >
                                        Log Set
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Session History for {currentExercise.name}</h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {sets.filter(s => s.exercise_id === currentExercise.id).length === 0 && (
                                        <p className="text-sm text-muted-foreground">No sets logged yet.</p>
                                    )}
                                    {[...sets]
                                        .filter(s => s.exercise_id === currentExercise.id)
                                        .reverse()
                                        .map((set, i) => (
                                            <div key={set.id || i} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/50">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono font-bold text-lg">{set.weight_kg}kg</span>
                                                    <span className="text-muted-foreground">x</span>
                                                    <span className="font-mono font-bold text-lg">{set.reps} reps</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {set.is_new_1rm && (
                                                        <div className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                                                            <Crown className="w-3 h-3" /> 1RM
                                                        </div>
                                                    )}
                                                    {set.is_vol_pr && (
                                                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                                                            <Trophy className="w-3 h-3" /> PR
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4 p-8 border border-dashed border-border rounded-xl">
                        <Dumbbell className="w-16 h-16 opacity-20" />
                        <p>Select an exercise from the queue to start lifting.</p>
                    </div>
                )}
            </div>
        </div>
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
