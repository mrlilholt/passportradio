import React from 'react';
import { X, Globe, Radio, Stamp, Infinity, Heart, Plane } from 'lucide-react';

const MissionBriefing = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* --- HEADER --- */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="bg-passport-teal/20 p-2 rounded-lg">
                            <Plane size={20} className="text-passport-teal" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-wider text-white">Mission Briefing</h2>
                            <p className="text-[10px] text-white/50 uppercase tracking-widest">Protocol & Objectives</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-white/60" />
                    </button>
                </div>

                {/* --- SCROLLABLE CONTENT --- */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                    
                    {/* 1. THE PURPOSE (The Soul) */}
                    <section className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-passport-teal to-transparent rounded-full" />
                        <div className="pl-6">
                            <div className="flex items-center gap-2 mb-2 text-passport-teal">
                                <Heart size={18} />
                                <h3 className="text-sm font-bold uppercase tracking-widest">The Purpose</h3>
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-3">Reconnect with the World.</h4>
                            <p className="text-sm text-white/70 leading-relaxed mb-4">
                                Passport Radio is a portal to the places you've been and the places you dream of.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h5 className="text-white font-bold text-xs uppercase mb-2 flex items-center gap-2">
                                        <Plane size={14} className="text-white/40" /> The Traveler
                                    </h5>
                                    <p className="text-xs text-white/50">
                                        Revisit the chaotic energy of that taxi ride in Bangkok or the rainy cafe in Paris. Music triggers memory like nothing else.
                                    </p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h5 className="text-white font-bold text-xs uppercase mb-2 flex items-center gap-2">
                                        <Globe size={14} className="text-white/40" /> The Expat
                                    </h5>
                                    <p className="text-xs text-white/50">
                                        When you are far from home, tuning into your local station bridges the distance instantly. Hear the voices of the homeland.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. THE GAME LOOP */}
                    <section className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-transparent rounded-full" />
                        <div className="pl-6">
                            <div className="flex items-center gap-2 mb-2 text-amber-400">
                                <Radio size={18} />
                                <h3 className="text-sm font-bold uppercase tracking-widest">The Frequency</h3>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Listen to Level Up.</h4>
                            <p className="text-sm text-white/70 leading-relaxed mb-4">
                                Every minute you tune in earns you <strong className="text-white">XP</strong>. As you listen, you will rise through the ranks from <span className="text-amber-400">Signal Rookie</span> to <span className="text-amber-400">Airwave Legend</span>.
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {/* Mini flow chart */}
                                <div className="shrink-0 bg-black/40 border border-white/10 px-3 py-2 rounded-lg text-center">
                                    <span className="block text-xs font-bold text-white">Tune In</span>
                                    <span className="text-[9px] text-white/40">Any Station</span>
                                </div>
                                <div className="text-white/20 pt-2">→</div>
                                <div className="shrink-0 bg-black/40 border border-white/10 px-3 py-2 rounded-lg text-center">
                                    <span className="block text-xs font-bold text-white">Earn XP</span>
                                    <span className="text-[9px] text-white/40">+1 per min</span>
                                </div>
                                <div className="text-white/20 pt-2">→</div>
                                <div className="shrink-0 bg-black/40 border border-white/10 px-3 py-2 rounded-lg text-center">
                                    <span className="block text-xs font-bold text-amber-400">Rank Up</span>
                                    <span className="text-[9px] text-white/40">Unlock Badges</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. THE COLLECTION */}
                    <section className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-transparent rounded-full" />
                        <div className="pl-6">
                            <div className="flex items-center gap-2 mb-2 text-purple-400">
                                <Stamp size={18} />
                                <h3 className="text-sm font-bold uppercase tracking-widest">The Passport</h3>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Fill Your Pages.</h4>
                            <p className="text-sm text-white/70 leading-relaxed">
                                Your Passport Book records your journey automatically. 
                            </p>
                            <ul className="mt-3 space-y-2">
                                <li className="flex items-start gap-2 text-xs text-white/60">
                                    <span className="bg-purple-500/20 text-purple-300 px-1.5 rounded font-mono font-bold">VISAS</span>
                                    Collect a stamp for every new country you visit.
                                </li>
                                <li className="flex items-start gap-2 text-xs text-white/60">
                                    <span className="bg-amber-500/20 text-amber-300 px-1.5 rounded font-mono font-bold">BADGES</span>
                                    Unlock achievements for night listening, long sessions, and more.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* 4. THE ENDGAME */}
                    <section className="bg-gradient-to-r from-indigo-900/40 to-black border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                            <Infinity size={64} className="text-indigo-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 text-indigo-300">
                                <Infinity size={18} />
                                <h3 className="text-sm font-bold uppercase tracking-widest">Ascension</h3>
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">The Paragon System</h4>
                            <p className="text-xs text-indigo-200/70 leading-relaxed max-w-sm">
                                For those who reach <span className="text-white font-bold">1,000 Hours</span> ("The Constant"), the game does not end. You enter the <strong>Paragon Tier</strong>—an infinite progression system where you continue to level up forever.
                            </p>
                        </div>
                    </section>

                </div>

                {/* --- FOOTER --- */}
                <div className="p-4 border-t border-white/10 bg-black/40 text-center">
                    <button 
                        onClick={onClose}
                        className="w-full bg-white text-black font-bold uppercase tracking-widest text-xs py-3 rounded-xl hover:bg-passport-teal hover:scale-[1.01] transition-all"
                    >
                        Acknowledged
                    </button>
                </div>

            </div>
        </div>
    );
};

export default MissionBriefing;