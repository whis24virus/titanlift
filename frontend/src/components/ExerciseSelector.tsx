import { useState, useMemo } from 'react';
import { Search, Info, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Exercise } from '../api/types';

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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Left: List & Filters */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-border">
                    <div className="p-6 border-b border-border space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Select Exercise</h3>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">Close</button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search exercises..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-muted/50 border border-input rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                                        selectedCategory === cat
                                            ? "bg-emerald-500 text-white"
                                            : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
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
                                    "p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center group touch-none",
                                    previewExercise?.id === ex.id
                                        ? "bg-emerald-500/10 border-emerald-500"
                                        : "bg-card border-border hover:border-emerald-500/30"
                                )}
                            >
                                <div className="min-w-0 pr-2">
                                    <h4 className="font-semibold truncate">{ex.name}</h4>
                                    <p className="text-xs text-muted-foreground">{ex.muscle_group}</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(ex);
                                    }}
                                    className="md:opacity-0 md:group-hover:opacity-100 opacity-100 bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-all transform active:scale-95 shrink-0"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
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
                <div className="w-full md:w-[400px] bg-muted/10 p-6 flex flex-col border-l border-border h-full overflow-y-auto">
                    {previewExercise ? (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="aspect-video bg-black/50 rounded-xl overflow-hidden border border-border shadow-lg relative group">
                                {previewExercise.animation_url ? (
                                    <img
                                        src={previewExercise.animation_url}
                                        alt={previewExercise.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        No preview available
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-black/70 text-white px-3 py-1 rounded-full text-xs">Preview</span>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold">{previewExercise.name}</h2>
                                <span className="inline-block mt-2 px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-xs font-semibold uppercase tracking-wider">
                                    {previewExercise.muscle_group}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-card p-4 rounded-xl border border-border space-y-2">
                                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                                        <Info className="w-4 h-4 text-emerald-500" /> Instructions
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {previewExercise.description || "No specific instructions provided for this exercise."}
                                    </p>
                                </div>

                                <button
                                    onClick={() => onSelect(previewExercise)}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" /> Add to Workout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground space-y-4 p-8">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <Info className="w-8 h-8 opacity-50" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-foreground">Select an exercise</h3>
                                <p className="text-sm">Click on an exercise from the list to view instructions and animation.</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
