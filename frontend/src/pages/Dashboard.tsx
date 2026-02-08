import { Activity, Flame, Zap, TrendingUp, ChevronRight, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ActivityHeatmap } from "../components/ActivityHeatmap";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function Dashboard() {
    return (
        <div className="space-y-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white neon-text">
                        STATUS: <span className="text-accent underline decoration-4 decoration-accent/30 underline-offset-8">PEAK</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 font-mono uppercase tracking-widest text-xs">
                        System Optimal • Ready for Training
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link to="/train">
                        <Button variant="primary" size="lg" glow className="shadow-neon">
                            <Zap className="mr-2 h-5 w-5" />
                            INITIATE SEQUENCE
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Volume Load"
                    value="12,450"
                    unit="kgs"
                    trend="+12%"
                    icon={<Activity className="text-primary" />}
                    color="text-primary"
                />
                <MetricCard
                    title="Workouts"
                    value="4"
                    unit="this week"
                    trend="On Track"
                    icon={<Flame className="text-accent" />}
                    color="text-accent"
                />
                <MetricCard
                    title="Consistency"
                    value="85"
                    unit="%"
                    trend="Top 10%"
                    icon={<TrendingUp className="text-secondary" />}
                    color="text-secondary"
                />
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visualizer Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="min-h-[400px] flex flex-col relative overflow-hidden group border-white/5">
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                PERFORMANCE AURA
                            </h2>
                            <select className="bg-black/30 text-xs px-3 py-1 rounded-full border border-white/10 outline-none text-muted-foreground">
                                <option>Weekly</option>
                                <option>Monthly</option>
                            </select>
                        </div>

                        <div className="flex-1 w-full bg-black/20 rounded-2xl relative overflow-hidden backdrop-blur-md border border-white/5 flex items-center justify-center group-hover:border-primary/20 transition-colors duration-500">
                            {/* Background Glows */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-[80px] animate-pulse-slow" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-secondary/10 rounded-full blur-[100px] animate-pulse-slow delay-75" />

                            <ActivityHeatmap data={generateMockData()} />
                        </div>
                    </Card>
                </div>

                {/* Feed Column */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white tracking-wide">RECENT LOGS</h2>
                        <Button variant="ghost" size="sm" className="text-[10px] tracking-widest">
                            VIEW ALL <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group border border-white/5">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${i === 1 ? 'bg-primary/10 text-primary' :
                                    i === 2 ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'
                                    }`}>
                                    <DumbbellIcon i={i} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-white group-hover:text-primary transition-colors">Upper Body Power</h4>
                                    <p className="text-xs text-muted-foreground font-mono mt-1">
                                        <span className="text-white/60">Today</span> • 45m • 12,500kg
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                            </div>
                        ))}
                    </div>

                    <Card className="bg-gradient-to-br from-secondary/20 to-transparent border-secondary/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-white mb-2">Upgrade to Pro</h3>
                            <p className="text-xs text-white/70 mb-4">Unlock advanced neural metrics and AI coaching.</p>
                            <Button variant="secondary" size="sm" className="w-full shadow-neon-purple">
                                ACCESS CORE-X
                            </Button>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-secondary/40 blur-[50px] rounded-full pointer-events-none" />
                    </Card>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, unit, trend, icon, color }: any) {
    return (
        <Card className="hover:border-white/10 transition-colors hover:bg-white/5 group border-white/5">
            <div className="flex items-start justify-between mb-4">
                <div className="bg-white/5 p-2 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
                {trend && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 ${color}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-muted-foreground text-xs font-mono uppercase tracking-wider mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black italic tracking-tighter text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all">
                        {value}
                    </h3>
                    <span className="text-sm text-muted-foreground font-medium">{unit}</span>
                </div>
            </div>
        </Card>
    );
}

function DumbbellIcon({ i }: { i: number }) {
    if (i === 1) return <Zap className="w-5 h-5" />
    if (i === 2) return <Flame className="w-5 h-5" />
    return <Activity className="w-5 h-5" />
}

function generateMockData() {
    const data = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toISOString().split('T')[0],
            volume_kg: Math.random() > 0.7 ? Math.floor(Math.random() * 15000) : 0
        });
    }
    return data;
}
