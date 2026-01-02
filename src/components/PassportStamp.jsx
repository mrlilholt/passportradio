import React from 'react';
import { Crown, MapPin, Plane } from 'lucide-react';

const PassportStamp = ({ country, iso, secondsListened, onTravel }) => {
    // 1. Calculate Visa Level
    const getLevel = (seconds) => {
        if (seconds > 18000) return { tier: 'Ambassador', color: 'text-amber-400', border: 'border-amber-400', bg: 'bg-amber-400/10', icon: Crown }; // 5 hours
        if (seconds > 3600) return { tier: 'Resident', color: 'text-blue-400', border: 'border-blue-400', bg: 'bg-blue-400/10', icon: MapPin }; // 1 hour
        return { tier: 'Tourist', color: 'text-slate-400', border: 'border-slate-400', bg: 'bg-transparent', icon: null }; // < 1 hour
    };

    const level = getLevel(secondsListened);
    const LevelIcon = level.icon;

    // 2. Format Time
    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    // 3. Rotation & Flag URL
    const rotation = (country.length % 10 - 5) * 3; 
    const flagUrl = `https://flagcdn.com/w160/${iso.toLowerCase()}.png`;

    return (
        <button 
            onClick={onTravel}
            className={`
                relative group w-32 h-32 flex flex-col items-center justify-center 
                border-[3px] rounded-full transition-all duration-300 hover:scale-110 hover:shadow-xl hover:z-10
                ${level.border} bg-slate-900 overflow-hidden cursor-pointer
            `}
            style={{ 
                transform: `rotate(${rotation}deg)`,
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}
            title={`Travel to ${country}`}
        >
            {/* 🎨 FLAG BACKGROUND (Now in FULL COLOR) */}
            {/* Changed opacity-30 grayscale -> opacity-60 grayscale-0 */}
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-60 grayscale-0 transition-all duration-500"
                style={{ backgroundImage: `url(${flagUrl})` }}
            ></div>

            {/* TEXTURE OVERLAY */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 pointer-events-none"></div>

            {/* DARKER OVERLAY (Ensures white text is readable on bright flags) */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

            {/* 📝 TEXT CONTENT (Default View) */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-1 drop-shadow-md group-hover:opacity-0 transition-opacity duration-200">
                {/* Tier Label */}
                <div className={`font-black uppercase text-[9px] tracking-[0.2em] mb-1 ${level.color} bg-black/60 px-2 rounded-full backdrop-blur-sm border border-white/5`}>
                    {level.tier}
                </div>

                {/* Country Name */}
                <h3 className="font-black text-white text-sm leading-none uppercase tracking-wide max-w-[90px] mb-1 drop-shadow-lg">
                    {country}
                </h3>

                {/* Stats */}
                <div className="text-[10px] font-mono text-white/90 bg-black/40 px-1.5 rounded border border-white/10">
                    {iso.toUpperCase()} • {formatTime(secondsListened)}
                </div>
            </div>

            {/* ✈️ HOVER OVERLAY (Appears when hovering) */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-passport-teal/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                <Plane size={24} className="text-slate-900 mb-1 animate-pulse" />
                <span className="text-slate-900 font-black uppercase text-xs tracking-widest">Travel</span>
            </div>

            {/* 🏆 LEVEL ICON (Top Right) */}
            {LevelIcon && (
                <div className="absolute top-2 right-2 bg-slate-900 p-1.5 rounded-full border border-white/10 shadow-lg z-30 group-hover:scale-0 transition-transform">
                    <LevelIcon size={12} className={level.color} />
                </div>
            )}
        </button>
    );
};

export default PassportStamp;