import React, { useState } from 'react';
import { Book, Settings, Stamp, Share2, Globe, Heart, Radio, VolumeX, Trophy, HelpCircle } from 'lucide-react';
import PassportBook from './PassportBook';
import MissionBriefing from './MissionBriefing';
import { cities } from '../data/cities';

const FavoritesView = ({ 
    favorites, 
    removeFavorite, 
    setCurrentStation, 
    setIsPlaying, 
    setActiveTab, 
    showStampBook, 
    setShowStampBook, 
    travelLogs, 
    setShowPassportProfile, 
    showHomelandInvite, 
    setShowHomelandInvite, 
    currentStation,
    onTravel 
}) => {
    
    // State for Mission Briefing
    const [showBriefing, setShowBriefing] = useState(false);

    // Grouping Logic
    const groupedFavorites = favorites.reduce((groups, station) => {
        const country = station.country || "International";
        if (!groups[country]) groups[country] = [];
        groups[country].push(station);
        return groups;
    }, {});
    
    const sortedCountries = Object.keys(groupedFavorites).sort();

    return (
        <div className="flex-1 w-full h-full relative flex flex-col">
            
            {/* RENDER PASSPORT BOOK */}
            {showStampBook && (
                <PassportBook 
                    onClose={() => setShowStampBook(false)} 
                    travelLogs={travelLogs} 
                    onTravel={(city) => {
                        setShowStampBook(false); 
                        onTravel(city);
                    }}
                />
            )}

            {/* SCROLLABLE CONTENT AREA */}
            <div className="w-full h-full overflow-y-auto pb-24 px-4 pt-6 animate-fade-in custom-scrollbar">
                
                {/* 1. DASHBOARD HEADER (Title & Buttons) */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight leading-none">MY PASSPORT</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-bold uppercase tracking-wider">
                                {Object.keys(favorites).length} Stations Saved
                            </span>
                        </div>
                    </div>

                    {/* TOP RIGHT BUTTONS */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowBriefing(true)}
                            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/5"
                            title="Mission Briefing"
                        >
                            <HelpCircle size={20} />
                        </button>
                        <button 
                            onClick={() => setShowPassportProfile(true)}
                            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/5"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {/* 2. ACTION GRID */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <button 
                        onClick={() => setShowStampBook(true)}
                        className="relative group overflow-hidden rounded-xl bg-passport-teal/10 hover:bg-passport-teal/20 border border-passport-teal/20 hover:border-passport-teal/40 transition-all duration-300 text-left p-4 shadow-lg shadow-black/20"
                    >
                        <div className="absolute -bottom-4 -right-4 p-3 opacity-10 group-hover:opacity-30 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
                            <Book size={64} />
                        </div>
                        <div className="relative z-10">
                            <div className="p-2 bg-passport-teal/20 w-fit rounded-lg mb-2 text-passport-teal shadow-inner">
                                <Stamp size={20} />
                            </div>
                            <span className="block text-[10px] font-bold text-passport-teal/70 uppercase tracking-widest mb-1">Collection</span>
                            <span className="block text-lg font-bold text-white leading-tight">My Stamps</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => setActiveTab('leaderboard')}
                        className="relative group overflow-hidden rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 text-left p-4 shadow-lg shadow-black/20"
                    >
                        <div className="absolute -bottom-4 -right-4 p-3 opacity-10 group-hover:opacity-30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                            <Trophy size={64} />
                        </div>
                        <div className="relative z-10">
                            <div className="p-2 bg-yellow-500/20 w-fit rounded-lg mb-2 text-yellow-400 shadow-inner">
                                <Globe size={20} />
                            </div>
                            <span className="block text-[10px] font-bold text-yellow-500/70 uppercase tracking-widest mb-1">Global</span>
                            <span className="block text-lg font-bold text-white leading-tight">Rankings</span>
                        </div>
                    </button>
                </div>

                {/* HOMELAND SHARE BANNER */}
                {showHomelandInvite && currentStation && (
                    <div className="mb-8 bg-gradient-to-r from-passport-teal/20 to-blue-500/20 border border-passport-teal/50 rounded-xl p-4 animate-bounce-in relative overflow-hidden shadow-lg">
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="bg-passport-teal text-black p-3 rounded-full shadow-lg shadow-passport-teal/20">
                                <Share2 size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">Rep Your Roots! 🌍</h3>
                                <p className="text-sm text-white/70 mb-3">
                                    You've been vibing to <span className="text-passport-teal font-bold">{currentStation.country}</span> for a while. Share the love?
                                </p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: 'Passport Radio',
                                                    text: `Vibing to ${currentStation.country} on Passport Radio! 🎧✈️`,
                                                    url: 'https://passportradio.netlify.app'
                                                });
                                                setShowHomelandInvite(false); 
                                            }
                                        }}
                                        className="bg-passport-teal text-black text-xs font-bold px-4 py-2 rounded-full hover:scale-105 transition shadow-lg shadow-passport-teal/20"
                                    >
                                        Share Now
                                    </button>
                                    <button 
                                        onClick={() => setShowHomelandInvite(false)}
                                        className="text-white/40 text-xs font-bold px-3 py-2 hover:text-white transition"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                        <Globe className="absolute -right-4 -bottom-4 text-passport-teal/10 rotate-12" size={100} />
                    </div>
                )}

                {/* FAVORITES LIST */}
                {favorites.length === 0 ? (
                    <div className="text-center opacity-50 mt-10 p-6 border border-dashed border-white/20 rounded-2xl bg-white/5">
                        <Heart size={48} className="mx-auto mb-4 text-white/20" />
                        <p className="text-sm text-white">No stations favorited.</p>
                        <button onClick={() => setActiveTab('discover')} className="text-passport-teal text-sm mt-2 font-bold hover:underline">Go Explore</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sortedCountries.map((country) => (
                            <div key={country} className="animate-fade-in">
                                <h3 className="text-xs font-bold text-passport-teal uppercase tracking-widest mb-3 flex items-center gap-2 opacity-90 sticky top-0 bg-slate-900/95 backdrop-blur-md py-3 z-10 border-b border-white/5">
                                    <Globe size={14} /> {country}
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {groupedFavorites[country].map((station) => (
                                        <div key={station.stationuuid} onClick={() => {
                                            setCurrentStation(station);
                                            setIsPlaying(true);
                                            const targetCity = cities.find(c => 
                                                (station.city && c.name.toLowerCase() === station.city.toLowerCase()) || 
                                                (c.country.toLowerCase() === (station.country || "").toLowerCase())
                                            );
                                            if (onTravel) {
                                                onTravel(targetCity || {
                                                    name: station.city || station.country || "Unknown Location",
                                                    country: station.country || "Unknown Country",
                                                    lat: station.geo_lat || 0,
                                                    lng: station.geo_long || 0,
                                                    population: 0
                                                });
                                            }
                                            setActiveTab('discover');
                                        }} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer group transition active:scale-[0.98]">
                                            <div className="w-10 h-10 rounded-md bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden relative border border-white/5">
                                                <img src={station.favicon} onError={(e) => e.target.style.display = 'none'} className="w-full h-full object-contain" alt="icon" />
                                                <Radio size={18} className="text-white/20 absolute" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm truncate text-white group-hover:text-passport-teal transition-colors">{station.name}</h4>
                                                <p className="text-xs text-white/50 truncate">{station.state || station.tags || 'Unknown Region'}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeFavorite(e, station.stationuuid); }} 
                                                className="p-2 text-white/20 hover:text-red-500 hover:bg-white/10 rounded-full transition z-20"
                                            >
                                                <VolumeX size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* 👇👇 FIXED RENDER WITH TOP OFFSET 👇👇 */}
            {/* 1. top-24: Pushes the container down by 96px (clearing the header) */}
            {/* 2. transform: Forces the fixed children inside to be relative to THIS div, not the window */}
            {showBriefing && (
                <div className="fixed inset-0 top-24 z-[100] transform">
                    <MissionBriefing onClose={() => setShowBriefing(false)} />
                </div>
            )}
            
        </div>
    );
};

export default FavoritesView;