import { useState, useMemo } from 'react';
import { Search, Info, Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Exercise } from '../api/types';
import { Button } from './ui/Button';

interface ExerciseSelectorProps {
    exercises: Exercise[];
    onSelect: (exercise: Exercise) => void;
    onClose: () => void;
}

export function ExerciseSelector({ exercises, onSelect, onClose }: ExerciseSelectorProps) {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = new Set(exercises.map(e => e.muscle_group));
        return ["All", ...Array.from(cats).sort()];
    }, [exercises]);

    // Filter exercises
    const filteredExercises = useMemo(() => {
        return exercises.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = selectedCategory === "All" || ex.muscle_group === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [exercises, search, selectedCategory]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">

                {/* Left: List & Filters */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 bg-black/20">
                    <div className="p-6 border-b border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black italic tracking-tighter text-white">SELECT <span className="text-primary">EXERCISE</span></h3>
                            <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search exercises..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-white placeholder:text-muted-foreground"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300",
                                        selectedCategory === cat
                                            ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                                            : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {filteredExercises.map(ex => (
                            <div
                                key={ex.id}
                                onClick={() => setPreviewExercise(ex)}
                                className={cn(
                                    "p-4 rounded-xl border cursor-pointer transition-all duration-300 flex justify-between items-center group touch-none relative overflow-hidden",
                                    previewExercise?.id === ex.id
                                        ? "bg-primary/10 border-primary/50"
                                        : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                                )}
                            >
                                <div className="min-w-0 pr-2 relative z-10">
                                    <h4 className={cn("font-bold truncate transition-colors", previewExercise?.id === ex.id ? "text-primary" : "text-white")}>
                                        {ex.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">{ex.muscle_group}</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(ex);
                                    }}
                                    className={cn(
                                        "shrink-0 transition-all duration-300",
                                        previewExercise?.id === ex.id ? "opacity-100 bg-primary/20 text-primary" : "opacity-0 group-hover:opacity-100"
                                    )}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {filteredExercises.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No exercises found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="w-full md:w-[450px] bg-black/40 p-0 flex flex-col border-l border-white/5 h-full relative">
                    {previewExercise ? (
                        <>
                            {/* Header Image Area */}
                            <div className="h-[40%] relative group overflow-hidden">
                                {previewExercise.animation_url ? (
                                    <img
                                        src={previewExercise.animation_url}
                                        alt={previewExercise.name}
                                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                        <div className="text-center text-muted-foreground">
                                            <Info className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs uppercase tracking-widest">No Preview</p>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                                    <span className="inline-block px-2 py-1 bg-secondary/20 text-secondary border border-secondary/20 rounded text-[10px] font-black uppercase tracking-widest mb-2 shadow-[0_0_10px_rgba(188,0,255,0.2)]">
                                        {previewExercise.muscle_group}
                                    </span>
                                    <h2 className="text-3xl font-black italic text-white tracking-tighter leading-none mb-1">
                                        {previewExercise.name}
                                    </h2>
                                </div>
                            </div>

                            {/* Details Area */}
                            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto w-full">
                                <div className="space-y-6">
                                    <div className="glass-panel p-5 rounded-2xl border-white/5 bg-white/5">
                                        <h4 className="font-bold flex items-center gap-2 text-sm text-white mb-3">
                                            <Info className="w-4 h-4 text-primary" /> INSTRUCTIONS
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {previewExercise.description || "No specific instructions provided for this exercise. Focus on form and controlled movement."}
                                        </p>
                                    </div>

                                    {/* Quick Stats or Tips could go here */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                            <span className="block text-[10px] text-muted-foreground uppercase tracking-widest">Target</span>
                                            <span className="text-white font-bold">Hypertrophy</span>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                            <span className="block text-[10px] text-muted-foreground uppercase tracking-widest">Rest</span>
                                            <span className="text-white font-bold">90-120s</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 mt-auto w-full">
                                    <Button
                                        onClick={() => onSelect(previewExercise)}
                                        className="w-full shadow-neon"
                                        size="lg"
                                        variant="primary"
                                        glow
                                    >
                                        <Plus className="w-5 h-5 mr-2" /> ADD TO WORKOUT
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground space-y-6 p-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50" />
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center relative z-10 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                <Info className="w-10 h-10 text-white/20" />
                            </div>
                            <div className="relative z-10 max-w-xs">
                                <h3 className="font-bold text-xl text-white mb-2">Select an Exercise</h3>
                                <p className="text-sm text-muted-foreground/70">
                                    Choose an exercise from the list to view detailed instructions, muscle targeting, and proper form techniques.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
