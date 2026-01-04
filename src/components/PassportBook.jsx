import React, { useState, useEffect } from 'react';
import { Book, X, Stamp, Share2, Trophy, Medal, Loader } from 'lucide-react'; 
import PassportStamp from './PassportStamp';
import { cities } from '../data/cities';
import { BADGES } from '../data/badges'; 
import { playTeleportSound, playErrorSound } from '../utils/audio';
import PassportShareModal from './PassportShareModal'; 

// 👇 NEW IMPORTS FOR DIRECT FETCHING
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const PassportBook = ({ onClose, travelLogs, onTravel }) => {
    
    const { user } = useAuth(); // 1. Get current user
    const [activeTab, setActiveTab] = useState('stamps'); 
    const [showShareModal, setShowShareModal] = useState(false);
    
    // 2. INTERNAL STATE FOR BADGES
    const [fetchedBadges, setFetchedBadges] = useState([]);
    const [loadingBadges, setLoadingBadges] = useState(true);

    // 3. FETCH BADGES DIRECTLY FROM FIREBASE
    useEffect(() => {
        const fetchBadges = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFetchedBadges(data.badges || []);
                }
            } catch (err) {
                console.error("Error fetching badges:", err);
            } finally {
                setLoadingBadges(false);
            }
        };

        fetchBadges();
    }, [user]);

    // 4. Sort logs by time (Existing Logic)
    const stats = Object.entries(travelLogs || {}).sort(([, a], [, b]) => {
        const timeA = typeof a === 'number' ? a : a.time;
        const timeB = typeof b === 'number' ? b : b.time;
        return timeB - timeA;
    });

    const handleStampClick = (countryIso, countryName) => {
        const targetCity = cities.find(c => c.iso.toLowerCase() === countryIso.toLowerCase()) 
                        || cities.find(c => c.country.toLowerCase() === countryName.toLowerCase());
        
        if (targetCity) {
            playTeleportSound();
            setTimeout(() => {
                onTravel(targetCity); 
            }, 200);
        } else {
            playErrorSound();
        }
    };

    // 5. Filter the full BADGES list using the IDs we fetched
    const myBadges = BADGES.filter(b => fetchedBadges.includes(b.id));

    return (
        <div className="absolute inset-0 z-50 flex flex-col bg-[#1a1a1a] text-white animate-fade-in font-sans">
            
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-passport-teal/20 p-2 rounded-lg">
                        <Book size={20} className="text-passport-teal" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-wider text-white">My Passport</h2>
                        <div className="text-[10px] text-white/50 uppercase tracking-widest">
                            {activeTab === 'stamps' ? `${stats.length} Visas Collected` : `${myBadges.length} Badges Earned`}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowShareModal(true)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title="Share Passport"
                    >
                        <Share2 size={20} className="text-white/60" />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* --- TABS --- */}
            <div className="flex p-2 gap-2 bg-black/40 border-b border-white/5">
                <button 
                    onClick={() => setActiveTab('stamps')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === 'stamps' 
                        ? 'bg-passport-teal text-slate-900 shadow-[0_0_10px_rgba(20,184,166,0.3)]' 
                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <Stamp size={14} /> Visas
                </button>
                <button 
                    onClick={() => setActiveTab('badges')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === 'badges' 
                        ? 'bg-amber-400 text-slate-900 shadow-[0_0_10px_rgba(251,191,36,0.3)]' 
                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <Medal size={14} /> Badges
                </button>
            </div>

            {/* --- SCROLLABLE CONTENT --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                
                {/* 🅰️ STAMPS VIEW */}
                {activeTab === 'stamps' && (
                    stats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-white/30 space-y-4">
                            <Stamp size={48} className="opacity-20" />
                            <p className="text-sm font-mono uppercase">No stamps collected yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-center content-start gap-8 pb-24">
                            {stats.map(([country, data]) => {
                                const seconds = typeof data === 'number' ? data : data.time;
                                const iso = (typeof data === 'object' && data.iso) ? data.iso : 'xx';
                                
                                return (
                                    <PassportStamp 
                                        key={country}
                                        country={country}
                                        iso={iso}
                                        secondsListened={seconds}
                                        onTravel={() => handleStampClick(iso, country)}
                                    />
                                );
                            })}
                        </div>
                    )
                )}

                {/* 🅱️ BADGES VIEW (Fetching Directly) */}
                {activeTab === 'badges' && (
                    loadingBadges ? (
                        <div className="flex justify-center py-20 opacity-50">
                            <Loader className="animate-spin text-white" />
                        </div>
                    ) : myBadges.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-white/30 space-y-4">
                            <Trophy size={48} className="opacity-20" />
                            <p className="text-sm font-mono uppercase">No badges earned yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-24">
                            {myBadges.map((badge) => {
                                const Icon = badge.icon;
                                return (
                                    <div key={badge.id} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col items-center text-center gap-3 hover:border-amber-400/50 transition-colors group">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center border border-amber-400/30 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                                            <Icon size={24} className="text-amber-400 drop-shadow-md" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-white uppercase tracking-wide">{badge.label}</h3>
                                            <p className="text-[10px] text-white/50 mt-1 leading-tight">{badge.description}</p>
                                        </div>
                                        <div className="mt-auto pt-2">
                                            <span className="text-[9px] font-black bg-amber-400 text-black px-2 py-0.5 rounded shadow-sm">
                                                +{badge.xpReward} XP
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}

            </div>
            
            {/* Footer Text */}
            <div className="p-4 text-center text-[10px] uppercase tracking-widest text-white/30 border-t border-white/5 bg-black/20 backdrop-blur-xl z-10">
                Passport Radio • Official Document
            </div>

            {/* RENDER MODAL */}
            {showShareModal && (
                <PassportShareModal 
                    travelLogs={travelLogs} 
                    onClose={() => setShowShareModal(false)}
                    earnedBadges={fetchedBadges} // Use the locally fetched ones
                />
            )}
        </div>
    );
};

export default PassportBook;