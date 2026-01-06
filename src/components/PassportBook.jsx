import React, { useState, useEffect, useMemo } from 'react';
import { Book, X, Stamp, Share2, Trophy, Medal, Loader, Infinity } from 'lucide-react'; 
import PassportStamp from './PassportStamp';
import { cities } from '../data/cities';
// import { BADGES } from '../data/badges'; // We use getBadgeDetails now
import { playTeleportSound, playErrorSound } from '../utils/audio';
import PassportShareModal from './PassportShareModal'; 

// 👇 IMPORTS FOR DIRECT FETCHING & UTILS
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getBadgeDetails } from '../utils/badgeUtils'; // 👈 Needed for grouping

const PassportBook = ({ onClose, travelLogs, onTravel }) => {
    
    const { user } = useAuth(); 
    const [activeTab, setActiveTab] = useState('stamps'); 
    const [showShareModal, setShowShareModal] = useState(false);
    
    // INTERNAL STATE FOR BADGES
    const [fetchedBadges, setFetchedBadges] = useState([]);
    const [loadingBadges, setLoadingBadges] = useState(true);

    // FETCH BADGES DIRECTLY FROM FIREBASE
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

    // 🧠 SMART BADGE GROUPING LOGIC
    // ------------------------------------------------------
    const processedBadges = useMemo(() => {
        const uniqueList = [];
        const paragonLevels = [];

        // 1. Sort badges into "Standard" vs "Paragon"
        fetchedBadges.forEach(badgeId => {
            if (badgeId.startsWith('paragon_level_')) {
                // Extract the number: "paragon_level_5" -> 5
                const level = parseInt(badgeId.split('_')[2], 10);
                if (!isNaN(level)) paragonLevels.push(level);
            } else {
                uniqueList.push(badgeId);
            }
        });

        // 2. Convert standard IDs to full Badge Objects
        // We use getBadgeDetails so we get the Icon, Label, etc.
        let displayList = uniqueList.map(id => getBadgeDetails(id));

        // 3. Create the "Stacked" Paragon Badge (if applicable)
        if (paragonLevels.length > 0) {
            const maxLevel = Math.max(...paragonLevels);
            
            displayList.push({
                id: 'paragon_master', // Unique ID for React Key
                label: `Paragon Level ${maxLevel}`,
                description: `Reached the ${maxLevel}th tier of infinity.`,
                icon: Infinity,
                type: 'paragon',
                xpReward: maxLevel * 500 // Show total XP earned from Paragon!
            });
        }

        return displayList;
    }, [fetchedBadges]);

    // Sort logs by time (Existing Logic)
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
                            {activeTab === 'stamps' ? `${stats.length} Visas Collected` : `${fetchedBadges.length} Badges Earned`}
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

                {/* 🅱️ BADGES VIEW (Using Processed Grouped List) */}
                {activeTab === 'badges' && (
                    loadingBadges ? (
                        <div className="flex justify-center py-20 opacity-50">
                            <Loader className="animate-spin text-white" />
                        </div>
                    ) : processedBadges.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-white/30 space-y-4">
                            <Trophy size={48} className="opacity-20" />
                            <p className="text-sm font-mono uppercase">No badges earned yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-24">
                            {processedBadges.map((badge) => {
                                const Icon = badge.icon;
                                const isParagon = badge.type === 'paragon';

                                return (
                                    <div 
                                        key={badge.id} 
                                        className={`backdrop-blur-md border rounded-xl p-4 flex flex-col items-center text-center gap-3 transition-all group
                                            ${isParagon 
                                                ? 'bg-indigo-950/60 border-indigo-500/50 hover:border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]' // 🟣 Paragon Style
                                                : 'bg-black/40 border-white/10 hover:border-amber-400/50' // 🟡 Standard Style
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border group-hover:scale-110 transition-transform
                                            ${isParagon 
                                                ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                                : 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                                            }`}
                                        >
                                            <Icon size={24} className={`drop-shadow-md ${isParagon ? 'text-indigo-300' : 'text-amber-400'}`} />
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm uppercase tracking-wide ${isParagon ? 'text-indigo-200' : 'text-white'}`}>
                                                {badge.label}
                                            </h3>
                                            <p className="text-[10px] text-white/50 mt-1 leading-tight">{badge.description}</p>
                                        </div>
                                        <div className="mt-auto pt-2">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded shadow-sm
                                                ${isParagon 
                                                    ? 'bg-indigo-500 text-white' 
                                                    : 'bg-amber-400 text-black'
                                                }`}
                                            >
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
                    earnedBadges={fetchedBadges} // Pass raw IDs if share modal needs them
                />
            )}
        </div>
    );
};

export default PassportBook;