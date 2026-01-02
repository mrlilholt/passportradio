import React from 'react';
import { Globe } from 'lucide-react';

const TeleportOverlay = () => (
    <div className="fixed inset-0 z-[100] bg-passport-dark flex flex-col items-center justify-center text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
        <Globe size={80} className="text-passport-teal animate-bounce mb-8 relative z-10" />
        <h2 className="text-3xl font-bold mb-2 relative z-10">Traveling...</h2>
        <p className="text-passport-teal font-mono uppercase tracking-widest text-sm relative z-10">Calibrating Frequency</p>
        <div className="w-64 h-1 bg-white/10 rounded-full mt-8 overflow-hidden relative z-10">
            <div className="h-full bg-passport-teal animate-[width_2.5s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
        </div>
    </div>
);

export default TeleportOverlay;