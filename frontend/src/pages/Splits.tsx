import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTemplates, createTemplate, addTemplateExercise, fetchExercises } from '../api/client';
import { Plus, Dumbbell, ChevronRight } from 'lucide-react';
import { ExerciseSelector } from '../components/ExerciseSelector';


// Hardcoded user ID for demo
const USER_ID = "763b9c95-4bae-4044-9d30-7ae513286b37";

export function Splits() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [newSplitName, setNewSplitName] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const { data: templates } = useQuery({
        queryKey: ['templates'],
        queryFn: listTemplates
    });

    const { data: exercises } = useQuery({
        queryKey: ['exercises'],
        queryFn: fetchExercises
    });

    const createMutation = useMutation({
        mutationFn: (name: string) => createTemplate({ user_id: USER_ID, name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            setIsCreating(false);
            setNewSplitName("");
        }
    });

    const addExerciseMutation = useMutation({
        mutationFn: ({ templateId, exerciseId }: { templateId: string, exerciseId: string }) =>
            addTemplateExercise(templateId, {
                exercise_id: exerciseId,
                order_index: 0,
                target_sets: 3,
                target_reps: 10
            }),
        onSuccess: () => {
            alert("Exercise added to split!");
        }
    });

    const handleCreateWrapper = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSplitName) createMutation.mutate(newSplitName);
    };

    return (
        <div className="space-y-8 pb-20 md:pb-0">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Training Splits
                    </h1>
                    <p className="text-muted-foreground mt-1">Design your perfect workout routine</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full transition-colors"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </header>

            {isCreating && (
                <div className="bg-card border border-border p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">Create New Split</h3>
                    <form onSubmit={handleCreateWrapper} className="flex gap-4">
                        <input
                            type="text"
                            value={newSplitName}
                            onChange={(e) => setNewSplitName(e.target.value)}
                            placeholder="Split Name (e.g., Leg Day)"
                            className="flex-1 bg-background border border-input rounded-lg px-4 py-2"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!newSplitName}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                        >
                            Create
                        </button>
                    </form>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {templates?.map(template => (
                    <div
                        key={template.id}
                        className="bg-card border border-border p-5 rounded-xl hover:border-emerald-500/50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedTemplateId(template.id)}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                    <Dumbbell className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{template.name}</h3>
                                    <p className="text-xs text-muted-foreground">Custom Split</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                        </div>
                    </div>
                ))}
            </div>

            {selectedTemplateId && (
                <ExerciseSelector
                    exercises={exercises || []}
                    onClose={() => setSelectedTemplateId(null)}
                    onSelect={(ex) => {
                        if (selectedTemplateId) {
                            addExerciseMutation.mutate({ templateId: selectedTemplateId, exerciseId: ex.id });
                        }
                    }}
                />
            )}
        </div>
    );
}
