export function Dashboard() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Welcome Back, Titan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border p-6 rounded-xl">
                    <h3 className="text-muted-foreground text-sm">Last Workout</h3>
                    <p className="text-2xl font-bold mt-2">Push Day</p>
                    <p className="text-sm text-muted-foreground">2 days ago</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl">
                    <h3 className="text-muted-foreground text-sm">Weekly Volume</h3>
                    <p className="text-2xl font-bold mt-2">12,450 kg</p>
                    <p className="text-emerald-400 text-sm mt-1">+15% from last week</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl">
                    <h3 className="text-muted-foreground text-sm">Current Streak</h3>
                    <p className="text-2xl font-bold mt-2">4 Days</p>
                </div>
            </div>
        </div>
    );
}
