import React from 'react';
import { Clock } from 'lucide-react';

const TravelStats = ({ travelLogs }) => {
    const stats = Object.entries(travelLogs).sort(([, a], [, b]) => (typeof b === 'number' ? b : b.time) - (typeof a === 'number' ? a : a.time));

    if (stats.length === 0) return null;

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const getRank = (seconds) => {
        if (seconds > 86400) return { title: "Citizen", color: "text-yellow-400", icon: "👑" };
        if (seconds > 3600) return { title: "Resident", color: "text-passport-teal", icon: "🏠" };
        return { title: "Tourist", color: "text-white/60", icon: "📷" };
    };

    return (
        <div className="mb-6 animate-fade-in">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock size={14} /> Time Spent in Country
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x no-scrollbar">
                {stats.map(([country, data]) => {
                    const seconds = typeof data === 'number' ? data : data.time;
                    const rank = getRank(seconds);
                    return (
                        <div key={country} className="snap-start shrink-0 w-32 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                            <div className="text-2xl mb-1">{rank.icon}</div>
                            <div className="font-bold text-sm text-white truncate w-full">{country}</div>
                            <div className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${rank.color}`}>
                                {rank.title}
                            </div>
                            <div className="bg-black/30 rounded-full px-2 py-1 text-xs font-mono text-white/70">
                                {formatTime(seconds)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TravelStats;