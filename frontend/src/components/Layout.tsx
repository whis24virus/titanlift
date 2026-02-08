import { Outlet, useLocation } from "react-router-dom";
import { Dumbbell, LayoutDashboard, LineChart, Split, User, Medal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/utils";
import React from 'react';
import { NavLink as ReactNavLink } from 'react-router-dom';

export function Layout() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden font-sans selection:bg-primary/30">
            {/* Mobile Header (Glassmorphism) */}
            <header className="md:hidden p-4 flex justify-between items-center glass-panel sticky top-0 z-50 rounded-b-2xl mb-4 mx-2 mt-2">
                <h1 className="text-xl font-black tracking-tight text-white neon-text">
                    TitanLift
                </h1>
            </header>

            {/* Sidebar (Desktop - Glassmorphism) */}
            <aside className="hidden md:flex flex-col w-72 p-6 h-screen sticky top-0 z-50">
                <div className="glass-panel h-full w-full rounded-3xl flex flex-col p-4 border-white/5">
                    <div className="mb-10 px-2 mt-2">
                        <h1 className="text-3xl font-black tracking-tighter text-white italic neon-text flex items-center gap-2">
                            <span className="text-primary text-4xl">⚡</span>
                            TITAN
                        </h1>
                    </div>

                    <div className="space-y-3 flex-1">
                        <NavLink to="/" icon={<LayoutDashboard />} label="Dashboard" />
                        <NavLink to="/train" icon={<Dumbbell />} label="Train" />
                        <NavLink to="/splits" icon={<Split />} label="Splits" />
                        <NavLink to="/analytics" icon={<LineChart />} label="Analytics" />
                        <NavLink to="/leaderboard" icon={<Medal />} label="Rankings" />
                        <NavLink to="/profile" icon={<User />} label="Profile" />
                    </div>

                    <div className="mt-auto p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-xs text-muted-foreground font-mono">SYSTEM STATUS: <span className="text-primary font-bold">ONLINE</span></p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden h-[calc(100vh-80px)] md:h-screen w-full scroll-smooth">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(10px)" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="p-4 md:p-8 pb-32 md:pb-8 min-h-full"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Nav (Mobile - Glassmorphism & Floating) */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 glass-panel rounded-full flex justify-around p-4 z-50 neon-border">
                <NavLinkMobile to="/" icon={<LayoutDashboard />} label="Home" style={{ animationDelay: '0ms' }} />
                <NavLinkMobile to="/train" icon={<Dumbbell />} label="Train" style={{ animationDelay: '100ms' }} />
                <NavLinkMobile to="/analytics" icon={<LineChart />} label="Stats" style={{ animationDelay: '200ms' }} />
                <NavLinkMobile to="/leaderboard" icon={<Medal />} label="Ranks" style={{ animationDelay: '300ms' }} />
                <NavLinkMobile to="/profile" icon={<User />} label="Profile" style={{ animationDelay: '400ms' }} />
            </nav>
        </div>
    );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
    return (
        <ReactNavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden",
                    isActive
                        ? "bg-primary/10 text-white shadow-neon border border-primary/20"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                )
            }
        >
            {({ isActive }) => (
                <>
                    <div className={cn("relative z-10 transition-transform duration-300", isActive && "scale-110")}>
                        {React.cloneElement(icon as React.ReactElement, {
                            className: cn("w-5 h-5", isActive ? "text-primary drop-shadow-[0_0_5px_rgba(0,242,255,0.8)]" : "text-muted-foreground group-hover:text-white")
                        })}
                    </div>
                    <span className={cn("relative z-10 font-medium tracking-wide", isActive ? "text-white" : "")}>{label}</span>
                    {isActive && (
                        <div className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_#00F2FF]" />
                    )}
                </>
            )}
        </ReactNavLink>
    );
}

function NavLinkMobile({ to, icon, label, style }: { to: string; icon: React.ReactNode; label: string; style?: React.CSSProperties }) {
    return (
        <ReactNavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex flex-col items-center justify-center relative w-12 h-12 rounded-full transition-all duration-300",
                    isActive
                        ? "text-primary -translate-y-4"
                        : "text-muted-foreground hover:text-white"
                )
            }
            style={style}
        >
            {({ isActive }) => (
                <>
                    <div className={cn(
                        "p-3 rounded-full transition-all duration-300 absolute inset-0 flex items-center justify-center",
                        isActive
                            ? "bg-primary text-background shadow-neon scale-125"
                            : "bg-transparent"
                    )}>
                        {React.cloneElement(icon as React.ReactElement, {
                            className: "w-5 h-5"
                        })}
                    </div>

                    {isActive && <div className="absolute -bottom-6 w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_#00F2FF]" />}
                </>
            )}
        </ReactNavLink>
    );
}

