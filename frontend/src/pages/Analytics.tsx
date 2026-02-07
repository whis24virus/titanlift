import { useQuery } from '@tanstack/react-query';
import { fetchExercises, fetchAllSets } from '../api/client';
import { MuscleHeatmap } from '../components/MuscleHeatmap';

export function Analytics() {
    const { data: exercises } = useQuery({ queryKey: ['exercises'], queryFn: fetchExercises });
    const { data: sets } = useQuery({ queryKey: ['sets'], queryFn: fetchAllSets });

    if (!exercises || !sets) return <div className="p-8">Loading analytics...</div>;

    // Transform sets for heatmap
    const heatmapSets = sets.map(s => ({
        exerciseId: s.exercise_id,
        weight: s.weight_kg,
        reps: s.reps
    }));

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
                    Training Analysis
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-card border border-border p-6 rounded-xl flex flex-col items-center">
                    <h3 className="text-xl font-bold mb-4 w-full text-left">Muscle Heatmap</h3>
                    <p className="text-sm text-muted-foreground mb-6 self-start w-full">
                        Visual representation of your training volume distribution.
                    </p>
                    <MuscleHeatmap sets={heatmapSets} exercises={exercises} />
                </div>

                <div className="bg-card border border-border p-6 rounded-xl min-h-[300px]">
                    <h3 className="text-xl font-bold mb-4">Volume Trends</h3>
                    <div className="flex items-end justify-between gap-2 px-2 pb-4 bg-muted/5 rounded-lg border border-border/50 h-[200px]">
                        {/* Mock data for visualization since backend volume history endpoint is pending */}
                        {[65, 40, 75, 50, 85, 95, 80].map((h, i) => (
                            <div key={i} className="flex-1 bg-muted/20 rounded-t-lg relative group h-full flex flex-col justify-end overflow-hidden">
                                <div
                                    className="w-full bg-emerald-500/80 group-hover:bg-emerald-500 transition-all rounded-t-md"
                                    style={{ height: `${h}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
