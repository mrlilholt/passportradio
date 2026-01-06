import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import QuestWidget from './QuestWidget';
import ParagonWidget from './ParagonWidget'; // 👈 Import new component
import { getBadgeDetails } from '../utils/badgeUtils';

const PassportSystem = ({ currentCity, isPlaying, user, stats, earnedBadges, onQuestComplete }) => {
    
    // ... (Keep existing state and handlers) ...
    const [notification, setNotification] = useState(null);
    const [liveTravelers, setLiveTravelers] = useState(0);

    useEffect(() => {
        if (!currentCity) return;
        setLiveTravelers(Math.floor(Math.random() * 15) + 2);
    }, [currentCity]);

    const handleQuestComplete = (questId) => {
        const badgeInfo = getBadgeDetails(questId);
        setNotification(badgeInfo);
        if (onQuestComplete) onQuestComplete(questId);
        setTimeout(() => setNotification(null), 5000);
    };

    if (!currentCity) return null;

    // 🔍 CHECK: Are we in Paragon Mode?
    const TITAN_CAP = 60000; // Must match the value in your files
    const totalMinutes = stats?.totalMinutes || 0;
    const isParagonMode = totalMinutes >= TITAN_CAP;

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-hidden">
            
            {/* Live Travelers */}
            <div className="absolute top-4 left-4 pointer-events-auto">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-white shadow-lg animate-fade-in">
                    <Users size={12} className="text-passport-teal" />
                    <span>{liveTravelers} listening</span>
                </div>
            </div>

            {/* 🔀 THE SWITCH */}
            {isParagonMode ? (
                // 🌌 PARAGON MODE (Replaces Quest Widget)
                <ParagonWidget 
                    stats={stats}
                    isPlaying={isPlaying}
                    onComplete={handleQuestComplete}
                />
            ) : (
                // 🛡️ STANDARD MODE
                <QuestWidget 
                    stats={stats} 
                    earnedBadges={earnedBadges} 
                    isPlaying={isPlaying} 
                    onComplete={handleQuestComplete} 
                />
            )}

            {/* Notification Toast */}
            {notification && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-xs pointer-events-auto z-50">
                    <div className="mx-4 bg-slate-900/90 border border-passport-gold/30 p-3 rounded-xl shadow-[0_0_30px_rgba(251,191,36,0.2)] flex items-center gap-3 animate-slide-up">
                        <div className="bg-passport-gold/20 p-2 rounded-full shrink-0 animate-pulse">
                            <notification.icon size={20} className="text-passport-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] text-passport-gold uppercase font-bold tracking-wider">
                                Badge Unlocked!
                            </h4>
                            <p className="text-sm font-bold text-white truncate">
                                {notification.label}
                            </p>
                        </div>
                        <div className="text-xs font-black text-passport-gold bg-passport-gold/10 px-2 py-1 rounded">
                            +{notification.xpReward} XP
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PassportSystem;