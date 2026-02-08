import { useQuery } from '@tanstack/react-query';
import { fetchAllSets, fetchUserBadges } from '../api/client';
import { Car, Truck, Trophy, Rocket, Component, Medal, Star, Award } from 'lucide-react';
import { cn } from '../lib/utils';
// UserBadge type used implicitly by fetchUserBadges return type

// Hardcoded user ID for demo
const DEMO_USER_ID = "763b9c95-4bae-4044-9d30-7ae513286b37";

const MILESTONES = [
    { name: "Small Car", volume: 1500, icon: Car, color: "text-blue-400" },
    { name: "Elephant", volume: 6000, icon: Component, color: "text-gray-400" },
    { name: "Semi Truck", volume: 20000, icon: Truck, color: "text-amber-400" },
    { name: "Battle Tank", volume: 50000, icon: Trophy, color: "text-emerald-400" },
    { name: "Space Shuttle", volume: 2000000, icon: Rocket, color: "text-purple-400" },
];

const BADGE_META: Record<string, { description: string, icon: any, color: string }> = {
    "Titan Volume": { description: "10,000kg in one session", icon: Trophy, color: "text-yellow-400" },
    "Heavy Lifter": { description: "5,000kg in one session", icon: Star, color: "text-orange-400" },
    "Marathoner": { description: "Workout > 90 mins", icon: Medal, color: "text-blue-400" },
    "Speed Demon": { description: "Fast & Heavy", icon: Rocket, color: "text-red-400" },
    "Volume Warrior": { description: "20+ sets completed", icon: Award, color: "text-purple-400" },
};

export function Awards() {
    const { data: sets } = useQuery({ queryKey: ['sets'], queryFn: fetchAllSets });
    const { data: badges } = useQuery({
        queryKey: ['badges', DEMO_USER_ID],
        queryFn: () => fetchUserBadges(DEMO_USER_ID)
    });

    if (!sets) return <div className="p-8">Loading awards...</div>;

    const totalVolume = sets.reduce((acc, set) => acc + (set.weight_kg * set.reps), 0);
    const nextMilestone = MILESTONES.find(m => m.volume > totalVolume) || MILESTONES[MILESTONES.length - 1];
    const progressToNext = nextMilestone ? (totalVolume / nextMilestone.volume) * 100 : 100;

    // Group badges by name to show count
    const badgeCounts = (badges || []).reduce((acc, badge) => {
        acc[badge.badge_name] = (acc[badge.badge_name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-12 max-w-5xl mx-auto pb-20">
            {/* Lifetime Stats */}
            <section className="text-center py-8 space-y-6">
                <div>
                    <h2 className="text-4xl font-black mb-2 uppercase tracking-tight">Lifetime Volume</h2>
                    <p className="text-7xl font-black bg-gradient-to-r from-blue-500 via-emerald-400 to-green-500 text-transparent bg-clip-text animate-in zoom-in-50 duration-500">
                        {totalVolume.toLocaleString()} <span className="text-4xl text-muted-foreground/50">kg</span>
                    </p>
                </div>

                <div className="max-w-xl mx-auto space-y-2">
                    <div className="w-full h-6 bg-muted/50 rounded-full overflow-hidden border border-border/50">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(progressToNext, 100)}%` }}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground flex justify-between px-2">
                        <span>Current</span>
                        <span>Next: {nextMilestone?.name} ({nextMilestone?.volume.toLocaleString()} kg)</span>
                    </p>
                </div>
            </section>

            {/* Trophy Case */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <h3 className="text-2xl font-bold">Trophy Case</h3>
                </div>

                {(!badges || badges.length === 0) ? (
                    <div className="text-center p-12 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                        <Trophy className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">Complete workouts to earn badges!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Object.entries(badgeCounts).map(([name, count]) => {
                            const meta = BADGE_META[name] || { description: "Awesome achievement", icon: Medal, color: "text-gray-400" };
                            const Icon = meta.icon;

                            return (
                                <div key={name} className="bg-card border border-border p-4 rounded-xl flex flex-col items-center text-center hover:border-emerald-500/50 transition-colors shadow-sm group relative overflow-hidden">
                                    <div className={cn("p-4 rounded-full bg-muted mb-3 group-hover:scale-110 transition-transform duration-300", meta.color.replace("text-", "bg-") + "/10")}>
                                        <Icon size={32} className={meta.color} />
                                    </div>
                                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        x{count}
                                    </div>
                                    <h4 className="font-bold text-sm mb-1">{name}</h4>
                                    <p className="text-[10px] text-muted-foreground leading-tight">{meta.description}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Locked Achievements / Milestones */}
            <section>
                <h3 className="text-2xl font-bold mb-6">Volume Milestones</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {MILESTONES.map((milestone) => {
                        const isUnlocked = totalVolume >= milestone.volume;
                        return (
                            <div
                                key={milestone.name}
                                className={cn(
                                    "border border-border p-4 rounded-xl flex flex-col items-center text-center transition-all",
                                    isUnlocked
                                        ? "bg-gradient-to-br from-card to-emerald-500/5 shadow-lg shadow-emerald-500/5"
                                        : "bg-muted/30 opacity-60 grayscale"
                                )}
                            >
                                <milestone.icon size={32} className={cn("mb-3", milestone.color)} />
                                <h4 className="font-bold text-sm">{milestone.name}</h4>
                                <p className="text-xs text-muted-foreground">{milestone.volume.toLocaleString()} kg</p>
                                {isUnlocked && (
                                    <div className="mt-2 text-emerald-500 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                        <Component className="w-3 h-3" /> Unlocked
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
