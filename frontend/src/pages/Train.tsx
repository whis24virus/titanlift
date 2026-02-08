import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchExercises, createWorkout, logSet, listTemplates, getTemplate, finishWorkoutApi, updateTemplateExercises } from '../api/client';
import { useWorkoutStore } from '../hooks/useWorkoutStore';
import { Play, Plus, GripVertical, Info, Dumbbell, Trophy, Medal, Crown, ListChecks, ChevronRight, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseSelector } from '../components/ExerciseSelector';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { Exercise } from '../api/types';

// Hardcoded user ID for demo
const DEMO_USER_ID = "763b9c95-4bae-4044-9d30-7ae513286b37";

interface QueuedExercise extends Exercise {
    queueId: string; // Unique ID for DnD
}

const BADGE_DESCRIPTIONS: Record<string, string> = {
    "Titan Volume": "Lifted 10,000kg in one session!",
    "Heavy Lifter": "Lifted 5,000kg in one session!",
    "Marathoner": "Workout lasted over 90 minutes!",
    "Speed Demon": "Fast and heavy lifting!",
    "Volume Warrior": "Completed 20+ sets!",
};

// Fallback images (Anime Style) - Local Assets removed as we use CSS gradients now

function RewardToast({ message, subtext, onClose }: { message: string, subtext?: string, onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000); // Auto-dismiss
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
            <div className="glass-panel px-6 py-4 rounded-full shadow-[0_0_30px_rgba(255,140,0,0.4)] flex items-center gap-4 border border-accent/30 bg-black/60 backdrop-blur-xl">
                <div className="p-2 bg-accent/20 rounded-full">
                    <Crown className="w-5 h-5 text-accent animate-pulse" />
                </div>
                <div>
                    <h4 className="font-black text-sm uppercase tracking-wider text-white">{message}</h4>
                    {subtext && <p className="text-[10px] text-accent font-medium tracking-wide">{subtext}</p>}
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

    return <span className="font-mono text-primary text-xl font-bold tracking-wider drop-shadow-[0_0_5px_rgba(0,242,255,0.5)]">{formatTime(elapsed)}</span>;
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_earnedBadges, _setEarnedBadges] = useState<string[]>([]);

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
                _setEarnedBadges(res.badges);
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
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 p-4 relative">
                {/* Background decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse-slow" />

                <div className="text-center space-y-4 relative z-10">
                    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white">
                        READY TO <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">LIFT?</span>
                    </h2>
                    <p className="text-muted-foreground font-mono uppercase tracking-widest text-sm">Select a protocol or initiate freestyle sequence.</p>
                </div>

                <div className="w-full max-w-md space-y-6 relative z-10">
                    <Card className="p-1 gap-1 flex flex-col bg-black/40 border-white/10 backdrop-blur-xl">
                        <div className="flex justify-between items-center px-4 py-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Protocol</label>
                            <Link to="/splits" className="text-[10px] text-primary font-bold hover:underline tracking-wider uppercase flex items-center gap-1">
                                Manage Splits <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-lg font-bold text-white focus:outline-none focus:border-primary/50 transition-colors"
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                        >
                            <option value="" className="bg-slate-900 text-muted-foreground">Freestyle Workout (Empty)</option>
                            {templates?.map(t => (
                                <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>
                            ))}
                        </select>
                    </Card>

                    <Button
                        onClick={() => startMutation.mutate({
                            user_id: DEMO_USER_ID,
                            name: selectedTemplateId ? templates?.find(t => t.id === selectedTemplateId)?.name : "Freestyle Workout",
                            start_time: new Date().toISOString(),
                            template_id: selectedTemplateId || undefined
                        })}
                        disabled={startMutation.isPending}
                        variant="primary"
                        size="lg"
                        glow
                        className="w-full h-16 text-xl font-black italic tracking-wider shadow-neon"
                    >
                        <Play fill="currentColor" className="mr-3 w-6 h-6" /> INITIATE WORKOUT
                    </Button>
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
                "lg:col-span-1 flex flex-col glass-panel rounded-3xl border-white/5 overflow-hidden transition-all duration-300 relative",
                currentExercise ? "hidden lg:flex" : "h-full"
            )}>
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                <div className="p-5 border-b border-white/5 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center bg-black/20">
                    <h2 className="font-black italic tracking-tighter text-lg flex items-center gap-2 text-white">
                        <ListChecks className="w-5 h-5 text-primary" /> QUEUE
                    </h2>
                    <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded text-muted-foreground">{exerciseQueue.length} ITEMS</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
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

                    <Button
                        variant="ghost"
                        className="w-full border border-dashed border-white/10 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 h-12 dashed-border"
                        onClick={() => setIsSelectorOpen(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" /> ADD EXERCISE
                    </Button>

                    {isSelectorOpen && (
                        <ExerciseSelector
                            exercises={exercises || []}
                            onClose={() => setIsSelectorOpen(false)}
                            onSelect={(ex: Exercise) => {
                                const newQ = { ...ex, queueId: `${ex.id}-${Date.now()}` };
                                setExerciseQueue([...exerciseQueue, newQ]);
                                if (!activeQueueId) setActiveQueueId(newQ.queueId);
                                setIsSelectorOpen(false);
                            }}
                        />
                    )}

                    {exerciseQueue.length === 0 && (
                        <div className="text-center py-8 space-y-2 opacity-50">
                            <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto" />
                            <p className="text-xs text-muted-foreground">Queue is empty.</p>
                        </div>
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
                        {/* Active Exercise Banner */}
                        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -z-10 group-hover:bg-primary/20 transition-colors duration-700" />

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-1 bg-secondary/20 text-secondary border border-secondary/20 rounded text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(188,0,255,0.2)]">
                                            {currentExercise.muscle_group}
                                        </span>
                                        {exerciseQueue.length > 1 && (
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                NEXT: {exerciseQueue.find(e => e.queueId !== activeQueueId)?.name}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black italic text-white tracking-tighter leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                                        {currentExercise.name}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden md:block">
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Session Timer</div>
                                        <WorkoutTimer startTime={activeWorkout.start_time || new Date().toISOString()} />
                                    </div>
                                </div>
                            </div>

                            {/* Instructions/Video Toggle could go here, for now just simple info */}
                            {currentExercise.description && (
                                <div className="bg-black/20 border border-white/5 rounded-xl p-4 mb-6 backdrop-blur-sm">
                                    <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-3xl">
                                        <Info className="w-3 h-3 inline mr-2 text-primary" />
                                        {currentExercise.description}
                                    </p>
                                </div>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                                    <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sets</span>
                                    <span className="text-xl md:text-2xl font-bold text-white">{sets.filter(s => s.exercise_id === currentExercise.id).length}</span>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                                    <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Max W</span>
                                    <span className="text-xl md:text-2xl font-bold text-white">
                                        {Math.max(0, ...sets.filter(s => s.exercise_id === currentExercise.id).map(s => s.weight_kg || 0))}
                                        <span className="text-xs font-normal text-muted-foreground ml-1">kg</span>
                                    </span>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                                    <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Vol</span>
                                    <span className="text-xl md:text-2xl font-bold text-white">
                                        {sets.filter(s => s.exercise_id === currentExercise.id).reduce((acc, s) => acc + (s.weight_kg || 0) * (s.reps || 0), 0) / 1000}
                                        <span className="text-xs font-normal text-muted-foreground ml-1">k</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleLogSet();
                            }}
                            className="glass-panel p-6 rounded-3xl border-white/10 space-y-6"
                        >
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1 text-center relative group/input">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover/input:text-primary transition-colors">Weight</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/20 border-b-2 border-white/10 rounded-t-lg px-2 py-3 text-2xl font-mono font-bold text-center text-white focus:outline-none focus:border-primary focus:bg-primary/10 transition-all placeholder:text-white/10"
                                        value={weight || ''}
                                        onChange={(e) => setWeight(Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1 text-center relative group/input">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover/input:text-secondary transition-colors">Reps</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/20 border-b-2 border-white/10 rounded-t-lg px-2 py-3 text-2xl font-mono font-bold text-center text-white focus:outline-none focus:border-secondary focus:bg-secondary/10 transition-all placeholder:text-white/10"
                                        value={reps || ''}
                                        onChange={(e) => setReps(Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                glow
                                className="w-full h-14 text-lg font-black italic tracking-wider shadow-neon"
                                disabled={setMutation.isPending}
                            >
                                <Plus className="w-6 h-6 mr-2" /> LOG SET
                            </Button>
                        </form>

                        {/* History List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground pl-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Session History
                            </h3>
                            <div className="space-y-2">
                                {sets
                                    .filter(s => s.exercise_id === currentExercise.id)
                                    .slice().reverse() // Show newest first
                                    .map((set, idx) => (
                                        <div key={set.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group animate-in slide-in-from-top-2 fill-mode-both" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    #{sets.filter(s => s.exercise_id === currentExercise.id).length - idx}
                                                </div>
                                                <div>
                                                    <span className="text-xl font-bold text-white">{set.weight_kg}<span className="text-sm font-normal text-muted-foreground ml-1">kg</span></span>
                                                    <span className="mx-2 text-muted-foreground/30">×</span>
                                                    <span className="text-xl font-bold text-white">{set.reps}<span className="text-sm font-normal text-muted-foreground ml-1">reps</span></span>
                                                </div>
                                            </div>
                                            {/* RPE or other stats could go here */}
                                        </div>
                                    ))}
                                {sets.filter(s => s.exercise_id === currentExercise.id).length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm italic">
                                        No sets logged yet. Crush it!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Finish Button at bottom of mobile view inside the scrollable area */}
                        <div className="lg:hidden pb-safe">
                            <Button
                                onClick={handleFinish}
                                variant="secondary"
                                size="lg"
                                className="w-full shadow-neon-purple mt-8"
                            >
                                FINISH WORKOUT
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground space-y-4 p-8 border border-dashed border-white/10 rounded-3xl bg-white/5 opacity-50">
                        <Dumbbell className="w-16 h-16 opacity-30 stroke-1" />
                        <p className="text-sm font-medium">Select an exercise from the {window.innerWidth < 1024 ? "queue button above" : "queue on the left"} to start lifting.</p>
                        <button
                            onClick={() => setIsSelectorOpen(true)}
                            className="text-primary hover:underline text-xs font-bold uppercase tracking-wider"
                        >
                            Open Library
                        </button>
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
                "group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer select-none relative overflow-hidden",
                props.isActive
                    ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(0,242,255,0.15)]"
                    : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
            )}
            onClick={props.onClick}
        >
            {/* Active Indicator Bar */}
            {props.isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary box-shadow-neon" />}

            <div className="flex items-center gap-3 overflow-hidden pl-2">
                <div
                    {...attributes}
                    {...listeners}
                    className="touch-none bg-white/5 hover:bg-white/10 p-1.5 rounded-md cursor-grab active:cursor-grabbing text-muted-foreground hover:text-white transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="w-4 h-4" />
                </div>
                <div className="truncate">
                    <p className={cn("font-bold truncate text-sm transition-colors", props.isActive ? "text-white" : "text-muted-foreground group-hover:text-white")}>
                        {props.exercise.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 truncate font-mono uppercase tracking-wide">{props.exercise.muscle_group}</p>
                </div>
            </div>

            <ChevronRight className={cn("w-4 h-4 transition-all", props.isActive ? "text-primary translate-x-0" : "text-transparent -translate-x-2 group-hover:text-white/20 group-hover:translate-x-0")} />
        </div>
    );
}
