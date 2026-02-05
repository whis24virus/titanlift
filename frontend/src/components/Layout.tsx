import { Link, Outlet } from "react-router-dom";
import { Dumbbell, LayoutDashboard, LineChart, Trophy, Split, User, Medal } from "lucide-react";

export function Layout() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden p-4 border-b border-border flex justify-between items-center bg-card">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
                    TitanLift
                </h1>
            </header>

            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 border-r border-border p-4 bg-card h-screen sticky top-0">
                <h1 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
                    TitanLift
                </h1>
                <nav className="flex flex-col gap-2">
                    <NavLink to="/" icon={<LayoutDashboard />} label="Dashboard" />
                    <NavLink to="/train" icon={<Dumbbell />} label="Train" />
                    <NavLink to="/splits" icon={<Split />} label="Splits" />
                    <NavLink to="/analytics" icon={<LineChart />} label="Analytics" />
                    <NavLink to="/awards" icon={<Trophy />} label="Awards" />
                    <NavLink to="/leaderboard" icon={<Medal />} label="Rankings" />
                    <NavLink to="/profile" icon={<User />} label="Profile" />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8">
                <Outlet />
            </main>

            {/* Bottom Nav (Mobile) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around p-4 z-50">
                <NavLinkMobile to="/" icon={<LayoutDashboard />} label="Home" />
                <NavLinkMobile to="/train" icon={<Dumbbell />} label="Train" />
                <NavLinkMobile to="/splits" icon={<Split />} label="Splits" />
                <NavLinkMobile to="/analytics" icon={<LineChart />} label="Stats" />
                <NavLinkMobile to="/awards" icon={<Trophy />} label="Wins" />
                <NavLinkMobile to="/profile" icon={<User />} label="Profile" />
                <NavLinkMobile to="/leaderboard" icon={<Medal />} label="Ranks" />
            </nav>
        </div>
    );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    );
}

function NavLinkMobile({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
    return (
        <Link to={to} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
            {icon}
            <span className="text-xs">{label}</span>
        </Link>
    );
}
