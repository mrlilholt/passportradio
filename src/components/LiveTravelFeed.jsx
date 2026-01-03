import React, { useState, useEffect, useRef } from 'react';
import { Radio, Plane, Heart, Music, Globe } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const LiveTravelFeed = ({ cities }) => {
    const [msg, setMsg] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const timerRef = useRef(null);
    const botTimerRef = useRef(null);

    // --- 1. HELPERS: ICON & TEXT LOGIC ---
    // This ensures both Bots and Real users get the exact same visual treatment
    const getActionData = (action, stationName) => {
        switch (action) {
            case 'listening':
                return { 
                    icon: <Radio size={14} className="text-passport-teal animate-pulse" />, 
                    text: 'tuned into',
                    highlight: stationName || 'Local Radio'
                };
            case 'favorited':
                return { 
                    icon: <Heart size={14} className="text-red-500 animate-bounce" />, 
                    text: 'loved a station in',
                    highlight: null
                };
            case 'landed':
                return { 
                    icon: <Plane size={14} className="text-yellow-400" />, 
                    text: 'just landed in',
                    highlight: null
                };
            default:
                return { 
                    icon: <Globe size={14} className="text-blue-400" />, 
                    text: 'is exploring',
                    highlight: null
                };
        }
    };

    // --- 2. SHOW MESSAGE FUNCTION ---
    const showNewMessage = (user, action, location, stationName = null, isReal = false) => {
        // If a Real event happens, it overrides any Bot event immediately
        if (timerRef.current) clearTimeout(timerRef.current);

        const { icon, text, highlight } = getActionData(action, stationName);

        // Hide old message first for a clean transition
        setIsVisible(false);

        setTimeout(() => {
            setMsg({
                user: user,
                actionText: text,
                location: location,
                highlight: highlight,
                icon: icon,
                isReal: isReal // We can use this for debugging, but visuals stay identical
            });
            setIsVisible(true);

            // Auto-hide after 7 seconds
            timerRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 7000);
        }, 400);
    };

    // --- 3. THE "REAL" LISTENER (Firebase) ---
    useEffect(() => {
        const q = query(collection(db, 'global_activity'), orderBy('timestamp', 'desc'), limit(1));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                // Prevent showing old events on page load (check if event is recent < 10s)
                const now = Date.now();
                const eventTime = data.timestamp?.toMillis ? data.timestamp.toMillis() : now;
                
                if (now - eventTime < 15000) { 
                    showNewMessage(
                        data.user || 'Traveler', 
                        data.action, 
                        data.location || data.country, 
                        data.stationName, 
                        true // isReal = true
                    );
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // --- 4. THE "BOT" GENERATOR (Organic & Random) ---
    useEffect(() => {
        const botNames = ["Explorer", "Nomad", "Traveler", "Wanderer", "Backpacker", "Drifter", "Voyager"];
        const botActions = ['listening', 'listening', 'listening', 'landed', 'favorited']; // weighted towards listening
        
        const triggerBot = () => {
            // 1. Randomize Identity
            const isGuest = Math.random() > 0.5;
            const randomNum = Math.floor(Math.random() * 8999) + 1000;
            const randomName = isGuest 
                ? `Traveler #${randomNum}` 
                : `${botNames[Math.floor(Math.random() * botNames.length)]} ${Math.floor(Math.random() * 100)}`;

            // 2. Randomize Location & Station
            if (!cities || cities.length === 0) return;
            const city = cities[Math.floor(Math.random() * cities.length)];
            const action = botActions[Math.floor(Math.random() * botActions.length)];
            
            // Fake station names for realism
            const stationPrefixes = ["Radio", "FM", "Voice of", "Beat", "Jazz", "Classic", "Gold"];
            const fakeStation = `${stationPrefixes[Math.floor(Math.random() * stationPrefixes.length)]} ${city.name}`;

            // 3. Show it (render logic is exactly the same as Real)
            showNewMessage(randomName, action, city.name, fakeStation, false);

            // 4. Schedule next bot (Randomly between 45s and 120s)
            scheduleNextBot();
        };

        const scheduleNextBot = () => {
            if (botTimerRef.current) clearTimeout(botTimerRef.current);
            // Random delay between 45,000ms (45s) and 120,000ms (2 mins)
            const randomDelay = Math.floor(Math.random() * (120000 - 45000 + 1)) + 45000;
            botTimerRef.current = setTimeout(triggerBot, randomDelay);
        };

        // Start the loop (Initial delay shorter: 10s so the screen isn't dead on load)
        const initialTimer = setTimeout(triggerBot, 10000);

        return () => {
            if (botTimerRef.current) clearTimeout(botTimerRef.current);
            clearTimeout(initialTimer);
        };
    }, [cities]);


    // --- 5. RENDER ---
    return (
        <div 
            className={`fixed bottom-[90px] left-1/2 -translate-x-1/2 z-40 transition-all duration-500 transform ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
            {msg && (
                <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 whitespace-nowrap max-w-[90vw] overflow-hidden">
                    
                    {/* Icon Bubble */}
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        {msg.icon}
                    </div>

                    {/* Text Content */}
                    <div className="text-xs md:text-sm text-white/90 flex items-center gap-1">
                        <span className="font-bold text-passport-teal">{msg.user}</span>
                        <span className="opacity-70">{msg.actionText}</span>
                        {msg.highlight && (
                            <span className="font-medium text-white italic">"{msg.highlight}"</span>
                        )}
                        <span className="opacity-70">in</span>
                        <span className="font-bold text-white">{msg.location}</span>
                    </div>

                </div>
            )}
        </div>
    );
};

export default LiveTravelFeed;