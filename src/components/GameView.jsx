import React from 'react';
import { Trophy, Globe, Loader, Radio, Flame, Check, X, Shield, Play, Lock } from 'lucide-react';
import { BADGES } from '../data/badges';
// 1. Import Hook
import { useProgression } from '../hooks/useProgression';

const GameView = ({ 
    gameScore, 
    gameRoundData, 
    isGameLoading, 
    startNewGameRound, 
    handleGameGuess, 
    handleGameSkip,
    questsEnabled,
    toggleQuests,
    onExitGame,
    // Note: We REMOVED totalXP, playerLevel, etc. from props
}) => {

    // 2. Fetch data internally
    const { xp, level, nextLevelXP, earnedBadges, updateProgress } = useProgression();

    const renderBadges = () => {
        return BADGES.map((badge) => {
            const isUnlocked = earnedBadges.includes(badge.id);
            const Icon = badge.icon;
            return (
                <div key={badge.id} className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 relative overflow-hidden group ${isUnlocked ? 'bg-white/10 border-white/10 text-passport-teal' : 'bg-black/20 border-white/5 text-white/10'}`}>
                    <Icon size={18} className={isUnlocked ? "" : "opacity-20"} />
                    <span className="text-[9px] font-bold uppercase truncate w-full text-center px-1">{badge.label}</span>
                    {!isUnlocked && (
                        <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Lock size={12} className="mb-1 text-white/40" />
                            <span className="text-[8px] text-center leading-tight text-white/60">{badge.description}</span>
                        </div>
                    )}
                </div>
            );
        });
    };

    // --- MODIFIED TRIVIA ANSWER HANDLER ---
    const onGuess = (country) => {
        handleGameGuess(country);
        // If the guess logic in App.jsx sets the round as correct, 
        // we need to know. Since we can't see the result immediately 
        // inside this function (async state), we rely on `gameRoundData.userCorrect`
        // in the render phase, OR we just trust the user click for now.
        // A better way without touching App.jsx:
        if (gameRoundData && country === gameRoundData.correctAnswer) {
             updateProgress('TRIVIA_WIN');
        }
    };

    if (!gameRoundData && !isGameLoading) {
        const progressPercent = Math.min(100, (xp / nextLevelXP) * 100);

        return (
            <div className="p-6 flex flex-col items-center h-full animate-fade-in pb-24 overflow-y-auto w-full max-w-md mx-auto">
                {/* HERO STATS CARD */}
                <div className="w-full bg-gradient-to-br from-passport-teal/20 to-blue-600/20 border border-white/10 rounded-3xl p-6 mb-4 relative overflow-hidden shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-passport-teal mb-1">Passport Level</p>
                            <h2 className="text-4xl font-black text-white">{level}</h2>
                        </div>
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/5">
                            <Shield size={24} className="text-yellow-400" />
                        </div>
                    </div>
                    <div className="w-full">
                        <div className="flex justify-between text-xs text-white/50 mb-1.5 font-medium">
                            <span>{xp} XP</span>
                            <span>Target: {nextLevelXP} XP</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-passport-teal to-blue-400 shadow-[0_0_10px_rgba(20,184,166,0.5)] transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                </div>

                {/* TOGGLE & TRIVIA CARDS (Kept same) */}
                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 shrink-0">
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-white font-bold">
                            <Flame size={18} className={questsEnabled ? "text-orange-400 animate-pulse" : "text-white/30"} />
                            <span>Passive Quests</span>
                        </div>
                        <button onClick={toggleQuests} className={`w-12 h-6 rounded-full transition-colors relative ${questsEnabled ? 'bg-passport-teal' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${questsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">Earn XP automatically while you listen.</p>
                </div>

                <div className="w-full bg-gradient-to-b from-white/10 to-white/5 border border-white/10 p-5 rounded-3xl relative overflow-hidden group mb-6 shrink-0">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-passport-teal text-slate-900 rounded-lg shadow-lg shadow-passport-teal/20"><Globe size={20} /></div>
                            <h3 className="text-lg font-bold text-white">Travel Trivia</h3>
                        </div>
                        <p className="text-sm text-white/60 mb-5 leading-relaxed">Guess the location. <strong className="text-passport-teal">Win +50 XP per round.</strong></p>
                        <button onClick={startNewGameRound} className="w-full bg-white text-passport-dark font-bold py-3.5 rounded-xl hover:scale-[1.02] transition shadow-lg active:scale-95 flex items-center justify-center gap-2">
                            <Play size={18} fill="currentColor" /><span>Start Challenge</span>
                        </button>
                    </div>
                </div>

                <div className="w-full">
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3">My Badges</h3>
                    <div className="grid grid-cols-4 gap-2">{renderBadges()}</div>
                </div>
            </div>
        );
    }

    if (isGameLoading) {
        return (<div className="flex flex-col items-center justify-center h-full animate-pulse"><Loader className="animate-spin mb-4 text-passport-teal" size={48} /><p className="text-sm font-bold uppercase tracking-widest">Tuning in...</p></div>);
    }

    return (
        <div className="p-6 flex flex-col items-center h-full animate-fade-in pb-24 overflow-y-auto w-full max-w-md mx-auto">
             <div className="w-full flex justify-between items-center mb-6 shrink-0">
                <button onClick={onExitGame} className="p-2 -ml-2 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition"><X size={24} /></button>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/5">
                    <Trophy size={14} className="text-yellow-400" />
                    <span className="font-bold text-sm">{gameScore}</span>
                </div>
            </div>
            
            {gameRoundData && (
                <div className="w-full flex-1 flex flex-col justify-center animate-slide-up">
                    <div className="relative w-40 h-40 mx-auto bg-black/50 rounded-full border-4 border-white/10 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                        {gameRoundData.hasGuessed ? (
                            <img src={gameRoundData.station.favicon} onError={(e) => e.target.style.display = 'none'} className="w-full h-full object-cover rounded-full opacity-100 animate-fade-in" alt="station" />
                        ) : (<div className="animate-pulse"><Radio size={56} className="text-white/20" /></div>)}
                        {gameRoundData.hasGuessed && (
                            <div className={`absolute -bottom-2 right-0 w-10 h-10 flex items-center justify-center rounded-full border-4 border-slate-900 shadow-lg ${gameRoundData.userCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                {gameRoundData.userCorrect ? <Check size={20} className="text-white" strokeWidth={4} /> : <X size={20} className="text-white" strokeWidth={4} />}
                            </div>
                        )}
                    </div>
                    <h3 className="text-center text-xl font-bold mb-6 leading-tight min-h-[3rem] flex items-center justify-center">
                        {gameRoundData.hasGuessed 
                            ? (gameRoundData.userCorrect ? <span className="text-green-400">Correct! +50 XP</span> : <span className="text-white/60">It was <span className="text-white font-bold underline decoration-passport-teal">{gameRoundData.correctAnswer}</span></span>) 
                            : "Where is this station broadcasting from?"}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 mb-4">
                        {gameRoundData.options.map((country, idx) => {
                            let btnClass = "bg-white/5 hover:bg-white/10 border-white/10 py-4";
                            let textClass = "text-white";
                            if (gameRoundData.hasGuessed) {
                                if (country === gameRoundData.correctAnswer) {
                                    btnClass = "bg-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]"; textClass = "text-white font-black";
                                } else if (country !== gameRoundData.correctAnswer && !gameRoundData.userCorrect) {
                                    btnClass = "opacity-30 bg-red-500/10 border-transparent";
                                } else { btnClass = "opacity-30 bg-white/5 border-transparent"; }
                            }
                            // 👇 UPDATED: Use onGuess instead of handleGameGuess
                            return (<button key={idx} disabled={gameRoundData.hasGuessed} onClick={() => onGuess(country)} className={`w-full rounded-xl border text-center font-bold text-base transition-all active:scale-[0.98] ${btnClass} ${textClass}`}>{country}</button>);
                        })}
                    </div>
                    <div className="h-14 mt-2">
                        {!gameRoundData.hasGuessed ? (
                            <button onClick={handleGameSkip} className="w-full text-white/30 hover:text-white text-xs font-bold uppercase tracking-widest transition py-3">Skip Station</button>
                        ) : (
                            <button onClick={startNewGameRound} className="w-full bg-white text-passport-dark font-bold py-4 rounded-xl hover:scale-[1.02] transition shadow-lg active:scale-95 flex items-center justify-center gap-2"><span>Next Round</span><Trophy size={16} /></button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameView;