import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { cn } from "../lib/utils";

interface ActivityDay {
    date: string;
    volume_kg: number;
}

interface ActivityHeatmapProps {
    data: ActivityDay[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    // Generate dates for the last year relative to today
    const today = new Date();
    const days: Date[] = [];
    for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d);
    }

    const dataMap = new Map(data.map(d => [d.date, d.volume_kg]));

    const getColor = (volume: number) => {
        if (volume === 0) return "bg-gray-800/30 border border-transparent";
        if (volume < 5000) return "bg-emerald-900/60 border border-emerald-800";
        if (volume < 10000) return "bg-emerald-700/80 border border-emerald-600";
        if (volume < 20000) return "bg-emerald-500 border border-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.3)]";
        return "bg-emerald-400 border border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse-slow";
    };

    return (
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <div className="min-w-max flex flex-col gap-2">
                <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
                    {days.map((dateObj) => {
                        const dateStr = dateObj.toISOString().split('T')[0];
                        const volume = dataMap.get(dateStr) || 0;

                        return (
                            <TooltipProvider key={dateStr}>
                                <Tooltip delayDuration={50}>
                                    <TooltipTrigger>
                                        <div
                                            className={cn(
                                                "w-3.5 h-3.5 rounded-sm transition-all duration-300 hover:scale-125 hover:z-10",
                                                getColor(volume)
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                                        <div className="text-xs">
                                            <p className="font-semibold text-emerald-400">{dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                            <p>{volume > 0 ? `Volume: ${volume.toLocaleString()} kg` : 'No activity'}</p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>

                <div className="flex justify-end items-center gap-2 mt-2 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-gray-800/30 rounded-sm" />
                        <div className="w-3 h-3 bg-emerald-900/60 rounded-sm" />
                        <div className="w-3 h-3 bg-emerald-700/80 rounded-sm" />
                        <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                        <div className="w-3 h-3 bg-emerald-400 rounded-sm" />
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
