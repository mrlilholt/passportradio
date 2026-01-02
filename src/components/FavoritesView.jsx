import React from 'react';
import { Book, Settings, Stamp, Share2, Globe, Heart, Radio, VolumeX } from 'lucide-react';
import PassportBook from './PassportBook';

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
    onTravel // <--- The new prop for Flyover
}) => {
    
    // 👇 THIS WAS MISSING! We need to calculate the groups.
    const groupedFavorites = favorites.reduce((groups, station) => {
        const country = station.country || "International";
        if (!groups[country]) groups[country] = [];
        groups[country].push(station);
        return groups;
    }, {});
    
    const sortedCountries = Object.keys(groupedFavorites).sort();

    return (
        <div className="flex-1 w-full h-full relative">
            
            {/* RENDER PASSPORT BOOK WITH FLYOVER LOGIC */}
            {showStampBook && (
                <PassportBook 
                    onClose={() => setShowStampBook(false)} 
                    travelLogs={travelLogs} 
                    onTravel={(city) => {
                        setShowStampBook(false); // Close book immediately
                        onTravel(city);          // Trigger the App.jsx animation
                    }}
                />
            )}

            <div className="w-full h-full overflow-y-auto pb-24 p-4 animate-fade-in">
                {/* Header */}
                <div className="mb-6 sticky top-0 bg-slate-900/95 backdrop-blur z-10 py-2 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Book className="text-passport-teal" /> My Passport
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setShowPassportProfile(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition border border-white/10">
                            <Settings size={18} />
                        </button>
                        <button onClick={() => setShowStampBook(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition text-white">
                            <Stamp size={14} className="text-passport-teal" /> Stamps
                        </button>
                    </div>
                </div>

                {/* 🌟 HOMELAND SHARE BANNER */}
                {showHomelandInvite && currentStation && (
                    <div className="mb-6 bg-gradient-to-r from-passport-teal/20 to-blue-500/20 border border-passport-teal/50 rounded-xl p-4 animate-bounce-in relative overflow-hidden">
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
                                                setShowHomelandInvite(false); // Dismiss after sharing
                                            }
                                        }}
                                        className="bg-passport-teal text-black text-xs font-bold px-4 py-2 rounded-full hover:scale-105 transition"
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
                        {/* Background Decor */}
                        <Globe className="absolute -right-4 -bottom-4 text-passport-teal/10 rotate-12" size={100} />
                    </div>
                )}

                {/* Favorites List Logic */}
                {favorites.length === 0 ? (
                    <div className="text-center opacity-50 mt-20 p-6 border border-dashed border-white/20 rounded-2xl">
                        <Heart size={48} className="mx-auto mb-4 text-white/20" />
                        <p className="text-sm text-white">No stations favorited.</p>
                        <button onClick={() => setActiveTab('discover')} className="text-passport-teal text-sm mt-2 font-bold hover:underline">Go Explore</button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedCountries.map((country) => (
                            <div key={country} className="animate-fade-in">
                                <h3 className="text-xs font-bold text-passport-teal uppercase tracking-widest mb-3 flex items-center gap-2 opacity-80 sticky top-14 bg-slate-900/90 p-1 rounded-md w-fit"><Globe size={14} /> {country}</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {groupedFavorites[country].map((station) => (
                                        <div key={station.stationuuid} onClick={() => {
                                            setCurrentStation(station);
                                            setIsPlaying(true);
                                            setActiveTab('discover');
                                        }} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer group transition active:scale-95">
                                            <div className="w-10 h-10 rounded-md bg-black/30 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                                <img src={station.favicon} onError={(e) => e.target.style.display = 'none'} className="w-full h-full object-contain" alt="icon" />
                                                <Radio size={18} className="text-white/20 absolute" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm truncate text-white">{station.name}</h4>
                                                <p className="text-xs text-white/50 truncate">{station.state || station.tags || 'Unknown Region'}</p>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); removeFavorite(e, station.stationuuid); }} className="p-2 text-white/30 hover:text-red-500 hover:bg-white/10 rounded-full transition z-20"><VolumeX size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoritesView;