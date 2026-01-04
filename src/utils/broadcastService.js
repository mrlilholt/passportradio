import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

let lastBroadcastTime = 0;
const ONE_MINUTE = 60000;

// Call this when the user does something cool (throttled to once per minute)
export const broadcastAction = async (user, actionType, details) => {
    try {
        // Simple safety check to avoid spamming empty data
        if (!details || !details.name) return;
        
        // Throttle: only broadcast once per minute
        const now = Date.now();
        if (now - lastBroadcastTime < ONE_MINUTE) {
            console.log('⏳ Broadcast throttled');
            return;
        }

        // "Guest" or the user's name
        const displayName = user?.displayName || 'Traveler'; 

        await addDoc(collection(db, 'global_activity'), {
            user: displayName,
            action: actionType, // 'listening', 'landed', 'favorited'
            location: details.name, // City Name
            country: details.country,
            stationName: details.stationName || null,
            timestamp: serverTimestamp()
        });
        
        lastBroadcastTime = now;
        console.log('✅ Broadcast synced');
    } catch (error) {
        console.log("Silent broadcast error:", error);
    }
};