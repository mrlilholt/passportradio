import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Call this when the user does something cool
export const broadcastAction = async (user, actionType, details) => {
    try {
        // Simple safety check to avoid spamming empty data
        if (!details || !details.name) return;

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
    } catch (error) {
        console.log("Silent broadcast error:", error);
    }
};