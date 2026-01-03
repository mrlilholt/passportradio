import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'; // 🟢 Changed getDocs to onSnapshot
import { Trophy, Crown, User, Clock, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

const LeaderboardView = ({ currentUser, onBack }) => {
    const [mode, setMode] = useState('time'); // 'time', 'score'
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Track which user's details are open
    const [expandedUser, setExpandedUser] = useState(null);

    const formatTime = (seconds) => {
        if (!seconds) return "0s";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m ${seconds % 60}s`;
    };

    // 🟢 REAL-TIME DATA SYNC
    useEffect(() => {
        setLoading(true);
        const usersRef = collection(db, "users");
        let q;

        // Define the query based on mode
        if (mode === 'score') {
            q = query(usersRef, orderBy("highScore", "desc"), limit(20));
        } else {
            q = query(usersRef, orderBy("totalTime", "desc"), limit(50));
        }

        // 🟢 LISTEN (onSnapshot) instead of FETCH (getDocs)
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Add Ranks
            setLeaders(data.map((u, i) => ({ ...u, rank: i + 1 })));
            setLoading(false);
        }, (error) => {
            console.error("Error listening to leaderboard:", error);
            setLoading(false);
        });

        // Cleanup listener when component unmounts or mode changes
        return () => unsubscribe();
    }, [mode]);

    const getTopCountries = (logs) => {
        if (!logs) return [];
        return Object.entries(logs)
            .map(([country, data]) => {
                const time = (typeof data === 'number') ? data : data.time || 0;
                return { country, time };
            })
            .sort((a, b) => b.time - a.time)
            .slice(0, 5);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white relative animate-fade-in">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 bg-white/5 border-b border-white/10 shrink-0 z-10">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="text-yellow-400" /> Global Travelers
                    {/* Live Indicator */}
                    <span className="flex h-2 w-2 relative ml-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                </h2>
            </div>

            {/* Toggle Switch */}
            <div className="p-4 pb-2 shrink-0">
                <div className="flex bg-white/10 p-1 rounded-xl">
                    <button 
                        onClick={() => { setMode('time'); setExpandedUser(null); }} 
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'time' ? 'bg-passport-teal text-slate-900 shadow-lg' : 'text-white/50 hover:text-white'}`}
                    >
                        <Clock size={16} /> Most Traveled
                    </button>
                    <button 
                        onClick={() => { setMode('score'); setExpandedUser(null); }} 
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${mode === 'score' ? 'bg-passport-pink text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                    >
                        <Trophy size={16} /> High Scores
                    </button>
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                {loading ? (
                    <div className="text-center text-white/50 py-10 animate-pulse">Syncing live data...</div>
                ) : (
                    leaders.map((player, index) => {
                        const isExpanded = expandedUser === player.id;
                        
                        let displayValue, icon;
                        if (mode === 'score') {
                            displayValue = player.highScore?.toLocaleString() || 0;
                            icon = <Trophy size={14} />;
                        } else {
                            displayValue = formatTime(player.totalTime || 0);
                            icon = <Clock size={14} />;
                        }

                        return (
                            <div 
                                key={player.id} 
                                onClick={() => setExpandedUser(isExpanded ? null : player.id)}
                                className={`rounded-xl border transition-all duration-300 overflow-hidden cursor-pointer
                                    ${player.id === currentUser?.uid ? 'bg-passport-teal/10 border-passport-teal/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}
                                `}
                            >
                                <div className="flex items-center gap-4 p-3">
                                    <div className="w-8 font-black text-xl text-center italic text-white/20">
                                        {index === 0 ? <Crown size={24} className="text-yellow-400 drop-shadow-glow" /> : `#${index + 1}`}
                                    </div>
                                    
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/10 shrink-0">
                                        {player.photoURL ? 
                                            <img src={player.photoURL} alt={player.displayName} className="w-full h-full object-cover" /> 
                                            : <div className="w-full h-full flex items-center justify-center text-white/20"><User size={16} /></div>
                                        }
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-white truncate text-sm">
                                            {player.displayName || "Anonymous Traveler"}
                                        </div>
                                        {player.id === currentUser?.uid && 
                                            <div className="text-[10px] text-passport-teal uppercase tracking-wider font-bold">That's You!</div>
                                        }
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-white/80 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                            <span className="text-passport-teal">{icon}</span>
                                            <span className="font-mono font-bold text-sm min-w-[3ch] text-right">{displayValue}</span>
                                        </div>
                                        {mode === 'time' && (
                                            <div className="text-white/30">
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isExpanded && mode === 'time' && (
                                    <div className="bg-black/20 p-3 pt-0 border-t border-white/5 animate-fade-in">
                                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold ml-12">
                                            Top Destinations
                                        </div>
                                        <div className="space-y-1 ml-12">
                                            {getTopCountries(player.travelLogs).length > 0 ? (
                                                getTopCountries(player.travelLogs).map((c, i) => (
                                                    <div key={i} className="flex justify-between items-center text-xs bg-white/5 px-3 py-1.5 rounded hover:bg-white/10 transition">
                                                        <span className="text-white/80 font-medium">{c.country}</span>
                                                        <span className="font-mono text-passport-teal">{formatTime(c.time)}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-white/30 text-xs italic">No specific travel data yet.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
export default LeaderboardView;