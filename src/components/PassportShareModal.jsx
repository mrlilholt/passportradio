import React, { useRef, useState } from 'react';
import { X, Download, Share2, Globe, Radio, Upload } from 'lucide-react';
import html2canvas from 'html2canvas';

const PassportShareModal = ({ onClose, travelLogs }) => {
    const cardRef = useRef();
    const [isGenerating, setIsGenerating] = useState(false);

    // Stats Calculations
    const stats = Object.entries(travelLogs).map(([country, data]) => ({
        country,
        time: (typeof data === 'number' ? data : data.time),
        iso: (data.iso || 'xx')
    }));
    const totalSeconds = stats.reduce((acc, curr) => acc + curr.time, 0);
    const countryCount = stats.length;
    const topDest = stats.sort((a, b) => b.time - a.time)[0] || { country: 'Nowhere yet', iso: 'xx' };
    
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const timeString = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    let rank = "Tourist";
    let rankColor = "text-white";
    if (totalSeconds > 3600) { rank = "Resident"; rankColor = "text-passport-teal"; }
    if (totalSeconds > 18000) { rank = "Ambassador"; rankColor = "text-amber-400"; }

    // 🌟 SMART SHARE HANDLER
    const handleSmartShare = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        
        try {
            // 1. Generate Canvas
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#0f172a', 
                scale: 2, 
                useCORS: true 
            });

            // 2. Convert to Blob (File Object)
            canvas.toBlob(async (blob) => {
                const file = new File([blob], `passport-${Date.now()}.png`, { type: 'image/png' });

                // 3. Check if Browser Supports File Sharing (Mobile usually)
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: 'My Passport Radio Stats',
                            text: `I just hit ${rank} rank on Passport Radio! 🌍✈️ Visited ${countryCount} countries. Check it out:`,
                            url: 'https://passportradio.netlify.app',
                            files: [file] // <--- Attaches the image directly!
                        });
                    } catch (shareError) {
                        console.log('Share dismissed', shareError);
                    }
                } else {
                    // 4. Fallback for Desktop (Download Image)
                    const link = document.createElement('a');
                    link.download = `PassportRadio-${rank}-${Date.now()}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    alert("Image downloaded! You can now manually post it to social media.");
                }
                setIsGenerating(false);
            }, 'image/png');

        } catch (err) {
            console.error("Failed to generate image", err);
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative">
                
                {/* Header */}
                <div className="p-4 flex justify-between items-center border-b border-white/10 bg-black/20">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Share2 size={18} className="text-passport-teal" /> Share Passport
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                {/* The Card (Hidden/Visible logic handled by capture) */}
                <div className="p-8 flex justify-center bg-slate-900">
                    <div 
                        ref={cardRef}
                        className="w-[320px] bg-gradient-to-br from-slate-800 to-black border border-white/20 rounded-xl p-6 relative overflow-hidden shadow-2xl"
                    >
                        {/* ... (SAME CARD DESIGN AS BEFORE) ... */}
                        <Globe className="absolute -right-10 -bottom-10 text-white/5 rotate-12" size={200} />
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-passport-teal via-purple-500 to-amber-500"></div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-passport-teal rounded-lg flex items-center justify-center text-slate-900 shadow-lg shadow-teal-500/20">
                                <Radio size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white leading-none uppercase tracking-wide">Passport Radio</h2>
                                <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest">Official Travel Record</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                                <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Total Flight Time</div>
                                <div className="text-xl font-mono text-white">{timeString}</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                                <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Countries Visited</div>
                                <div className="text-xl font-mono text-white">{countryCount}</div>
                            </div>
                        </div>

                        <div className="mb-6 text-center py-4 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"></div>
                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Current Rank</div>
                            <div className={`text-2xl font-black uppercase tracking-widest drop-shadow-lg ${rankColor}`}>
                                {rank}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-black/30 p-3 rounded-lg border border-white/5">
                            <div className="text-2xl">🏆</div>
                            <div>
                                <div className="text-[10px] text-white/40 uppercase font-bold">Top Destination</div>
                                <div className="text-sm font-bold text-white">{topDest.country}</div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 text-center">
                            <p className="text-[10px] text-white/30 font-mono">passportradio.netlify.app</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-black/20 flex flex-col gap-3">
                    <button 
                        onClick={handleSmartShare}
                        disabled={isGenerating}
                        className="w-full bg-passport-teal hover:bg-teal-400 text-slate-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <span className="animate-pulse">Generating...</span>
                        ) : (
                            <>
                                <Upload size={18} /> Share / Download
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-white/30">
                        {navigator.canShare ? "Tap to share with Instagram, Twitter, etc." : "Image will download to your device."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PassportShareModal;