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
    const [stats, setStats] = useState(null);
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [recentUnlock, setRecentUnlock] = useState(null);
    
    // Throttle ref
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
                    const currentXP = data.xp || 0;
                    setLevel(getLevelFromXP(currentXP));
                } else {
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

    // 2. THE UPDATE ENGINE
    const updateProgress = async (actionType, payload = {}) => {
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

        // --- B. Check Badges ---
        const context = {
            isNight: new Date().getHours() >= 1 && new Date().getHours() <= 4,
            isMorning: new Date().getHours() >= 5 && new Date().getHours() <= 8
        };

        // B-1. Standard Badges (From the static list)
        BADGES.forEach(badge => {
            const hasInDb = earnedBadges.includes(badge.id);
            const sessionKey = `badge_unlocked_${user.uid}_${badge.id}`;
            const hasInSession = sessionStorage.getItem(sessionKey);

            if (!hasInDb && !hasInSession && badge.condition(newStats, context)) {
                sessionStorage.setItem(sessionKey, 'true');
                updates['badges'] = arrayUnion(badge.id);
                xpGain += badge.xpReward;
                
                // Update Local UI instantly
                setEarnedBadges(prev => [...prev, badge.id]);
                setRecentUnlock(badge); // Calls the popup
            }
        });

        // 🆕 B-2. PARAGON LOGIC (Infinite Levels)
        // ---------------------------------------------------------
        const TITAN_CAP = 60000; // Rank 10 requirement (Minutes)
        const PARAGON_STEP = 1440; // Every 24 hours after Cap

        // Only run math if we are past the Titan Cap
        if (newStats.totalMinutes > TITAN_CAP) {
            // Calculate which Paragon Level we should have
            const calculatedParagonLevel = Math.floor((newStats.totalMinutes - TITAN_CAP) / PARAGON_STEP) + 1;
            
            // Construct the ID
            const paragonBadgeId = `paragon_level_${calculatedParagonLevel}`;
            
            // Check if we already have it
            const hasParagonInDb = earnedBadges.includes(paragonBadgeId);
            const paragonSessionKey = `badge_unlocked_${user.uid}_${paragonBadgeId}`;
            const hasParagonInSession = sessionStorage.getItem(paragonSessionKey);

            if (!hasParagonInDb && !hasParagonInSession) {
                // ✅ UNLOCK PARAGON
                sessionStorage.setItem(paragonSessionKey, 'true');
                updates['badges'] = arrayUnion(paragonBadgeId);
                xpGain += 500; // Fixed Reward for Paragon Levels

                // Update Local UI
                setEarnedBadges(prev => [...prev, paragonBadgeId]);
                
                // We construct a temporary object so the popup works
                setRecentUnlock({
                    id: paragonBadgeId,
                    label: `Paragon Level ${calculatedParagonLevel}`,
                    xpReward: 500,
                    icon: 'Infinity' // handled by your utils
                });
            }
        }
        // ---------------------------------------------------------

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
            setXp(newTotalXP);
            setStats(newStats);
            
            pendingUpdates.current = { ...pendingUpdates.current, ...updates };
            
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
            }
        }
    };

    return {
        level,
        xp,
        stats: stats || {}, 
        earnedBadges,
        recentUnlock,
        setRecentUnlock,
        updateProgress,
        nextLevelXP: getNextLevelTarget(level)
    };
};