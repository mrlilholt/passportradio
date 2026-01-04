import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { BADGES } from '../data/badges';

// -------------------------------------------
// 📈 SCALING LOGIC
// -------------------------------------------
const XP_PER_LEVEL = 1000;
export const getLevelFromXP = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const getNextLevelTarget = (level) => level * XP_PER_LEVEL;

export const useProgression = () => {
    const { user } = useAuth();
    
    // Local State
    const [stats, setStats] = useState(null); // Start as null to track "Loading" state
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [recentUnlock, setRecentUnlock] = useState(null);
    
    // Throttle ref - tracks last Firebase write time
    const lastWriteTime = useRef(0);
    const pendingUpdates = useRef({});

    // 1. LOAD PROFILE
    useEffect(() => {
        if (!user) return;
        const loadProfile = async () => {
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setStats(data.stats || {});
                    setEarnedBadges(data.badges || []);
                    setXp(data.xp || 0);
                    // Auto-correct level
                    const currentXP = data.xp || 0;
                    setLevel(getLevelFromXP(currentXP));
                } else {
                    // Initialize new user
                    const initialStats = { totalMinutes: 0, uniqueCountries: [], uniqueStations: [], triviaWins: 0 };
                    await setDoc(docRef, {
                        xp: 0, level: 1, badges: [],
                        stats: initialStats
                    });
                    setStats(initialStats);
                }
            } catch (err) { console.error(err); }
        };
        loadProfile();
    }, [user]);

    // 2. THE UPDATE ENGINE (with throttling)
    const updateProgress = async (actionType, payload = {}) => {
        // 🛑 SAFETY GUARD: Don't run logic if user or stats aren't loaded yet
        if (!user || !stats) return; 

        const userRef = doc(db, 'users', user.uid);
        const now = Date.now();
        const ONE_MINUTE = 60000;
        
        let updates = {};
        let newStats = { ...stats };
        let xpGain = 0;

        // --- A. Handle Specific Actions ---
        if (actionType === 'VISIT_STATION') {
            const { stationId, country } = payload;
            const currentStations = newStats.uniqueStations || [];
            if (!currentStations.includes(stationId)) {
                updates['stats.uniqueStations'] = arrayUnion(stationId);
                newStats.uniqueStations = [...currentStations, stationId];
                xpGain += 10; 
            }
            const currentCountries = newStats.uniqueCountries || [];
            if (!currentCountries.includes(country)) {
                updates['stats.uniqueCountries'] = arrayUnion(country);
                newStats.uniqueCountries = [...currentCountries, country];
                xpGain += 50; 
            }
        } 
        else if (actionType === 'ADD_LISTENING_TIME') {
            updates['stats.totalMinutes'] = increment(1);
            newStats.totalMinutes = (newStats.totalMinutes || 0) + 1;
            xpGain += 5; 
        }
        else if (actionType === 'ADD_XP') {
            xpGain += payload.amount || 0;
        }
        else if (actionType === 'TRIVIA_WIN') {
            updates['stats.triviaWins'] = increment(1);
            newStats.triviaWins = (newStats.triviaWins || 0) + 1;
            xpGain += 50;
        }

        // --- B. Check Badges (FIXED WITH SESSION STORAGE) ---
        const context = {
            isNight: new Date().getHours() >= 1 && new Date().getHours() <= 4,
            isMorning: new Date().getHours() >= 5 && new Date().getHours() <= 8
        };

        BADGES.forEach(badge => {
            // 1. Check Database (History)
            const hasInDb = earnedBadges.includes(badge.id);
            
            // 2. Check Browser Session (Immediate Memory)
            // This key persists even if the component unmounts
            const sessionKey = `badge_unlocked_${user.uid}_${badge.id}`;
            const hasInSession = sessionStorage.getItem(sessionKey);

            if (!hasInDb && !hasInSession && badge.condition(newStats, context)) {
                
                // ✅ LOCK IT IMMEDIATELY
                sessionStorage.setItem(sessionKey, 'true');

                // Queue Database Updates
                updates['badges'] = arrayUnion(badge.id);
                xpGain += badge.xpReward;
                
                // Update UI
                setEarnedBadges(prev => [...prev, badge.id]);
                setRecentUnlock(badge);
            }
        });

        // --- C. Level Up Logic ---
        const newTotalXP = xp + xpGain;
        const newLevel = getLevelFromXP(newTotalXP);
        if (newLevel > level) {
            updates['level'] = newLevel;
            setLevel(newLevel);
        }

        // --- D. Commit (with throttling) ---
        if (xpGain > 0) updates['xp'] = increment(xpGain);
        
        if (Object.keys(updates).length > 0) {
            // Always update local state immediately
            setXp(newTotalXP);
            setStats(newStats);
            
            // Accumulate updates for batching
            pendingUpdates.current = { ...pendingUpdates.current, ...updates };
            
            // Only write to Firebase once per minute
            const timeSinceLastWrite = now - lastWriteTime.current;
            if (timeSinceLastWrite >= ONE_MINUTE || Object.keys(pendingUpdates.current).length > 10) {
                try {
                    await updateDoc(userRef, pendingUpdates.current);
                    lastWriteTime.current = now;
                    pendingUpdates.current = {};
                    console.log('✅ Firebase synced (throttled)');
                } catch (err) {
                    console.error('Firebase write error:', err);
                }
            } else {
                console.log(`⏳ Firebase write throttled (${Math.round((ONE_MINUTE - timeSinceLastWrite) / 1000)}s remaining)`);
            }
        }
    };

    return {
        level,
        xp,
        stats: stats || {}, // Return empty obj if loading to prevent crashes
        earnedBadges,
        recentUnlock,
        setRecentUnlock,
        updateProgress,
        nextLevelXP: getNextLevelTarget(level)
    };
};