import { useQuery } from '@tanstack/react-query';
import { fetchExercises, fetchAllSets } from '../api/client';
import { MuscleHeatmap } from '../components/MuscleHeatmap';
import { useState } from 'react';

// Generate last 7 days with realistic mock data
function generateLast7Days() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        const dayName = days[date.getDay()];
        const volume = Math.random() > 0.3 ? Math.floor(Math.random() * 12000 + 2000) : 0;
        return {
            day: dayName,
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            volume
        };
    });
}

export function Analytics() {
    const { data: exercises } = useQuery({ queryKey: ['exercises'], queryFn: fetchExercises });
    const { data: sets } = useQuery({ queryKey: ['sets'], queryFn: fetchAllSets });
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);

    // Generate consistent mock data for the session
    const [weekData] = useState(() => generateLast7Days());

    if (!exercises || !sets) return <div className="p-8">Loading analytics...</div>;

    // Transform sets for heatmap
    const heatmapSets = sets.map(s => ({
        exerciseId: s.exercise_id,
        weight: s.weight_kg,
        reps: s.reps
    }));

    const maxVolume = Math.max(...weekData.map(d => d.volume), 1);

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
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Volume Trends</h3>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Last 7 Days</span>
                    </div>

                    {/* Chart Container */}
                    <div className="flex flex-col gap-2">
                        {/* Bars */}
                        <div className="flex items-end justify-between gap-2 px-2 pb-2 h-[180px]">
                            {weekData.map((data, i) => {
                                const heightPercent = maxVolume > 0 ? (data.volume / maxVolume) * 100 : 0;
                                const isHovered = hoveredBar === i;

                                return (
                                    <div
                                        key={i}
                                        className="flex-1 flex flex-col justify-end items-center h-full relative"
                                        onMouseEnter={() => setHoveredBar(i)}
                                        onMouseLeave={() => setHoveredBar(null)}
                                    >
                                        {/* Tooltip */}
                                        {isHovered && (
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover border border-border px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap">
                                                <p className="text-xs font-bold text-foreground">{data.volume.toLocaleString()} kg</p>
                                                <p className="text-[10px] text-muted-foreground">{data.date}</p>
                                            </div>
                                        )}

                                        {/* Bar */}
                                        <div
                                            className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer ${data.volume === 0
                                                    ? 'bg-muted/30'
                                                    : isHovered
                                                        ? 'bg-gradient-to-t from-emerald-600 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                                        : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                                                }`}
                                            style={{
                                                height: data.volume === 0 ? '4px' : `${Math.max(heightPercent, 8)}%`,
                                                minHeight: '4px'
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Day Labels */}
                        <div className="flex justify-between gap-2 px-2 pt-2 border-t border-border/50">
                            {weekData.map((data, i) => (
                                <div key={i} className="flex-1 text-center">
                                    <span className={`text-xs font-medium ${hoveredBar === i ? 'text-primary' : 'text-muted-foreground'
                                        }`}>
                                        {data.day}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/30">
                        <div>
                            <p className="text-xs text-muted-foreground">Weekly Total</p>
                            <p className="text-lg font-bold text-emerald-400">
                                {weekData.reduce((acc, d) => acc + d.volume, 0).toLocaleString()} kg
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Daily Average</p>
                            <p className="text-lg font-bold text-foreground">
                                {Math.round(weekData.reduce((acc, d) => acc + d.volume, 0) / 7).toLocaleString()} kg
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
