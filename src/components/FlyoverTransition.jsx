import React, { useEffect, useState } from 'react';
import { Plane, Cloud } from 'lucide-react';

const FlyoverTransition = ({ targetCity }) => {
    const [status, setStatus] = useState('Departing...');

    useEffect(() => {
        // Change text halfway through
        const timer = setTimeout(() => {
            setStatus(`Arriving in ${targetCity.name}...`);
        }, 1200);
        return () => clearTimeout(timer);
    }, [targetCity]);

    return (
        <div className="fixed inset-0 z-[100] bg-sky-400 flex flex-col items-center justify-center overflow-hidden animate-fade-in">
            
            {/* ☁️ MOVING CLOUDS BACKGROUND */}
            <div className="absolute inset-0 opacity-40">
                <Cloud size={120} className="absolute top-20 left-[-10%] text-white animate-cloud-slow" />
                <Cloud size={80} className="absolute bottom-40 left-[-20%] text-white animate-cloud-medium" style={{ animationDelay: '0.5s' }} />
                <Cloud size={160} className="absolute top-1/2 left-[-30%] text-white animate-cloud-fast" style={{ animationDelay: '1s' }} />
            </div>

            {/* ✈️ THE PLANE */}
            <div className="relative z-10 flex flex-col items-center animate-plane-fly">
                <div className="relative">
                    {/* Shadow */}
                    <Plane size={120} className="text-black/20 absolute top-10 left-4 blur-sm transform rotate-45" />
                    {/* Plane Body */}
                    <Plane size={120} className="text-white drop-shadow-2xl transform rotate-45" />
                </div>
            </div>

            {/* 🛬 STATUS TEXT */}
            <div className="absolute bottom-20 z-20">
                <h2 className="text-3xl font-black text-white uppercase tracking-widest drop-shadow-md animate-pulse">
                    {status}
                </h2>
                <p className="text-white/80 text-center font-mono mt-2 uppercase text-sm">
                    {targetCity.country}
                </p>
            </div>

            {/* CSS FOR ANIMATIONS */}
            {/* Fixed: Removed 'jsx' attribute */}
            <style>{`
                @keyframes cloud-move {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(120vw); }
                }
                @keyframes plane-enter {
                    0% { transform: scale(0.5) translateX(-100vw) rotate(-10deg); opacity: 0; }
                    20% { transform: scale(1) translateX(0) rotate(0deg); opacity: 1; }
                    80% { transform: scale(1) translateX(0) rotate(0deg); opacity: 1; }
                    100% { transform: scale(1.5) translateX(100vw) rotate(10deg); opacity: 0; }
                }
                .animate-cloud-slow { animation: cloud-move 4s linear infinite; }
                .animate-cloud-medium { animation: cloud-move 3s linear infinite; }
                .animate-cloud-fast { animation: cloud-move 2s linear infinite; }
                .animate-plane-fly { animation: plane-enter 2.5s ease-in-out forwards; }
            `}</style>
        </div>
    );
};

export default FlyoverTransition;