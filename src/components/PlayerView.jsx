import React from 'react';
import { Play, Pause, Heart, SkipForward, Volume2, VolumeX, MapPin, Compass, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { genres } from '../data/cities';
import { useSongInfo } from '../hooks/useSongInfo';
import WeatherSystem from './WeatherSystem';

// 1. Changed "=> (" to "=> {" to allow logic before returning
const PlayerView = ({ currentStation, currentCity, isPlaying, setIsPlaying, toggleFavorite, favorites, stations, changeStation, isMuted, setIsMuted, volume, setVolume, filterGenre, setFilterGenre, swipeHandlers, slideDirection, onTravel, setShowPassportProfile }) => {

    const { user } = useAuth();
    // 2. Hook must be called here, at the top level
    const { cover } = useSongInfo(currentStation);

    // 3. Explicit "return" statement starts here
    return (
        <div className="w-full flex flex-col h-full px-4 overflow-hidden relative">
            <div className="w-full max-w-lg flex gap-2 overflow-x-auto pt-6 pb-2 mb-2 no-scrollbar mask-edges shrink-0 relative z-30 mx-auto">
                <button onClick={() => setFilterGenre(null)} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex-shrink-0 shadow-sm ${!filterGenre ? 'bg-white text-passport-dark' : 'bg-black/40 text-white border border-white/20'}`}>All Vibes</button>
                {genres.map(g => (
                    <button key={g.id} onClick={() => setFilterGenre(g.id === filterGenre ? null : g.id)} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex-shrink-0 border border-white/10 shadow-sm ${filterGenre === g.id ? 'bg-passport-teal text-slate-900 border-passport-teal' : 'bg-black/40 text-white hover:bg-white/10'}`}>{g.label}</button>
                ))}
            </div>

            <div {...swipeHandlers} className="flex-1 w-full max-w-md mx-auto relative perspective-1000 min-h-0 flex flex-col pb-6">
                <div className="my-auto w-full">
                    <div className={`w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${slideDirection === 1 ? 'translate-x-[-20px] opacity-50' : ''} ${slideDirection === -1 ? 'translate-x-[20px] opacity-50' : ''} ${slideDirection === 0 ? 'translate-x-0 opacity-100' : ''}`}>
                        <div className="relative group aspect-square w-full max-h-[35vh] mx-auto rounded-2xl overflow-hidden bg-black/50 mb-4 shadow-inner border border-white/5 shrink-1">
                            
                            {/* Updated Image Logic with Cover Art */}
                            <img 
                                src={cover || currentStation?.favicon || '/fallback-station.png'} 
                                alt="Station Logo" 
                                onError={(e) => {
                                    // Fallback chain: Cover -> Favicon -> Local Fallback
                                    if (e.target.src !== currentStation?.favicon) {
                                        e.target.src = currentStation?.favicon;
                                    } else {
                                        e.target.src = '/fallback-station.png';
                                    }
                                }} 
                                className={`w-full h-full object-cover p-0 group-hover:scale-105 transition duration-500 pointer-events-none select-none ${cover ? 'rounded-none blur-none' : 'object-contain p-6'}`} 
                            />
                            
                            {/* 🟢 NEW TOP-RIGHT WIDGET CONTAINER */}
                            <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
                                {/* Weather Widget */}
                                {currentStation && <WeatherSystem city={currentCity} />}
                                
                                {/* LIVE Indicator (Removed absolute positioning from here) */}
                                {isPlaying && (
                                    <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-full animate-pulse leading-none shadow-lg flex items-center h-[26px]">
                                        LIVE
                                    </div>
                                )}
                            </div>

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
                            <button disabled={!currentStation} onClick={() => setIsPlaying(!isPlaying)} className="bg-white text-passport-dark p-4 rounded-full hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                            </button>
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
        </div>
    );
}; // 4. Close brace here

export default PlayerView;