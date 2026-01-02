import React, { useState } from 'react'; // <--- Fixed: Added useState here
import { Book, X, Stamp, Share2 } from 'lucide-react'; // <--- Fixed: Added Share2 here
import PassportStamp from './PassportStamp';
import { cities } from '../data/cities';
import { playTeleportSound, playErrorSound } from '../utils/audio';
import PassportShareModal from './PassportShareModal'; 

const PassportBook = ({ onClose, travelLogs, onTravel }) => {
    // 1. Sort logs by time
    const stats = Object.entries(travelLogs).sort(([, a], [, b]) => {
        const timeA = typeof a === 'number' ? a : a.time;
        const timeB = typeof b === 'number' ? b : b.time;
        return timeB - timeA;
    });
    
    const [showShareModal, setShowShareModal] = useState(false);

    // 2. Handle the "Teleport" with Sound 🔊
    const handleStampClick = (countryIso, countryName) => {
        const targetCity = cities.find(c => c.iso.toLowerCase() === countryIso.toLowerCase()) 
                        || cities.find(c => c.country.toLowerCase() === countryName.toLowerCase());
        
        if (targetCity) {
            // 🔊 Play Sci-Fi Whoosh
            playTeleportSound();

            setTimeout(() => {
                onTravel(targetCity); 
            }, 200);
        } else {
            // 🔊 Play Error Buzz
            playErrorSound();
            console.warn("No city found for", countryName);
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 shadow-md z-10">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Book className="text-passport-teal" /> My Stamp Book
                </h2>
                
                <div className="flex gap-2">
                    {/* Share Button */}
                    <button 
                        onClick={() => setShowShareModal(true)}
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition text-white"
                        title="Share Passport"
                    >
                        <Share2 size={20} />
                    </button>

                    {/* Close Button */}
                    <button 
                        onClick={onClose} 
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 hover:rotate-90 transition duration-300 text-white"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Stamp Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                {stats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50 text-center text-white mt-10">
                        <div className="bg-white/5 p-6 rounded-full mb-4">
                            <Stamp size={64} className="text-white/20" />
                        </div>
                        <h3 className="text-lg font-bold">Passport Empty</h3>
                        <p className="text-sm max-w-xs mx-auto mt-2 text-white/60">
                            Tune into radio stations to earn your stamps. The longer you listen, the higher your rank!
                        </p>
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
                )}
            </div>
            
            {/* Footer Text */}
            <div className="p-4 text-center text-[10px] uppercase tracking-widest text-white/30 border-t border-white/5 bg-black/20">
                Passport Radio • Official Document
            </div>

            {/* 👇 RENDER MODAL */}
            {showShareModal && (
                <PassportShareModal 
                    travelLogs={travelLogs} 
                    onClose={() => setShowShareModal(false)} 
                />
            )}
        </div>
    );
};

export default PassportBook;