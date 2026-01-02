import React from 'react';
import { Book, X, Stamp, Castle, Home, Tent, Share2 } from 'lucide-react';

const PassportBook = ({ onClose, travelLogs }) => {
    const getTime = (entry) => (typeof entry === 'number' ? entry : entry.time);
    const stats = Object.entries(travelLogs).sort(([, a], [, b]) => getTime(b) - getTime(a));

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const getRank = (seconds) => {
        if (seconds > 86400) return { title: "Citizen", color: "text-yellow-400", border: "border-yellow-400/50", icon: <Castle size={16} /> };
        if (seconds > 3600) return { title: "Resident", color: "text-passport-teal", border: "border-teal-400/50", icon: <Home size={16} /> };
        return { title: "Tourist", color: "text-white/60", border: "border-white/20", icon: <Tent size={16} /> };
    };

    const handleBadgeShare = async (e, country, rankTitle, iso) => {
        e.stopPropagation();
        const shareData = {
            title: 'Passport Radio Badge',
            text: `I just earned the ${rankTitle} Badge for ${country} 📻✈️ on Passport Radio!`,
            url: window.location.href
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.log('Share canceled'); }
        } else {
            const text = encodeURIComponent(shareData.text);
            const url = encodeURIComponent(shareData.url);
            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col animate-fade-in">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                <h2 className="text-xl font-bold flex items-center gap-2"><Book className="text-passport-teal" /> My Stamp Book</h2>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50 text-center">
                        <Stamp size={64} className="mb-4 text-white/20" />
                        <p>No stamps yet. Listen to collect badges!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {stats.map(([country, data]) => {
                            const seconds = getTime(data);
                            const iso = (typeof data === 'object' && data.iso) ? data.iso.toLowerCase() : 'xx';
                            const rank = getRank(seconds);
                            return (
                                <div key={country} className={`relative p-3 rounded-lg border-2 border-dashed ${rank.border} bg-white/5 flex flex-col items-center text-center aspect-square group hover:bg-white/10 transition overflow-hidden`}>
                                    {iso !== 'xx' && (
                                        <img src={`https://flagcdn.com/w160/${iso}.png`} alt={country} className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition duration-500" />
                                    )}
                                    <button onClick={(e) => handleBadgeShare(e, country, rank.title, iso)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-passport-teal hover:text-white transition z-20 backdrop-blur border border-white/10" title="Share Milestone"><Share2 size={12} /></button>
                                    <div className="relative z-10 flex flex-col items-center h-full justify-between py-2 w-full">
                                        <div className={`p-2 rounded-full bg-slate-900/80 backdrop-blur border border-white/10 ${rank.color} shadow-lg`}>{rank.icon}</div>
                                        <div className="w-full">
                                            <div className="font-bold text-sm text-white leading-tight mb-1 line-clamp-2 drop-shadow-md">{country}</div>
                                            <div className="text-[10px] text-white/70 uppercase tracking-wider font-bold">{rank.title}</div>
                                        </div>
                                        <div className="bg-black/60 px-2 py-1 rounded-md text-xs font-mono text-white/90 border border-white/5">{formatTime(seconds)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PassportBook;