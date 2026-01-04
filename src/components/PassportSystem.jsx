import React, { useState, useEffect } from 'react';
import { Trophy, Users, Star } from 'lucide-react';

// This component handles all the "Game" logic: Quests, Travelers, XP
const PassportSystem = ({ currentCity, isPlaying, user }) => {
    
    // -- STATE FOR NEW FEATURES --
    const [activeQuest, setActiveQuest] = useState(null);
    const [liveTravelers, setLiveTravelers] = useState(0);

    // -- SIMULATE DATA (Placeholder for next steps) --
    useEffect(() => {
        if (!currentCity) return;
        
        // 1. Generate a Quest for this city
        setActiveQuest({
            id: 1,
            task: `Tune in to ${currentCity.name} for 10m`,
            reward: 50,
            progress: 0
        });

        // 2. Simulate random travelers listening
        setLiveTravelers(Math.floor(Math.random() * 15) + 2);

    }, [currentCity]);

    if (!currentCity) return null;

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-hidden">
            {/* This is your "Game Layer". 
               pointer-events-none ensures clicks pass through to the player 
               unless they hit a specific button we add here.
            */}

            {/* --- TOP LEFT: LIVE TRAVELERS BADGE --- */}
            <div className="absolute top-4 left-4 pointer-events-auto">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-white shadow-lg animate-fade-in">
                    <Users size={12} className="text-passport-teal" />
                    <span>{liveTravelers} listening</span>
                </div>
            </div>

            {/* --- BOTTOM CENTER: QUEST NOTIFICATION (Floating) --- */}
            {activeQuest && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xs pointer-events-auto">
                    <div className="mx-4 bg-slate-900/90 border border-passport-gold/30 p-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
                        <div className="bg-passport-gold/20 p-2 rounded-full shrink-0">
                            <Trophy size={16} className="text-passport-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] text-passport-gold uppercase font-bold tracking-wider">New Quest</h4>
                            <p className="text-xs text-white truncate">{activeQuest.task}</p>
                        </div>
                        <div className="text-xs font-bold text-passport-gold">+{activeQuest.reward}XP</div>
                    </div>
                </div>
            )}

            {/* Space for future specific "Update Inserts" */}
        </div>
    );
};

export default PassportSystem;