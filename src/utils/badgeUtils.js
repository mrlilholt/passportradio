import { BADGES } from '../data/badges';
import { Infinity } from 'lucide-react'; // Make sure to import the icon

export const getBadgeDetails = (badgeId) => {
    // 1. Try to find it in the standard list
    const found = BADGES.find(b => b.id === badgeId);
    if (found) return found;

    // 2. If not found, check if it's a PARAGON Badge
    if (badgeId && badgeId.startsWith('paragon_level_')) {
        const levelStr = badgeId.split('_')[2]; // Extract "1", "2", etc.
        return {
            id: badgeId,
            label: `Paragon Level ${levelStr}`,
            description: 'Infinite progression beyond the known limits.',
            icon: Infinity, // The loop/infinity icon
            xpReward: 500,  // Standard Paragon Reward
            type: 'paragon'
        };
    }

    // 3. Fallback for unknown IDs (Prevents crashes)
    return {
        id: 'unknown',
        label: 'Unknown Badge',
        description: 'Mystery Achievement',
        icon: Infinity,
        xpReward: 0
    };
};