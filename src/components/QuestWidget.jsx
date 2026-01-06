import React, { useState, useEffect } from 'react';
import { Flame, Star, Infinity } from 'lucide-react';

// 🛠️ STANDARD QUESTS (Up to Rank 10)
const QUEST_DEFINITIONS = [
    { id: 'scout_rank_1', title: 'Signal Rookie', target: 5, unit: 'mins', statKey: 'totalMinutes', type: 'time' },
    { id: 'scout_rank_2', title: 'Frequency Finder', target: 30, unit: 'mins', statKey: 'totalMinutes', type: 'time' },
    { id: 'scout_rank_3', title: 'Broadcast Hunter', target: 60, unit: 'mins', statKey: 'totalMinutes', type: 'time' },
    { id: 'scout_rank_4', title: 'Signal Master', target: 300, unit: 'mins', statKey: 'totalMinutes', type: 'time' }, // 5h
    { id: 'scout_rank_5', title: 'Global Monitor', target: 720, unit: 'mins', statKey: 'totalMinutes', type: 'time' }, // 12h
    { id: 'scout_rank_6', title: 'Frequency Sage', target: 1440, unit: 'mins', statKey: 'totalMinutes', type: 'time' }, // 24h
    { id: 'scout_rank_7', title: 'Airwave Legend', target: 6000, unit: 'mins', statKey: 'totalMinutes', type: 'time' }, // 100h
    
    // ⚔️ TITAN TIER
    { id: 'scout_rank_8', title: 'Sonic Titan', target: 12000, unit: 'mins', statKey: 'totalMinutes', type: 'time' }, // 200h
    { id: 'scout_rank_9', title: 'Void Walker', target: 30000, unit: 'mins', statKey: 'totalMinutes', type: 'time' }, // 500h
    { id: 'scout_rank_10', title: 'The Constant', target: 60000, unit: 'mins', statKey: 'totalMinutes', type: 'time' }, // 1000h
];

const QuestWidget = ({ stats = {}, earnedBadges = [], isPlaying, onComplete }) => {
    
    // 1. DETERMINE ACTIVE MODE
    // Check if we have a standard quest left
    let activeQuest = QUEST_DEFINITIONS.find(q => !earnedBadges.includes(q.id));
    
    // 2. PARAGON MODE (The Infinite Fallback)
    // If activeQuest is undefined, we enter "Paragon Mode"
    const isParagon = !activeQuest;
    let paragonLevel = 0;
    
    if (isParagon) {
        // Calculate Paragon Level: (TotalMinutes - 60,000) / 1440 (Days)
        const baseMins = stats.totalMinutes || 0;
        const capstone = 60000; // Rank 10 requirement
        
        // Only start paragon math if we are actually past the capstone
        if (baseMins > capstone) {
            paragonLevel = Math.floor((baseMins - capstone) / 1440) + 1;
        } else {
            paragonLevel = 1;
        }

        // Construct Dynamic Quest
        activeQuest = {
            id: `paragon_level_${paragonLevel}`, // Unique ID per day
            title: `Paragon Level ${paragonLevel + 1}`, // Target is NEXT level
            // Target is: Capstone + (Level * 24h)
            target: capstone + (paragonLevel * 1440), 
            unit: 'mins',
            statKey: 'totalMinutes',
            type: 'time'
        };
    }

    // 3. INTERNAL STOPWATCH
    const [localSeconds, setLocalSeconds] = useState(0);

    // Reset local counter when DB updates
    useEffect(() => {
        setLocalSeconds(0);
    }, [stats.totalMinutes]); // Only watch totalMinutes

    // Tick the stopwatch
    useEffect(() => {
        if (!isPlaying || !activeQuest) return;
        const interval = setInterval(() => {
            setLocalSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isPlaying, activeQuest]);


    // 4. CHECK FOR COMPLETION (Unified Logic)
    useEffect(() => {
         if (!activeQuest) return;

         // 🔒 HARD LOCK: Prevents loops for current quest ID
         const lockKey = `passport_quest_locked_${activeQuest.id}`;
         if (localStorage.getItem(lockKey) === 'true') return;

         const baseMinutes = stats.totalMinutes || 0;
         const currentTotal = baseMinutes + (localSeconds/60);
         
         if (currentTotal >= activeQuest.target) {
             
             // 🔒 Lock immediately
             localStorage.setItem(lockKey, 'true');
             
             console.log("🏆 Quest Completed:", activeQuest.id);
             
             if (onComplete) {
                 // For Paragon, we might want a special handler, but onComplete(id) works
                 // if your parent component just logs it or awards generic XP.
                 onComplete(activeQuest.id);
             }
         }
    }, [localSeconds, stats, activeQuest, onComplete]);


    // 5. DISPLAY LOGIC
    // If locked locally but DB hasn't synced, show "Completing..."
    const lockKey = `passport_quest_locked_${activeQuest.id}`;
    const isLocked = typeof window !== 'undefined' && localStorage.getItem(lockKey) === 'true';

    const baseValue = stats.totalMinutes || 0;
    const totalSecondsNeeded = (activeQuest.target * 60);
    const currentSecondsTotal = (baseValue * 60) + localSeconds;

    // Display Percent
    // For Paragon, we want the bar to fill relative to the LAST level, not 0.
    let minBarValue = 0;
    if (isParagon) {
        // The "Start" of this bar is the previous paragon target
        minBarValue = (activeQuest.target - 1440) * 60;
    }
    
    const displayValue = currentSecondsTotal;
    
    // Calculate percentage relative to the current "Step"
    const range = totalSecondsNeeded - minBarValue;
    const progressInStep = displayValue - minBarValue;
    const percent = Math.min(100, Math.max(0, (progressInStep / range) * 100));

    // Time Remaining Text
    const secondsLeft = Math.max(0, totalSecondsNeeded - currentSecondsTotal);
    const h = Math.floor(secondsLeft / 3600);
    const m = Math.floor((secondsLeft % 3600) / 60);
    const s = Math.floor(secondsLeft % 60);
    
    let remainingText = '';
    
    if (secondsLeft === 0 || isLocked) {
        remainingText = 'Completing...';
    } else if (h > 0) {
        remainingText = `${h}h ${m}m left`;
    } else {
        remainingText = `${m}m ${s.toString().padStart(2, '0')}s left`;
    }

    return (
        <div className="absolute bottom-4 left-4 right-4 z-30 animate-fade-in-up">
            <div className={`backdrop-blur-md border rounded-xl p-2.5 flex items-center gap-3 shadow-lg transition-colors duration-500
                ${isParagon 
                    ? 'bg-indigo-900/60 border-indigo-500/30 shadow-indigo-500/20' // Paragon Style
                    : 'bg-black/60 border-white/10' // Standard Style
                }`}
            >
                <div className={`p-1.5 rounded-lg shrink-0 ${isParagon ? 'bg-indigo-500/20' : 'bg-white/10'}`}>
                    {isParagon ? (
                        <Infinity size={14} className="text-indigo-400 animate-pulse" />
                    ) : (
                        <Flame size={14} className="text-orange-400 animate-pulse" />
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider">
                            {isParagon ? 'Paragon Tier' : 'Next Rank'}: <span className={isParagon ? "text-indigo-400" : "text-passport-teal"}>{activeQuest.title}</span>
                        </span>
                        <span className="text-[9px] text-white/50 font-mono tabular-nums">
                            {remainingText}
                        </span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(251,146,60,0.5)]
                                ${isParagon 
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-400 shadow-indigo-500/50' 
                                    : 'bg-gradient-to-r from-orange-400 to-passport-teal'
                                }`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestWidget;