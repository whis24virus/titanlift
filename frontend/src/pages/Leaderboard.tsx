import { useQuery } from '@tanstack/react-query';
import { Medal, Crown, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface LeaderboardEntry {
    username: string;
    total_volume_kg: number;
    rank: number;
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    const res = await fetch(`/api/leaderboard`);
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return res.json();
}

export function Leaderboard() {
    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: fetchLeaderboard
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading specific rankings...</div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <header className="text-center space-y-4">
                <Crown className="w-16 h-16 mx-auto text-yellow-400 animate-pulse" />
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                    Global Leaderboard
                </h1>
                <p className="text-xl text-muted-foreground">Who lifts the heaviest?</p>
            </header>

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
                        {leaderboard?.map((entry) => (
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
                        ))}
                    </tbody>
                </table>
            </div>

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
