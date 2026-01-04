import React, { useState, useEffect } from 'react';
import { Flame, CheckCircle, Shield } from 'lucide-react';

// 🛠️ QUEST DEFINITIONS
const QUEST_DEFINITIONS = [
    { 
        id: 'scout_rank_1', 
        title: 'Signal Rookie', 
        target: 5, 
        unit: 'mins', 
        statKey: 'totalMinutes',
        type: 'time'
    },
    { 
        id: 'explorer_novice', 
        title: 'Globetrotter', 
        target: 5, 
        unit: 'countries', 
        statKey: 'uniqueCountries',
        type: 'array' 
    },
    { 
        id: 'scout_rank_2', 
        title: 'Frequency Finder', 
        target: 30, 
        unit: 'mins', 
        statKey: 'totalMinutes',
        type: 'time'
    },
    { 
        id: 'broadcast_hunter', 
        title: 'Broadcast Hunter', 
        target: 60, 
        unit: 'mins', 
        statKey: 'totalMinutes',
        type: 'time'
    },
    { 
        id: 'surfer', 
        title: 'Channel Surfer', 
        target: 50, 
        unit: 'stations', 
        statKey: 'uniqueStations',
        type: 'array'
    }
];

const QuestWidget = ({ stats = {}, earnedBadges = [], isPlaying, onComplete }) => {
    
    // 1. Find active quest
    const activeQuest = QUEST_DEFINITIONS.find(q => !earnedBadges.includes(q.id));
    
    // 2. INTERNAL STOPWATCH (The missing piece!)
    // This fills the gap between the 1-minute database updates
    const [localSeconds, setLocalSeconds] = useState(0);

    // A. RESET local counter whenever the REAL stats change (The Handshake)
    useEffect(() => {
        setLocalSeconds(0);
    }, [stats[activeQuest?.statKey]]);

    // B. TICKER: Increment local seconds while playing
    useEffect(() => {
        if (!isPlaying || !activeQuest || activeQuest.type !== 'time') return;

        const interval = setInterval(() => {
            setLocalSeconds(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, activeQuest]);


    // 3. CHECK FOR COMPLETION
    // We check this inside the render logic mostly, but if you need a trigger:
    useEffect(() => {
         if (!activeQuest || activeQuest.type !== 'time') return;
         const baseMinutes = stats[activeQuest.statKey] || 0;
         // Check if we crossed the line visually
         if (baseMinutes + (localSeconds/60) >= activeQuest.target) {
             if (onComplete) onComplete();
         }
    }, [localSeconds, stats, activeQuest, onComplete]);


    // 4. Completion State (All quests done)
    if (!activeQuest) {
        return (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-passport-teal text-passport-dark px-4 py-2 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.6)] flex items-center gap-2 animate-pulse z-30">
                <Shield size={16} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-wider">All Quests Complete!</span>
            </div>
        );
    }

    // 5. Calculate Display Values
    let baseValue = 0;
    if (activeQuest.type === 'array') {
        baseValue = (stats[activeQuest.statKey] || []).length;
    } else {
        baseValue = stats[activeQuest.statKey] || 0;
    }

    // ------------------------------------------------
    // 6. UNIFIED DISPLAY LOGIC
    // ------------------------------------------------
    let displayValue = baseValue;
    let remainingText = '';
    
    if (activeQuest.type === 'time') {
        // A. Setup Constants (Target vs Current DB)
        const totalSecondsNeeded = (activeQuest.target * 60);
        const dbSeconds = (baseValue * 60); 
        
        // B. Total Progress = Static DB Time + Ticking Local Seconds
        const currentSecondsTotal = dbSeconds + localSeconds;

        // C. Update Bar Value
        displayValue = currentSecondsTotal / 60;
        
        // D. Calculate Time Remaining
        const secondsLeft = Math.max(0, totalSecondsNeeded - currentSecondsTotal);
        
        // E. DISPLAY LOGIC: MM:SS Countdown
        const m = Math.floor(secondsLeft / 60);
        const s = Math.floor(secondsLeft % 60);
        
        if (secondsLeft === 0) {
            remainingText = 'Completing...';
        } else {
            // "8m 59s left"
            remainingText = `${m}m ${s.toString().padStart(2, '0')}s left`;
        }

    } else {
        // Non-time quests
        const left = activeQuest.target - baseValue;
        remainingText = `${left} ${activeQuest.unit} left`;
    }

    const percent = Math.min(100, Math.max(0, (displayValue / activeQuest.target) * 100));
    
    return (
        <div className="absolute bottom-4 left-4 right-4 z-30 animate-fade-in-up">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2.5 flex items-center gap-3 shadow-lg">
                <div className="bg-white/10 p-1.5 rounded-lg shrink-0">
                    <Flame size={14} className="text-orange-400 animate-pulse" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider">
                            Next Rank: <span className="text-passport-teal">{activeQuest.title}</span>
                        </span>
                        <span className="text-[9px] text-white/50 font-mono tabular-nums">
                            {remainingText}
                        </span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-orange-400 to-passport-teal transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(251,146,60,0.5)]"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestWidget;