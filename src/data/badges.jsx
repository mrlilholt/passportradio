import { 
    Radio, Signal, RadioTower,      // Early Ranks
    Zap, Globe, Award, Crown,       // Elite Ranks
    Sun, Infinity,                  // TITAN RANKS (New)
    Moon, Sunrise, Calendar         // Specials
} from 'lucide-react';

export const BADGES = [
    // ... (Keep your existing ranks 1-7) ...
    {
        id: 'scout_rank_1',
        label: 'Signal Rookie',
        description: 'Listen for 5 minutes total',
        xpReward: 100,
        icon: Radio,
        type: 'scout_rank', 
        condition: (stats) => (stats.totalMinutes || 0) >= 5
    },
    {
        id: 'scout_rank_2',
        label: 'Frequency Finder',
        description: 'Listen for 30 minutes total',
        xpReward: 250,
        icon: Signal,
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 30
    },
    {
        id: 'scout_rank_3',
        label: 'Broadcast Hunter',
        description: 'Listen for 1 hour total',
        xpReward: 500,
        icon: RadioTower,
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 60
    },
    {
        id: 'scout_rank_4',
        label: 'Signal Master',
        description: 'Listen for 5 hours total',
        xpReward: 1000,
        icon: Zap,
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 300
    },
    {
        id: 'scout_rank_5',
        label: 'Global Monitor',
        description: 'Listen for 12 hours total',
        xpReward: 2500,
        icon: Globe,
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 720
    },
    {
        id: 'scout_rank_6',
        label: 'Frequency Sage',
        description: 'Listen for 24 hours total',
        xpReward: 5000,
        icon: Award,
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 1440
    },
    {
        id: 'scout_rank_7',
        label: 'Airwave Legend',
        description: 'Listen for 100 hours total',
        xpReward: 10000,
        icon: Crown,
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 6000
    },

    // ==========================================
    // ⚔️ THE TITAN TIER (Days worth of listening)
    // ==========================================
    {
        id: 'scout_rank_8',
        label: 'Sonic Titan',
        description: 'Listen for 200 hours total',
        xpReward: 20000,
        icon: Sun,
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 12000
    },
    {
        id: 'scout_rank_9',
        label: 'Void Walker',
        description: 'Listen for 500 hours total',
        xpReward: 50000,
        icon: Moon, // Or a specific Void icon
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 30000
    },
    {
        id: 'scout_rank_10', // The Capstone
        label: 'The Constant',
        description: 'Listen for 1,000 hours total',
        xpReward: 100000,
        icon: Infinity,
        type: 'scout_rank',
        condition: (stats) => (stats.totalMinutes || 0) >= 60000
    },

    // ... (Keep your specials: Night Owl, etc.) ...
    {
        id: 'night_owl',
        label: 'Night Owl',
        description: 'Tune in between 1 AM and 4 AM',
        xpReward: 150,
        icon: Moon,
        condition: (stats, context) => context?.isNight === true 
    },
    {
        id: 'early_bird',
        label: 'Early Bird',
        description: 'Tune in between 5 AM and 8 AM',
        xpReward: 150,
        icon: Sunrise,
        condition: (stats, context) => context?.isMorning === true
    },
    {
        id: 'weekend_warrior',
        label: 'Weekend Warrior',
        description: 'Tune in on a Saturday or Sunday',
        xpReward: 100,
        icon: Calendar,
        condition: (stats) => {
            const day = new Date().getDay();
            return day === 0 || day === 6; 
        }
    }
];