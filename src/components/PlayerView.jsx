import React, { useEffect } from 'react';
import { Play, Pause, Heart, SkipForward, Volume2, VolumeX, MapPin, Trophy, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { genres } from '../data/cities';
import { useSongInfo } from '../hooks/useSongInfo';
import WeatherSystem from './WeatherSystem';
import LiveTravelFeed from './LiveTravelFeed';
import QuestWidget from './QuestWidget';
import { useProgression } from '../hooks/useProgression';

const PlayerView = ({ 
    currentStation, currentCity, isPlaying, setIsPlaying, toggleFavorite, favorites, stations, changeStation, isMuted, setIsMuted, volume, setVolume, filterGenre, setFilterGenre, swipeHandlers, slideDirection, questsEnabled 
}) => {

    const { user } = useAuth();
    const { cover } = useSongInfo(currentStation);
    
    // 👇 EXTRACT STATS & BADGES HERE
    const { updateProgress, recentUnlock, setRecentUnlock, stats, earnedBadges } = useProgression();

    // 🛠️ FIX: Create a Ref to hold the latest version of the function
    // This prevents the "Stale Closure" bug where the timer uses old stats
    const updateProgressRef = React.useRef(updateProgress);

    // Update the ref whenever the function changes
    useEffect(() => {
        updateProgressRef.current = updateProgress;
    }, [updateProgress]);

    const handleQuestComplete = () => {
        // Force an immediate update so the DB catches up with the visual timer
        updateProgress('ADD_LISTENING_TIME');
    };

    // 1. Station Visits Logic
    useEffect(() => {
        if (currentStation && user) {
            updateProgress('VISIT_STATION', { 
                stationId: currentStation.stationuuid, 
                country: currentStation.country 
            });
        }
    }, [currentStation, user]); 

    // 2. Passive Listening XP Logic (FIXED)
    useEffect(() => {
        let interval;
        if (isPlaying && user) {
            console.log("⏰ Timer Started: Tracking listening time...");
            
            interval = setInterval(() => {
                console.log("💓 Heartbeat: Triggering Update...");
                // ✅ Call the REF, not the stale variable
                // This ensures we always have the latest stats when the minute hits
                if (updateProgressRef.current) {
                    updateProgressRef.current('ADD_LISTENING_TIME');
                }
            }, 60000);
        }
        return () => {
            if (interval) clearInterval(interval);
            console.log("🛑 Timer Stopped");
        };
    }, [isPlaying, user]);

    // 3. Auto-Dismiss Badge Popup
    useEffect(() => {
        if (recentUnlock) {
            const timer = setTimeout(() => {
                if (typeof setRecentUnlock === 'function') setRecentUnlock(null);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [recentUnlock, setRecentUnlock]);

    // 4. Share Station Handler
    const handleShareStation = async () => {
        if (!currentStation) return;
        
        const shareData = {
            title: 'Passport Radio',
            text: `Vibing to ${currentStation.name} in ${currentStation.country}! 🎧✈️`,
            url: 'https://passportradio.netlify.app'
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                alert("Link copied to clipboard!"); 
            }
        } catch (err) {
            console.log("Share dismissed");
        }
    };


    return (
        <div className="w-full flex flex-col h-full px-4 overflow-hidden relative">
            
            {/* BADGE POPUP */}
            {recentUnlock && (
                <div 
                    onClick={() => { if (typeof setRecentUnlock === 'function') setRecentUnlock(null); }}
                    className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce cursor-pointer w-full max-w-xs group"
                >
                    <div className="bg-slate-900/95 backdrop-blur border border-passport-teal/50 text-white px-4 py-3 rounded-2xl shadow-[0_0_30px_rgba(20,184,166,0.3)] flex items-center gap-3 transition-transform group-active:scale-95">
                        <div className="bg-passport-teal/20 p-2 rounded-full text-passport-teal">
                            <Trophy size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-passport-teal text-[10px] uppercase tracking-widest mb-0.5">Badge Unlocked!</h4>
                            <p className="font-bold text-sm leading-none">{recentUnlock.label}</p>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-[10px] text-white/50">+{recentUnlock.xpReward} XP</p>
                                <p className="text-[9px] text-white/30 italic">Tap to dismiss</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GENRE FILTERS */}
            <div className="w-full max-w-lg flex gap-2 overflow-x-auto pt-6 pb-2 mb-2 no-scrollbar mask-edges shrink-0 relative z-30 mx-auto">
                <button onClick={() => setFilterGenre(null)} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex-shrink-0 shadow-sm ${!filterGenre ? 'bg-white text-passport-dark' : 'bg-black/40 text-white border border-white/20'}`}>All Vibes</button>
                {genres.map(g => (
                    <button key={g.id} onClick={() => setFilterGenre(g.id === filterGenre ? null : g.id)} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex-shrink-0 border border-white/10 shadow-sm ${filterGenre === g.id ? 'bg-passport-teal text-slate-900 border-passport-teal' : 'bg-black/40 text-white hover:bg-white/10'}`}>{g.label}</button>
                ))}
            </div>

            {/* MAIN CARD */}
            <div {...swipeHandlers} className="flex-1 w-full max-w-md mx-auto relative perspective-1000 min-h-0 flex flex-col pb-6">
                <div className="my-auto w-full">
                    <div className={`w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${slideDirection === 1 ? 'translate-x-[-20px] opacity-50' : ''} ${slideDirection === -1 ? 'translate-x-[20px] opacity-50' : ''} ${slideDirection === 0 ? 'translate-x-0 opacity-100' : ''}`}>
                        
                        <div className="relative group aspect-square w-full max-h-[35vh] mx-auto rounded-2xl overflow-hidden bg-black/50 mb-4 shadow-inner border border-white/5 shrink-1">
                            
                            {/* Share Button (Top Left) */}
                            <div className="absolute top-3 left-3 z-30">
                                <button onClick={handleShareStation} className="bg-black/40 hover:bg-black/60 text-white/80 hover:text-passport-teal backdrop-blur-md p-2 rounded-full transition shadow-lg border border-white/10 active:scale-95">
                                    <Share2 size={16} />
                                </button>
                            </div>

                            <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
                                {currentStation && <WeatherSystem city={currentCity} isMuted={isMuted} />}
                                {isPlaying && (
                                    <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-full animate-pulse leading-none shadow-lg flex items-center h-[32px]">LIVE</div>
                                )}
                            </div>

                            {/* 👇 UPDATED WIDGET WITH onComplete */}
                            {currentStation && questsEnabled && (
                                <div className="absolute bottom-0 left-0 w-full z-30 p-3 pointer-events-none">
                                    <div className="pointer-events-auto"> 
                                        <QuestWidget 
                                            stats={stats}
                                            earnedBadges={earnedBadges}
                                            isPlaying={isPlaying}
                                            onComplete={handleQuestComplete} // 👈 LINK IT HERE
                                        />
                                    </div>
                                </div>
                            )}

                            <img 
                                src={cover || currentStation?.favicon || '/fallback-station.png'} 
                                alt="Station Logo" 
                                onError={(e) => {
                                    if (e.target.src !== currentStation?.favicon) {
                                        e.target.src = currentStation?.favicon;
                                    } else {
                                        e.target.src = '/fallback-station.png';
                                    }
                                }} 
                                className={`w-full h-full object-cover p-0 group-hover:scale-105 transition duration-500 pointer-events-none select-none ${cover ? 'rounded-none blur-none' : 'object-contain p-6'}`} 
                            />
                        </div>

                        <div className="text-center mb-2 shrink-0">
                            <h1 className="text-xl font-bold truncate mb-1 text-white">{currentStation?.name || "No Station Found"}</h1>
                            <div className="flex items-center justify-center gap-2 text-passport-teal text-xs font-medium uppercase tracking-wider">
                                <MapPin size={14} /><span>{currentCity.name}, {currentCity.country}</span>
                            </div>
                            <div className="flex justify-center gap-1 mt-3">
                                {stations.slice(0, 5).map((s, i) => (<div key={i} className={`h-1 rounded-full transition-all ${s.stationuuid === currentStation?.stationuuid ? 'w-4 bg-passport-teal' : 'w-1 bg-white/20'}`} />))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 px-2 shrink-0 mt-3">
                            <button onClick={toggleFavorite} className="text-white/60 hover:text-red-500 transition p-2 active:scale-95">
                                <Heart size={24} fill={favorites.find(f => f.stationuuid === currentStation?.stationuuid) ? "currentColor" : "none"} />
                            </button>
                            
                            {/* Play / Pause */}
                            <button disabled={!currentStation} onClick={() => setIsPlaying(!isPlaying)} className="bg-white text-passport-dark p-4 rounded-full hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                            </button>

                            {/* Skip Button */}
                            <button onClick={() => changeStation(1)} className="text-white/60 hover:text-white transition p-2 active:scale-95"><SkipForward size={24} /></button>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 group shrink-0">
                            <button onClick={() => setIsMuted(!isMuted)}>{isMuted ? <VolumeX size={16} className="text-white/50" /> : <Volume2 size={16} className="text-white/50" />}</button>
                            <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-passport-teal" />
                        </div>
                    </div>
                    <div className="text-center text-white/20 text-[10px] mt-4 uppercase tracking-widest shrink-0">Swipe card to tune</div>
                </div>
            </div>
            
            <LiveTravelFeed cities={genres} />
        </div>
    );
};

export default PlayerView;