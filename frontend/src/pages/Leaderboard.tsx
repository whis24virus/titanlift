import { useQuery } from '@tanstack/react-query';
import { Medal, Crown, TrendingUp, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface LeaderboardEntry {
    username: string;
    total_volume_kg: number;
    rank: number;
    period?: string;
    muscle_group?: string;
}

const PERIODS = [
    { value: 'all', label: 'All Time' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
];

const MUSCLE_GROUPS = [
    { value: '', label: 'All Muscles' },
    { value: 'chest', label: 'Chest' },
    { value: 'back', label: 'Back' },
    { value: 'legs', label: 'Legs' },
    { value: 'shoulders', label: 'Shoulders' },
    { value: 'biceps', label: 'Biceps' },
    { value: 'triceps', label: 'Triceps' },
    { value: 'core', label: 'Core' },
];

async function fetchLeaderboard(period: string, muscleGroup: string): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    if (muscleGroup) params.set('muscle_group', muscleGroup);

    const res = await fetch(`/api/leaderboard?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
}

export function Leaderboard() {
    const [period, setPeriod] = useState('all');
    const [muscleGroup, setMuscleGroup] = useState('');

    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['leaderboard', period, muscleGroup],
        queryFn: () => fetchLeaderboard(period, muscleGroup)
    });

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <header className="text-center space-y-4">
                <Crown className="w-16 h-16 mx-auto text-yellow-400 animate-pulse" />
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                    Global Leaderboard
                </h1>
                <p className="text-xl text-muted-foreground">Who lifts the heaviest?</p>
            </header>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-card border border-border rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                    >
                        {PERIODS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={muscleGroup}
                        onChange={(e) => setMuscleGroup(e.target.value)}
                        className="bg-card border border-border rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                    >
                        {MUSCLE_GROUPS.map((mg) => (
                            <option key={mg.value} value={mg.value}>{mg.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Applied Filters Badge */}
            {(period !== 'all' || muscleGroup) && (
                <div className="flex justify-center gap-2 flex-wrap">
                    {period !== 'all' && (
                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                            {PERIODS.find(p => p.value === period)?.label}
                        </span>
                    )}
                    {muscleGroup && (
                        <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-xs font-medium capitalize">
                            {muscleGroup}
                        </span>
                    )}
                </div>
            )}

            {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading rankings...</div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Rank</th>
                                <th className="px-6 py-4">Lifter</th>
                                <th className="px-6 py-4 text-right">Total Volume (kg)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {leaderboard?.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                                        No data for selected filters
                                    </td>
                                </tr>
                            ) : (
                                leaderboard?.map((entry) => (
                                    <tr key={entry.username} className="group hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-lg">
                                            <RankBadge rank={entry.rank} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                    {entry.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className={cn("font-medium", entry.rank === 1 && "text-yellow-400 font-bold")}>
                                                    {entry.username}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">
                                            {entry.total_volume_kg?.toLocaleString() || 0}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Rankings update in real-time based on logged sets.</span>
            </div>
        </div>
    );
}

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return <div className="text-yellow-400 flex items-center gap-1"><Medal className="w-5 h-5" /> 1st</div>;
    if (rank === 2) return <div className="text-gray-400 flex items-center gap-1"><Medal className="w-5 h-5" /> 2nd</div>;
    if (rank === 3) return <div className="text-amber-700 flex items-center gap-1"><Medal className="w-5 h-5" /> 3rd</div>;

    return <span className="text-muted-foreground">#{rank}</span>;
}
// Force redeploy 1770549925
