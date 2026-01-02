import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Trophy, Crown, User, Clock, ChevronLeft, MapPin, Gamepad2 } from 'lucide-react';
import { cities } from '../data/cities'; 

const LeaderboardView = ({ currentUser, onBack }) => {
    const [mode, setMode] = useState('time'); // 'time', 'score', 'country'
    const [selectedCountry, setSelectedCountry] = useState('United States');
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    const countries = [...new Set(cities.map(c => c.country))].sort();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const usersRef = collection(db, "users");
                let q;
                let isCountryMode = false;

                if (mode === 'score') {
                    q = query(usersRef, orderBy("highScore", "desc"), limit(20));
                } else {
                    q = query(usersRef, orderBy("totalTime", "desc"), limit(50));
                    if (mode === 'country') isCountryMode = true;
                }

                const querySnapshot = await getDocs(q);
                let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (isCountryMode) {
                    data = data
                        .filter(u => u.travelLogs && u.travelLogs[selectedCountry])
                        .sort((a, b) => {
                            const timeA = a.travelLogs[selectedCountry]?.time || a.travelLogs[selectedCountry] || 0;
                            const timeB = b.travelLogs[selectedCountry]?.time || b.travelLogs[selectedCountry] || 0;
                            return timeB - timeA;
                        })
                        .slice(0, 20);
                }

                setLeaders(data);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [mode, selectedCountry]);

    const formatTime = (seconds) => {
        if (!seconds) return "0m";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    return (
        <div className="flex flex-col h-full w-full max-w-md mx-auto pt-20 px-4 font-sans bg-slate-900">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Trophy className="text-yellow-400" /> Leaderboard
                </h2>
            </div>

            <div className="flex p-1 bg-black/20 rounded-xl mb-6">
                <button onClick={() => setMode('time')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${mode === 'time' ? 'bg-passport-teal text-slate-900 shadow-lg' : 'text-white/40 hover:text-white'}`}>Time</button>
                <button onClick={() => setMode('score')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${mode === 'score' ? 'bg-passport-teal text-slate-900 shadow-lg' : 'text-white/40 hover:text-white'}`}>Score</button>
                <button onClick={() => setMode('country')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${mode === 'country' ? 'bg-passport-teal text-slate-900 shadow-lg' : 'text-white/40 hover:text-white'}`}>Country</button>
            </div>

            {mode === 'country' && (
                <div className="mb-4 relative">
                    <MapPin className="absolute left-3 top-3 text-passport-teal" size={16} />
                    <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="w-full bg-white/10 border border-white/10 text-white rounded-xl py-2 pl-10 pr-4 appearance-none focus:outline-none focus:border-passport-teal">
                        {countries.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                    </select>
                </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 pb-20 custom-scrollbar">
                {loading ? <div className="text-center py-10 text-white/40 animate-pulse">Scanning Global Data...</div> : 
                 leaders.length === 0 ? <div className="text-center py-10 text-white/40">No records found.</div> : 
                 leaders.map((player, index) => {
                    let displayValue = mode === 'score' ? (player.highScore || 0) : formatTime(mode === 'country' ? (player.travelLogs?.[selectedCountry]?.time || player.travelLogs?.[selectedCountry]) : player.totalTime);
                    let icon = mode === 'score' ? <Gamepad2 size={14} /> : <Clock size={14} />;

                    return (
                        <div key={player.id} className={`flex items-center gap-4 p-3 rounded-xl border transition ${player.id === currentUser?.uid ? 'bg-passport-teal/10 border-passport-teal/50' : 'bg-black/20 border-white/5'}`}>
                            <div className="w-8 flex justify-center font-black text-xl italic text-white/20">
                                {index === 0 ? <Crown size={24} className="text-yellow-400 drop-shadow-glow" /> : `#${index + 1}`}
                            </div>
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/10 shrink-0">
                                {player.photoURL ? <img src={player.photoURL} alt={player.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20"><User size={16} /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-white truncate text-sm">{player.displayName || "Anonymous Traveler"}</div>
                                {player.id === currentUser?.uid && <div className="text-[10px] text-passport-teal uppercase tracking-wider font-bold">That's You!</div>}
                            </div>
                            <div className="flex items-center gap-1 text-white/80 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="text-passport-teal">{icon}</span>
                                <span className="font-mono font-bold text-sm">{displayValue}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default LeaderboardView;