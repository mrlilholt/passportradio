import React, { useState, useEffect } from 'react';
import { Infinity, Star, Sparkles } from 'lucide-react';

const ParagonWidget = ({ stats = {}, isPlaying, onComplete }) => {
    
    // ⚙️ CONSTANTS
    const TITAN_CAP = 60000;  // The threshold where Paragon begins (1,000 hours)
    const LEVEL_DURATION = 1440; // Minutes per Paragon Level (24 Hours)

    // 1. Calculate State
    const totalMinutes = stats.totalMinutes || 0;
    
    // How many minutes have we accumulated BEYOND the cap?
    const paragonMinutes = Math.max(0, totalMinutes - TITAN_CAP);
    
    // Current Level (1, 2, 3...)
    const currentLevel = Math.floor(paragonMinutes / LEVEL_DURATION) + 1;
    
    // Progress into the current level (0 to 1440)
    const progressInLevel = paragonMinutes % LEVEL_DURATION;

    // 2. INTERNAL STOPWATCH (Visual smoothing)
    const [localSeconds, setLocalSeconds] = useState(0);

    // Reset stopwatch when DB updates
    useEffect(() => {
        setLocalSeconds(0);
    }, [totalMinutes]);

    // Tick
    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => setLocalSeconds(p => p + 1), 1000);
        return () => clearInterval(interval);
    }, [isPlaying]);

    // 3. CHECK COMPLETION
    useEffect(() => {
        // Calculate total progress including local seconds
        const currentProgress = progressInLevel + (localSeconds / 60);
        
        // Did we cross the 24-hour mark for this level?
        if (currentProgress >= LEVEL_DURATION) {
            
            // Construct the ID for the NEXT level (currentLevel is about to finish)
            const completedId = `paragon_level_${currentLevel}`;
            
            // Check Lock
            const lockKey = `paragon_lock_${completedId}`;
            if (localStorage.getItem(lockKey) === 'true') return;

            // Lock & Fire
            localStorage.setItem(lockKey, 'true');
            if (onComplete) onComplete(completedId);
        }
    }, [progressInLevel, localSeconds, currentLevel, onComplete]);

    // 4. DISPLAY MATH
    const displayMinutes = progressInLevel + (localSeconds / 60);
    const percent = Math.min(100, (displayMinutes / LEVEL_DURATION) * 100);
    
    // Time Remaining
    const minutesLeft = Math.max(0, LEVEL_DURATION - displayMinutes);
    const h = Math.floor(minutesLeft / 60);
    const m = Math.floor(minutesLeft % 60);

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30 animate-fade-in-up">
            {/* 🌌 THE COSMIC CONTAINER */}
            <div className="relative bg-indigo-950/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 shadow-[0_0_40px_rgba(99,102,241,0.25)] overflow-hidden group">
                
                {/* Background Animation (Subtle Glow) */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse-slow pointer-events-none" />
                
                <div className="flex items-center gap-4 relative z-10">
                    
                    {/* ICON: Rotating Infinity */}
                    <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-400/20 shadow-inner">
                        <Infinity size={20} className="text-indigo-300 animate-pulse" />
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-indigo-300 uppercase tracking-[0.15em]">
                                    Paragon Tier
                                </span>
                                <span className="text-lg font-black text-white leading-none">
                                    {currentLevel}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-indigo-200/60 tabular-nums">
                                {h}h {m}m until ascension
                            </span>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400 shadow-[0_0_15px_rgba(168,85,247,0.6)] relative"
                                style={{ width: `${percent}%`, transition: 'width 1s linear' }}
                            >
                                {/* Shimmer Effect on Bar */}
                                <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-shimmer" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* DECORATIVE: Floating Stars */}
                <div className="absolute top-2 right-2 opacity-50">
                    <Sparkles size={12} className="text-indigo-200 animate-spin-slow" />
                </div>
            </div>
        </div>
    );
};

export default ParagonWidget;