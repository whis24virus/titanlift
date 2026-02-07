import { Link, Outlet, useLocation } from "react-router-dom";
import { Dumbbell, LayoutDashboard, LineChart, Trophy, Split, User, Medal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Layout() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
            {/* Mobile Header (Glassmorphism) */}
            <header className="md:hidden p-4 border-b border-white/5 flex justify-between items-center bg-card/80 backdrop-blur-md sticky top-0 z-50">
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 text-transparent bg-clip-text">
                    TitanLift
                </h1>
            </header>

            {/* Sidebar (Desktop - Glassmorphism) */}
            <aside className="hidden md:flex flex-col w-64 border-r border-white/5 p-6 bg-card/50 backdrop-blur-xl h-screen sticky top-0 z-50">
                <h1 className="text-3xl font-black tracking-tighter mb-10 bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 text-transparent bg-clip-text drop-shadow-lg">
                    TitanLift
                </h1>
                <div className="space-y-2">
                    <NavLink to="/" icon={<LayoutDashboard />} label="Dashboard" />
                    <NavLink to="/train" icon={<Dumbbell />} label="Train" />
                    <NavLink to="/splits" icon={<Split />} label="Splits" />
                    <NavLink to="/analytics" icon={<LineChart />} label="Analytics" />
                    <NavLink to="/awards" icon={<Trophy />} label="Awards" />
                    <NavLink to="/leaderboard" icon={<Medal />} label="Rankings" />
                    <NavLink to="/profile" icon={<User />} label="Profile" />
                </div>
            </aside>

            {/* Main Content with AnimatePresence */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden h-[calc(100vh-65px)] md:h-screen w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="p-4 md:p-8 pb-24 md:pb-8 min-h-full"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Nav (Mobile - Glassmorphism & Floating) */}
            <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-around p-3 z-50 shadow-2xl shadow-black/50">
                <NavLinkMobile to="/" icon={<LayoutDashboard />} label="Home" />
                <NavLinkMobile to="/train" icon={<Dumbbell />} label="Train" />
                <NavLinkMobile to="/analytics" icon={<LineChart />} label="Stats" />
                <NavLinkMobile to="/leaderboard" icon={<Medal />} label="Ranks" />
                <NavLinkMobile to="/profile" icon={<User />} label="Profile" />
            </nav>
        </div>
    );
}

import { cn } from "../lib/utils";
import React from 'react';
import { NavLink as ReactNavLink } from 'react-router-dom';

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
    return (
        <ReactNavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                    isActive
                        ? "text-white font-bold bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                )
            }
        >
            {({ isActive }) => (
                <>
                    <div className={cn("relative z-10 transition-transform duration-300", isActive && "scale-110")}>
                        {React.cloneElement(icon as React.ReactElement, {
                            fill: isActive ? "currentColor" : "none",
                            className: cn("w-5 h-5", isActive ? "text-emerald-400" : "text-muted-foreground group-hover:text-white")
                        })}
                    </div>
                    <span className="relative z-10">{label}</span>
                    {isActive && (
                        <motion.div
                            layoutId="active-pill"
                            className="absolute left-0 w-1 h-full bg-emerald-500 rounded-r-full"
                        />
                    )}
                </>
            )}
        </ReactNavLink>
    );
}

function NavLinkMobile({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
    return (
        <ReactNavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 relative",
                    isActive
                        ? "text-emerald-400 -translate-y-2"
                        : "text-muted-foreground hover:text-white"
                )
            }
        >
            {({ isActive }) => (
                <>
                    <div className={cn(
                        "p-2 rounded-xl transition-all duration-300",
                        isActive
                            ? "bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-lg shadow-emerald-500/40"
                            : "bg-transparent"
                    )}>
                        {React.cloneElement(icon as React.ReactElement, {
                            fill: isActive ? "currentColor" : "none",
                            className: "w-5 h-5"
                        })}
                    </div>

                    {/* Animate label presence or just opacity */}
                    <span className={cn(
                        "text-[10px] font-bold mt-1 transition-all duration-300",
                        isActive ? "opacity-100 scale-100" : "opacity-0 scale-0 h-0 overflow-hidden"
                    )}>
                        {label}
                    </span>

                    {/* Active indicator dot */}
                    {isActive && (
                        <motion.div
                            layoutId="mobile-active-dot"
                            className="absolute -bottom-2 w-1 h-1 bg-emerald-400 rounded-full"
                        />
                    )}
                </>
            )}
        </ReactNavLink>
    );
}
